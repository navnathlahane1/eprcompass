import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// The deployed leads table is Zoho-style (company in `company_name`, person in
// `name`/`first_name`/`last_name`, phone often in `mobile`) while the 002_crm
// migration schema uses `company`/`contact_name`. Normalize the embedded lead so
// the UI can rely on company / company_name / contact_name / phone regardless of
// which schema this deployment has. See also normalizeLead in the leads route.
function normalizeLeadEmbed(lead: Record<string, any> | null | undefined) {
  if (!lead) return lead ?? null;
  const company = lead.company_name ?? lead.company ?? null;
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ');
  const contact =
    lead.contact_name ||
    fullName ||
    (lead.name && lead.name !== company ? lead.name : null) ||
    null;
  return {
    ...lead,
    company,
    company_name: company,
    contact_name: contact,
    phone: lead.phone ?? lead.mobile ?? null,
  };
}

// Live (Zoho-style) embed first, CRM-migration embed as fallback. Selecting a
// column the leads table doesn't have makes the whole PostgREST query error, so
// we try each shape until one succeeds.
const LEAD_EMBEDS = [
  `lead:leads(company_name, name, first_name, last_name, phone, mobile)`,
  `lead:leads(company, contact_name, phone)`,
];

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agent_id');
  const campaignId = searchParams.get('campaign_id');
  const disposition = searchParams.get('disposition');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const buildQuery = (leadEmbed: string) => {
    let query = db.from('tc_calls')
      .select(`*, ${leadEmbed}, agent:profiles!tc_calls_agent_id_fkey(full_name), campaign:tc_campaigns(name)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Non-admins (telecallers) only see their own calls
    if (!actor!.isAdmin) query = query.eq('agent_id', actor!.userId);
    else if (agentId) query = query.eq('agent_id', agentId);
    if (campaignId) query = query.eq('campaign_id', campaignId);
    if (disposition) query = query.eq('disposition', disposition);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    return query;
  };

  let lastError = 'Failed to load calls';
  for (const leadEmbed of LEAD_EMBEDS) {
    const { data, count, error } = await buildQuery(leadEmbed);
    if (!error) {
      const calls = (data || []).map((c: any) => ({ ...c, lead: normalizeLeadEmbed(c.lead) }));
      return NextResponse.json({ calls, total: count, page, limit });
    }
    lastError = error.message;
  }
  return NextResponse.json({ error: lastError }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { lead_id, campaign_id, direction, status, duration_seconds, disposition, notes, next_followup_at, exotel_call_sid } = body;
  if (!lead_id) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });

  const db = makeServiceClient();
  const now = new Date().toISOString();

  const { data: callData, error: callError } = await db.from('tc_calls').insert({
    lead_id,
    campaign_id: campaign_id || null,
    agent_id: actor.userId,
    direction: direction || 'Outbound',
    status: status || 'Completed',
    duration_seconds: duration_seconds || 0,
    disposition: disposition || null,
    notes: notes || null,
    next_followup_at: next_followup_at || null,
    exotel_call_sid: exotel_call_sid || null,
    started_at: now,
    ended_at: now,
  }).select().single();

  if (callError) return NextResponse.json({ error: callError.message }, { status: 500 });

  // Increment lead call counter
  await db.from('leads').update({ tc_last_called_at: now }).eq('id', lead_id);
  const { data: currentLead } = await db.from('leads').select('tc_call_count').eq('id', lead_id).maybeSingle();
  if (currentLead) {
    await db.from('leads').update({ tc_call_count: (currentLead.tc_call_count || 0) + 1 }).eq('id', lead_id);
  }

  return NextResponse.json({ call: callData }, { status: 201 });
}
