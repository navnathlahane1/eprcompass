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

// The deployed leads table is Zoho-style: the company lives in `company_name`,
// the person in `name`/`first_name`/`last_name`, and phone numbers are often
// in `mobile`. (The 002_crm migration schema instead has `company` and
// `contact_name`.) Normalize every row so the UI can rely on
// company_name / contact_name / phone whichever schema this deployment has.
function normalizeLead(row: Record<string, any>) {
  const company = row.company_name ?? row.company ?? null;
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');
  const contact =
    row.contact_name ||
    fullName ||
    (row.name && row.name !== company ? row.name : null) ||
    null;
  // State may be stored directly in a `state` column or encoded in `description` as "State: <value>"
  const stateFromDesc = row.description
    ? (String(row.description).match(/^State:\s*(.+)$/)?.[1] ?? null)
    : null;
  return {
    ...row,
    company_name: company,
    contact_name: contact,
    phone: row.phone ?? row.mobile ?? null,
    state: row.state || stateFromDesc || null,
  };
}

// Strip characters that would break PostgREST's or() filter syntax
function sanitizeSearch(s: string) {
  return s.replace(/[,()%]/g, ' ').trim();
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);
  // The Leads page sends `search`; older callers send `q` — accept both.
  const search = sanitizeSearch(searchParams.get('search') || searchParams.get('q') || '');
  const tcStatus = searchParams.get('tc_status');
  const campaignId = searchParams.get('campaign_id');
  const agentId = searchParams.get('agent_id');
  const enrichmentStatus = searchParams.get('enrichment_status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const applyFilters = (query: any, searchOr: string | null) => {
    let next = query;
    if (search && searchOr) next = next.or(searchOr);
    if (tcStatus) next = next.eq('tc_status', tcStatus);
    if (campaignId) next = next.eq('tc_campaign_id', campaignId);
    if (agentId === 'unassigned') next = next.is('tc_assigned_agent', null);
    else if (agentId) next = next.eq('tc_assigned_agent', agentId);
    if (enrichmentStatus) next = next.eq('tc_enrichment_status', enrichmentStatus);

    // Non-admins see only their assigned leads
    if (!actor!.isAdmin) {
      next = next.eq('tc_assigned_agent', actor!.userId);
    }

    return next;
  };

  const baseQuery = (select: string, searchOr: string | null) =>
    applyFilters(
      db.from('leads')
        .select(select, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      searchOr
    );

  const liveSearchOr = search
    ? `company_name.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`
    : null;
  const crmSearchOr = search
    ? `company.ilike.%${search}%,contact_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
    : null;

  // Attempts in order: full select with joins → plain select(*) for schemas
  // where a join/FK name differs → select(*) with the CRM-schema search
  // columns. First one that succeeds wins.
  const attempts: Array<{ select: string; searchOr: string | null }> = [
    {
      select: `
        id, company_name, name, first_name, last_name, email, phone, mobile, city, state, description, stage, rating,
        tc_status, tc_call_count, tc_last_called_at, tc_next_call_at, tc_enrichment_status,
        tc_campaign_id, tc_assigned_agent,
        enrichment:tc_lead_enrichments(lead_score, epr_applicability_score, epr_category, ai_summary),
        agent:profiles!leads_tc_assigned_agent_fkey(full_name),
        campaign:tc_campaigns!leads_tc_campaign_id_fkey(name)
      `,
      searchOr: liveSearchOr,
    },
    { select: '*', searchOr: liveSearchOr },
    { select: '*', searchOr: crmSearchOr },
  ];

  let lastError = 'Failed to load leads';
  for (const attempt of attempts) {
    const { data, count, error } = await baseQuery(attempt.select, attempt.searchOr);
    if (!error) {
      const leads = (data || []).map(normalizeLead);

      // Fetch last call per lead (disposition + notes so telecaller sees last remark)
      const leadIds = leads.map((l: any) => l.id).filter(Boolean);
      const lastCallMap: Record<string, any> = {};
      if (leadIds.length > 0) {
        const { data: calls } = await db
          .from('tc_calls')
          .select('lead_id, disposition, notes, status, created_at')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false });
        for (const call of calls ?? []) {
          if (!lastCallMap[call.lead_id]) lastCallMap[call.lead_id] = call;
        }
      }

      return NextResponse.json({
        leads: leads.map((l: any) => ({ ...l, last_call: lastCallMap[l.id] || null })),
        total: count,
        page,
        limit,
      });
    }
    lastError = error.message;
  }

  return NextResponse.json({ error: lastError }, { status: 500 });
}
