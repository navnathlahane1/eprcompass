import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    company_name,
    contact_name,
    phone,
    email,
    state,
    city,
    industry,
    gst_number,
    website,
    notes,
  } = body;

  if (!company_name?.trim()) {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
  }

  const db = makeServiceClient();

  // The telecalling app lists from the `leads` table, so the company must be
  // created there for it to show up and be linkable. The deployed leads table
  // is Zoho-style (company_name/name, no contact_name/state/gst columns), so
  // GST/state/notes go into description. The 002_crm migration schema instead
  // has company/contact_name/state with source as an enum — fall back to that
  // shape if the first insert hits unknown columns.
  const description = [
    notes?.trim(),
    gst_number?.trim() ? `GST: ${gst_number.trim()}` : null,
    state?.trim() ? `State: ${state.trim()}` : null,
  ].filter(Boolean).join('\n') || null;

  // Business rule: a lead with no phone number is never allocated to a
  // telecaller. Self-assign the creating agent only when a phone was provided;
  // otherwise the company is created unassigned until a phone is added.
  const hasPhone = !!phone?.trim();

  const common = {
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    city: city?.trim() || null,
    industry: industry?.trim() || null,
    website: website?.trim() || null,
    referral_source_detail: 'telecaller_manual',
    stage: 'New',
    tc_status: 'New',
    tc_assigned_agent: hasPhone ? actor.userId : null,
    tc_enrichment_status: 'queued',
  };

  const liveShape: Record<string, any> = {
    ...common,
    company_name: company_name.trim(),
    // live leads.name is NOT NULL — default to the company name when no
    // contact person is given (existing convention for intel-imported rows)
    name: contact_name?.trim() || company_name.trim(),
    description,
    source: 'telecaller_manual',
  };

  const crmShape: Record<string, any> = {
    ...common,
    company: company_name.trim(),
    contact_name: contact_name?.trim() || null,
    state: state?.trim() || null,
    description: [notes?.trim(), gst_number?.trim() ? `GST: ${gst_number.trim()}` : null].filter(Boolean).join('\n') || null,
    source: 'Direct', // source is an enum in this schema — only valid values
  };

  let lead: { id: string } | null = null;
  let leadErr: string | null = null;
  for (const shape of [liveShape, crmShape]) {
    const { data, error } = await db.from('leads').insert(shape).select('id').single();
    if (!error && data) { lead = data; break; }
    leadErr = error?.message || 'Insert failed';
  }

  if (!lead) {
    return NextResponse.json({ error: leadErr }, { status: 500 });
  }

  // Queue AI enrichment (tc_enrichment_queue is the queue keyed to leads.id)
  const { error: queueErr } = await db.from('tc_enrichment_queue').upsert({
    lead_id: lead!.id,
    status: 'pending',
    priority: 7,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'lead_id' });

  if (queueErr) {
    // Lead is saved; enrichment can be retried from the lead page
    await db.from('leads').update({ tc_enrichment_status: 'none' }).eq('id', lead!.id);
  }

  // Push to intel (best-effort, non-blocking)
  const intelResult = await pushToIntel({ company_name, state, city, gst_number, website, industry });

  return NextResponse.json({
    lead,
    intel_company_id: intelResult?.companyId ?? null,
    intel_queued: true,
    enrichment_queued: !queueErr,
  });
}

async function pushToIntel(fields: {
  company_name: string;
  state?: string;
  city?: string;
  gst_number?: string;
  website?: string;
  industry?: string;
}) {
  try {
    const baseUrl = getIntelApiBaseUrl();
    if (!baseUrl) return null;

    // We need an intel auth token — use the service intel secret if configured
    const intelSecret = process.env.INTEL_API_SECRET || process.env.INTEL_ADMIN_TOKEN || '';

    // Ingest as a single manual-entry record via the scrape endpoint
    const payload = {
      source_name: 'telecaller_manual_entry',
      source_type: 'manual_entry',
      records: [
        {
          company_name: fields.company_name,
          state: fields.state || '',
          city: fields.city || '',
          gstin: fields.gst_number || '',
          website: fields.website || '',
          industry: fields.industry || '',
          segment_tag: 'Prospect',
          data_origin: 'telecaller',
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/intel/ingest/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(intelSecret ? { Authorization: `Bearer ${intelSecret}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return { companyId: data?.company_id || data?.companyId || null };
  } catch {
    return null;
  }
}
