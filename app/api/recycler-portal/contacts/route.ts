/**
 * GET  /api/recycler-portal/contacts   — list active contacts for this recycler
 * POST /api/recycler-portal/contacts   — add a new contact
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_contacts')
    .select('id, person_name, designation, department, seniority_level, email, phone, linkedin_url, notes, is_active, intel_preserved, created_at')
    .eq('recycler_id', actor.recyclerId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { person_name, designation, department, seniority_level, email, phone, linkedin_url, notes } = body;

  if (!person_name?.trim()) {
    return NextResponse.json({ error: 'person_name is required' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_contacts')
    .insert({
      recycler_id:     actor.recyclerId,
      person_name:     person_name.trim(),
      designation:     designation?.trim() || null,
      department:      department?.trim() || null,
      seniority_level: seniority_level || null,
      email:           email?.trim() || null,
      phone:           phone?.trim() || null,
      linkedin_url:    linkedin_url?.trim() || null,
      notes:           notes?.trim() || null,
      added_by_user:   actor.userId,
    })
    .select('id, person_name, designation, department, seniority_level, email, phone, linkedin_url, notes, is_active, intel_preserved, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data }, { status: 201 });
}
