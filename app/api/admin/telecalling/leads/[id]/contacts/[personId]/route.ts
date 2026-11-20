/**
 * PATCH /api/admin/telecalling/leads/[id]/contacts/[personId]
 *   → Updates a contact in intel_company_associated_people (if Intel-linked)
 *     or tc_lead_contacts (local fallback).
 *
 * DELETE /api/admin/telecalling/leads/[id]/contacts/[personId]
 *   → Removes the contact from whichever table it lives in.
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; personId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { id: leadId, personId } = await params;
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

  // select('*') so a missing intel_company_id column on Zoho-style `leads`
  // tables can't error the query and produce a false "Lead not found".
  const { data: lead } = await db.from('leads').select('*').eq('id', leadId).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const now = new Date().toISOString();

  if (lead.intel_company_id) {
    const patch = {
      person_name: personName,
      designation,
      email,
      phone,
      linkedin_url: linkedinUrl,
      notes,
      department,
      seniority_level: seniorityLevel,
      source_type: 'telecaller',
      is_placeholder: !personName,
      last_verified_at: now,
      updated_at: now,
      updated_by: actor.userId,
    };

    const { data, error } = await db
      .from('intel_company_associated_people')
      .update(patch)
      .eq('id', personId)
      .eq('company_id', lead.intel_company_id)
      .select('id, person_name, designation, email, phone, linkedin_url, notes, department, seniority_level, updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data, synced_to_intel: true });
  }

  // Local fallback
  const { data, error } = await db
    .from('tc_lead_contacts')
    .update({ person_name: personName, designation, email, phone, linkedin_url: linkedinUrl, notes, department, seniority_level: seniorityLevel, updated_at: now })
    .eq('id', personId)
    .eq('lead_id', leadId)
    .select('id, person_name, designation, email, phone, linkedin_url, notes, department, seniority_level, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data, synced_to_intel: false });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; personId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { id: leadId, personId } = await params;

  // select('*') so a missing intel_company_id column on Zoho-style `leads`
  // tables can't error the query and produce a false "Lead not found".
  const { data: lead } = await db.from('leads').select('*').eq('id', leadId).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  if (lead.intel_company_id) {
    const { error } = await db
      .from('intel_company_associated_people')
      .delete()
      .eq('id', personId)
      .eq('company_id', lead.intel_company_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, synced_to_intel: true });
  }

  const { error } = await db
    .from('tc_lead_contacts')
    .delete()
    .eq('id', personId)
    .eq('lead_id', leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, synced_to_intel: false });
}
