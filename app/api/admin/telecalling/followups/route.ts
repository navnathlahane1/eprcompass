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
  const status = searchParams.get('status') || 'Pending';
  const assignedTo = searchParams.get('assigned_to');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const buildQuery = (leadEmbed: string) => {
    let query = db.from('tc_followups')
      .select(`*, ${leadEmbed}, agent:profiles!tc_followups_assigned_to_fkey(full_name)`, { count: 'exact' })
      .order('scheduled_for', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status !== 'all') query = query.eq('status', status);
    // Non-admins (telecallers) only see their own followups
    if (!actor!.isAdmin) query = query.eq('assigned_to', actor!.userId);
    else if (assignedTo) query = query.eq('assigned_to', assignedTo);
    return query;
  };

  let lastError = 'Failed to load followups';
  for (const leadEmbed of LEAD_EMBEDS) {
    const { data, count, error } = await buildQuery(leadEmbed);
    if (!error) {
      const followups = (data || []).map((f: any) => ({ ...f, lead: normalizeLeadEmbed(f.lead) }));
      return NextResponse.json({ followups, total: count, page, limit });
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

  const { lead_id, call_id, assigned_to, type, scheduled_for, notes, priority } = body;
  if (!lead_id || !scheduled_for) return NextResponse.json({ error: 'lead_id and scheduled_for are required' }, { status: 400 });

  const db = makeServiceClient();
  const { data, error } = await db.from('tc_followups').insert({
    lead_id,
    call_id: call_id || null,
    assigned_to: assigned_to || actor.userId,
    type: type || 'Call',
    status: 'Pending',
    scheduled_for,
    notes: notes || null,
    priority: priority || 'Normal',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update lead next call time
  await db.from('leads').update({ tc_next_call_at: scheduled_for }).eq('id', lead_id);

  return NextResponse.json({ followup: data }, { status: 201 });
}
