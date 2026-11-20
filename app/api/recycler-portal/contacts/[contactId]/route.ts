/**
 * PATCH  /api/recycler-portal/contacts/[contactId]  — update a contact
 * DELETE /api/recycler-portal/contacts/[contactId]  — soft-delete (sets is_active = false)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ contactId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed: Record<string, unknown> = {};
  for (const key of ['person_name', 'designation', 'department', 'seniority_level', 'email', 'phone', 'linkedin_url', 'notes']) {
    if (body[key] !== undefined) allowed[key] = body[key]?.trim?.() || null;
  }
  if (body.person_name !== undefined && !body.person_name?.trim()) {
    return NextResponse.json({ error: 'person_name cannot be empty' }, { status: 400 });
  }

  const db = adminClient();

  // Confirm ownership
  const { data: existing } = await (db as any)
    .from('recycler_contacts')
    .select('id')
    .eq('id', contactId)
    .eq('recycler_id', actor.recyclerId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const { data, error } = await (db as any)
    .from('recycler_contacts')
    .update(allowed)
    .eq('id', contactId)
    .select('id, person_name, designation, department, seniority_level, email, phone, linkedin_url, notes, is_active, intel_preserved')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_contacts')
    .select('id, intel_preserved')
    .eq('id', contactId)
    .eq('recycler_id', actor.recyclerId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  // Soft-delete: intel-preserved contacts stay visible in intel; others are just hidden
  const { error } = await (db as any)
    .from('recycler_contacts')
    .update({ is_active: false })
    .eq('id', contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
