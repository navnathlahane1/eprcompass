/**
 * GET  /api/academy/partner-training  — list all assignments + programs (academy roles)
 * POST /api/academy/partner-training  — create an assignment
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveAcademyUser } from '@/lib/academy/auth';

export const runtime = 'nodejs';

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

const ALLOWED_ROLES = ['academy_director', 'academy_manager', 'training_program_manager', 'admin'];

export async function GET() {
  const actor = await resolveAcademyUser();
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = svc();
  const [{ data: programs }, { data: assignments }] = await Promise.all([
    db.from('academy_programs')
      .select('id, title, delivery_mode, status, content_url, start_date, duration_hours')
      .order('created_at', { ascending: false }),
    db.from('partner_training_assignments')
      .select('id, program_id, target_type, partner_type, partner_tier, partner_id, assigned_at, academy_programs:program_id(title, delivery_mode)')
      .order('assigned_at', { ascending: false }),
  ]);

  return NextResponse.json({ programs: programs || [], assignments: assignments || [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyUser();
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { program_id, target_type, partner_type, partner_tier, partner_id, content_url } = body;

  if (!program_id || !target_type) {
    return NextResponse.json({ error: 'program_id and target_type are required' }, { status: 400 });
  }

  const db = svc();

  // Optionally persist content_url on the program (for recorded/self-paced)
  if (content_url) {
    await db.from('academy_programs').update({ content_url }).eq('id', program_id);
  }

  const { data, error } = await db
    .from('partner_training_assignments')
    .insert({
      program_id,
      target_type,
      partner_type:  target_type === 'partner_type'      ? partner_type  : null,
      partner_tier:  target_type === 'partner_tier'      ? partner_tier  : null,
      partner_id:    target_type === 'specific_partner'  ? partner_id    : null,
      assigned_by: actor.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignment: data }, { status: 201 });
}
