// Phase 1 — Merge telecaller_leads (panel) into the live `leads` table.
// DRY-RUN by default. Pass --apply to write.
// Strategy (approved): match each panel lead to an existing `leads` row by
// normalized phone, then normalized company_name. Matched -> PATCH (assign agent,
// upgrade tc_status, append preserved notes). Unmatched -> INSERT new lead.
// Assignment: explicit panel owner -> mapped /telecalling profile; unassigned ->
// round-robin using configured agent IDs.
//
// Usage:
//   node scripts/migrate_telecaller_leads_to_leads.mjs           (dry-run)
//   node scripts/migrate_telecaller_leads_to_leads.mjs --apply    (writes)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ---- identity map: panel telecaller_users.id -> /telecalling profile id ----
const AGENT_A = env.TELECALLER_AGENT_A_ID;
const AGENT_B = env.TELECALLER_AGENT_B_ID;
const TU_TO_AGENT = {
  [env.TELECALLER_SOURCE_AGENT_A_ID]: AGENT_A,
  [env.TELECALLER_SOURCE_AGENT_B_ID]: AGENT_B,
};
const RR = [AGENT_A, AGENT_B];
const AGENT_NAME = { [AGENT_A]: env.TELECALLER_AGENT_A_LABEL || 'Agent A', [AGENT_B]: env.TELECALLER_AGENT_B_LABEL || 'Agent B' };

const STATUS_RANK = { 'New': 1, 'Contacted': 2, 'Interested': 3 };
const normPhone = p => String(p || '').replace(/\D/g, '').slice(-10);
const normCompany = n => String(n || '').toLowerCase()
  .replace(/\s+(pvt|private|ltd|limited|llp|inc|corp)\.?\s*/g, ' ')
  .replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
const clean = v => { const s = String(v ?? '').trim(); return (s === '' || s === 'null' || s === 'nan') ? null : s; };

