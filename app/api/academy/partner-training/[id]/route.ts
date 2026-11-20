/**
 * DELETE /api/academy/partner-training/[id]  — remove an assignment
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveAcademyUser();
  if (!actor || !ALLOWED_ROLES.includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const { error } = await svc().from('partner_training_assignments').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
