// Phase 3 — DROP the telecaller_* tables (panel decommission).
// Guards: refuses to run unless the Phase-0 backup manifest exists with the
// expected row counts. Applies SQL via exec_sql RPC, falling back to pg_query.
// DRY-RUN by default; pass --apply to actually drop.
//
// Usage:
//   node scripts/drop_telecaller_tables.mjs           (dry-run / preflight)
//   node scripts/drop_telecaller_tables.mjs --apply    (drops tables)
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(URL_, KEY, { auth: { persistSession: false } });

const TABLES = [
  'telecaller_activity_logs',
  'telecaller_enrichment_queue',
  'telecaller_lead_enrichments',
  'telecaller_lead_imports',
  'telecaller_leads',
  'telecaller_teams',
  'telecaller_users',
];
const SQL = `DROP TABLE IF EXISTS\n  ${TABLES.join(',\n  ')}\nCASCADE;`;

// ---- guard: backup must exist ----
const manifestUrl = new URL('../backups/telecaller_migration_2026-06-16/manifest.json', import.meta.url);
if (!existsSync(manifestUrl)) {
  console.error('ABORT: backup manifest not found. Run backup_telecaller_tables.mjs first.');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));
console.log('Backup manifest counts:', JSON.stringify(manifest.tables));
if ((manifest.tables.telecaller_leads ?? 0) < 203) {
  console.error('ABORT: backup telecaller_leads count looks wrong (<203).');
  process.exit(1);
}

async function tableExists(t) {
  const { error } = await db.from(t).select('id', { head: true, count: 'exact' }).limit(1);
  return !(error && /does not exist|find the table|schema cache/i.test(error.message));
}

(async () => {
  console.log(`\nMODE: ${APPLY ? 'APPLY (dropping)' : 'DRY-RUN (preflight only)'}`);
  console.log('\nSQL to execute:\n' + SQL + '\n');

  console.log('Pre-drop existence check:');
  for (const t of TABLES) console.log(`  ${t}: ${(await tableExists(t)) ? 'exists' : 'absent'}`);

  if (!APPLY) { console.log('\nDRY-RUN complete. Re-run with --apply to drop.'); return; }

  // Try exec_sql RPC, then pg_query RPC.
  let done = false, lastErr = '';
  for (const [fn, payload] of [['exec_sql', { sql: SQL }], ['pg_query', { query: SQL }]]) {
    const { error } = await db.rpc(fn, payload);
    if (!error) { console.log(`\nDropped via ${fn} RPC.`); done = true; break; }
    lastErr = `${fn}: ${error.message}`;
    console.log(`  ${fn} unavailable -> ${error.message}`);
  }
  if (!done) {
    console.error('\nFAILED to drop via RPC. Last error: ' + lastErr);
    console.error('Apply supabase/migrations/151_drop_telecaller_management.sql manually (Supabase SQL editor).');
    process.exit(1);
  }

  console.log('\nPost-drop existence check:');
  for (const t of TABLES) console.log(`  ${t}: ${(await tableExists(t)) ? 'STILL EXISTS' : 'gone'}`);
})();