async function fetchAll(table, select) {
  const all = [];
  for (let page = 0; page < 200; page++) {
    const { data, error } = await db.from(table).select(select).range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

function preservedBlock(p, { full }) {
  const parts = [];
  const add = (k, v) => { const c = clean(v); if (c) parts.push(`${k}=${c}`); };
  add('status', p.status);
  add('interest', p.interest_level);
  add('telecaller', p.telecaller_name);
  add('call_date', p.call_date);
  add('service', p.service_interest);
  if (full) { add('state', p.state); add('city', p.city); add('address', p.address); add('gst', p.gst_number); add('entity', p.entity_type); add('rank', p.lead_rank); add('fy', p.fy); add('call_status', p.call_status); }
  add('notes', p.notes);
  return parts.length ? `[TC panel migration ${new Date().toISOString().slice(0,10)}] ${parts.join(' | ')}` : null;
}

(async () => {
  console.log(`MODE: ${APPLY ? 'APPLY (writing)' : 'DRY-RUN (no writes)'}\n`);

  const panel = await fetchAll('telecaller_leads', '*');
  const liveAll = panel.filter(p => !p.deleted_at);
  console.log(`panel telecaller_leads (live): ${liveAll.length}`);

  const leads = await fetchAll('leads', 'id, phone, mobile, company_name, name, tc_status, tc_assigned_agent, assigned_to, description');
  console.log(`existing leads: ${leads.length}`);

  // build lookup maps
  const phoneMap = new Map(); const companyMap = new Map();
  for (const l of leads) {
    for (const ph of [l.phone, l.mobile]) { const n = normPhone(ph); if (n.length === 10 && !phoneMap.has(n)) phoneMap.set(n, l); }
    const c = normCompany(l.company_name || l.name); if (c && !companyMap.has(c)) companyMap.set(c, l);
  }

  // resolve agent per panel lead (round-robin only advances for unassigned)
  let rr = 0;
  const resolveAgent = (p) => {
    if (p.assigned_to && TU_TO_AGENT[p.assigned_to]) return { agent: TU_TO_AGENT[p.assigned_to], explicit: true };
    const a = RR[rr % 2]; rr++; return { agent: a, explicit: false };
  };

  const groups = new Map(); // key: leadId or INSERT#n -> {leadRow|null, panelRows:[], agents:[], statuses:[]}
  let insertSeq = 0;
  let matchedByPhone = 0, matchedByCompany = 0, unmatched = 0;

  for (const p of liveAll) {
    const { agent, explicit } = resolveAgent(p);
    let match = null, via = null;
    const np = normPhone(p.phone);
    if (np.length === 10 && phoneMap.has(np)) { match = phoneMap.get(np); via = 'phone'; }
    if (!match) { const nc = normCompany(p.company_name); if (nc && companyMap.has(nc)) { match = companyMap.get(nc); via = 'company'; } }

    const key = match ? `L:${match.id}` : `INSERT#${insertSeq++}`;
    if (!groups.has(key)) groups.set(key, { leadRow: match, panelRows: [], agents: [], statuses: [] });
    const g = groups.get(key);
    g.panelRows.push(p); g.agents.push({ agent, explicit }); g.statuses.push(p.status);
    if (match) { if (via === 'phone') matchedByPhone++; else matchedByCompany++; } else unmatched++;
  }

  // finalize per-group decisions
  const updates = []; const inserts = []; const assignTally = { [NIDA]: 0, [NIKITA]: 0 };
  for (const [key, g] of groups) {
    // agent: prefer first explicit, else first
    const explicitAgent = g.agents.find(a => a.explicit);
    const agent = (explicitAgent || g.agents[0]).agent;
    assignTally[agent]++;
    // best status
    const bestStatus = g.statuses.reduce((b, s) => (STATUS_RANK[s] || 0) > (STATUS_RANK[b] || 0) ? s : b, g.statuses[0]);

    if (g.leadRow) {
      const l = g.leadRow;
      const patch = { tc_assigned_agent: agent, updated_at: new Date().toISOString() };
      if (!l.assigned_to) patch.assigned_to = agent;
      // tc_status upgrade only
      if ((STATUS_RANK[bestStatus] || 0) > (STATUS_RANK[l.tc_status] || 0)) patch.tc_status = bestStatus;
      // append preserved notes (one block per panel row)
      const blocks = g.panelRows.map(p => preservedBlock(p, { full: false })).filter(Boolean);
      if (blocks.length) patch.description = [clean(l.description), ...blocks].filter(Boolean).join('\n\n');
      updates.push({ id: l.id, patch });
    } else {
      const p = g.panelRows[0];
      inserts.push({
        company_name: clean(p.company_name), name: clean(p.company_name),
        email: clean(p.email), phone: clean(p.phone), city: clean(p.city),
        website: clean(p.website), industry: clean(p.industry),
        lead_score: p.lead_score ?? null,
        stage: 'New', source: 'TC Panel Migration',
        tc_status: bestStatus || 'New',
        tc_assigned_agent: agent, assigned_to: agent,
        description: preservedBlock(p, { full: true }),
      });
    }
  }

  console.log(`\n-- match results --`);
  console.log(`matched by phone:   ${matchedByPhone}`);
  console.log(`matched by company: ${matchedByCompany}`);
  console.log(`unmatched (insert): ${unmatched}`);
  console.log(`distinct leads rows to UPDATE: ${updates.length}`);
  console.log(`new leads to INSERT:           ${inserts.length}`);
  console.log(`\n-- assignment tally (rows touched) --`);
  console.log(`Nida (${NIDA}):   ${assignTally[NIDA]}`);
  console.log(`Nikita (${NIKITA}): ${assignTally[NIKITA]}`);
  const statusUpgrades = updates.filter(u => u.patch.tc_status).length;
  console.log(`\nrows getting tc_status upgrade -> Interested/Contacted: ${statusUpgrades}`);

  console.log(`\n-- sample (first 8 updates) --`);
  for (const u of updates.slice(0, 8)) console.log(JSON.stringify(u));
  if (inserts.length) { console.log(`\n-- sample (first 5 inserts) --`); for (const i of inserts.slice(0, 5)) console.log(JSON.stringify(i)); }

  if (!APPLY) { console.log('\nDRY-RUN complete. Re-run with --apply to write.'); return; }

  // ---- APPLY ----
  console.log('\nAPPLYING...');
  let okU = 0, errU = 0;
  for (const u of updates) {
    const { error } = await db.from('leads').update(u.patch).eq('id', u.id);
    if (error) { errU++; if (errU <= 5) console.log(`update err ${u.id}: ${error.message}`); } else okU++;
  }
  console.log(`updates: ${okU} ok, ${errU} err`);

  let okI = 0, errI = 0;
  for (let i = 0; i < inserts.length; i += 200) {
    const batch = inserts.slice(i, i + 200);
    const { data, error } = await db.from('leads').insert(batch).select('id');
    if (error) { errI += batch.length; if (errI <= 5) console.log(`insert err: ${error.message}`); } else okI += (data?.length || 0);
  }
  console.log(`inserts: ${okI} ok, ${errI} err`);
  console.log('\nDONE.');
})();
