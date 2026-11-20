/**
 * GET  /api/admin/telecalling/leads/[id]/contacts
 *   → Returns associated people for this lead.
 *   If lead has intel_company_id  → reads from intel_company_associated_people
 *   Otherwise                     → reads from tc_lead_contacts (local fallback)
 *
 * POST /api/admin/telecalling/leads/[id]/contacts
 *   → Creates a new contact.
 *   If lead has intel_company_id  → writes to intel_company_associated_people (visible in Intel immediately)
 *   Otherwise                     → writes to tc_lead_contacts; marks unsynced
 */
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

function emailValid(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { id: leadId } = await params;

  // Fetch lead to get intel_company_id.
  // NOTE: select('*') — some live `leads` tables (Zoho-style) don't have an
  // intel_company_id column. Naming it explicitly would make PostgREST error
  // (42703) and return null, surfacing a bogus "Lead not found". With '*' the
  // column is simply absent (undefined → falsy → local fallback path).
  const { data: lead } = await db.from('leads').select('*').eq('id', leadId).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  if (lead.intel_company_id) {
    // Read directly from Intel
    const { data, error } = await db
      .from('intel_company_associated_people')
      .select('id, person_name, designation, email, phone, linkedin_url, notes, department, seniority_level, source_type, confidence_score, is_placeholder, last_verified_at, created_at, updated_at, data_points')
      .eq('company_id', lead.intel_company_id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contacts: data || [], source: 'intel', intel_company_id: lead.intel_company_id });
  }

  // Fallback: local tc_lead_contacts
  const { data, error } = await db
    .from('tc_lead_contacts')
    .select('id, person_name, designation, email, phone, linkedin_url, notes, department, seniority_level, created_at, updated_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  // Table may not exist yet — return empty gracefully
  if (error && error.message?.includes('tc_lead_contacts')) {
    return NextResponse.json({ contacts: [], source: 'local', intel_company_id: null });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contacts: data || [], source: 'local', intel_company_id: null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { id: leadId } = await params;
  const body = await req.json();

  const personName = (body.person_name || '').trim() || null;
  const designation = (body.designation || '').trim() || null;
  const email = (body.email || '').trim().toLowerCase() || null;
  const phone = (body.phone || '').trim() || null;
  const linkedinUrl = (body.linkedin_url || '').trim() || null;
  const notes = (body.notes || '').trim() || null;
  const department = (body.department || '').trim() || null;
  const seniorityLevel = (body.seniority_level || '').trim() || null;

  if (!email && !phone && !linkedinUrl) {
    return NextResponse.json({ error: 'Provide at least one of: email, phone, or linkedin_url' }, { status: 400 });
  }
  if (email && !emailValid(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Fetch lead. select('*') so a missing intel_company_id column on Zoho-style
  // `leads` tables can't error the query and produce a false "Lead not found".
  const { data: lead } = await db.from('leads').select('*').eq('id', leadId).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const now = new Date().toISOString();

  if (lead.intel_company_id) {
    // Write directly to intel_company_associated_people
    const { data, error } = await db
      .from('intel_company_associated_people')
      .insert({
        company_id: lead.intel_company_id,
        person_name: personName || `Contact @ ${lead.company_name || leadId}`,
        designation,
        email,
        phone,
        linkedin_url: linkedinUrl,
        notes,
        department,
        seniority_level: seniorityLevel,
        source_type: 'telecaller',
        source_vendor: 'telecalling_module',
        confidence_score: 0.85,
        is_placeholder: !personName,
        last_verified_at: now,
        data_points: { lead_id: leadId, added_by_agent: actor.userId },
        created_by: actor.userId,
        updated_by: actor.userId,
      })
      .select('id, person_name, designation, email, phone, linkedin_url, notes, department, seniority_level, source_type, is_placeholder, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data, synced_to_intel: true, intel_company_id: lead.intel_company_id }, { status: 201 });
  }

  // Fallback: write to tc_lead_contacts (local, not yet in Intel)
  const { data, error } = await db
    .from('tc_lead_contacts')
    .insert({
      lead_id: leadId,
      person_name: personName,
      designation,
      email,
      phone,
      linkedin_url: linkedinUrl,
      notes,
      department,
      seniority_level: seniorityLevel,
      created_by: actor.userId,
    })
    .select('id, person_name, designation, email, phone, linkedin_url, notes, department, seniority_level, created_at')
    .single();

  if (error && error.message?.includes('tc_lead_contacts')) {
    return NextResponse.json({
      error: 'This lead is not linked to Intel yet. Link it first, then add contacts.',
      hint: 'no_intel_link',
    }, { status: 422 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contact: data, synced_to_intel: false, intel_company_id: null }, { status: 201 });
}
