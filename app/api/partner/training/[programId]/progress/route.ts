/**
 * PATCH /api/partner/training/[programId]/progress
 * Upsert a partner's progress record for a program.
 * Body: { status: 'not_started' | 'in_progress' | 'completed' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { programId } = await params;
  const { status } = await req.json();
  if (!['not_started', 'in_progress', 'completed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = svc();
  const { data: partner } = await db
    .from('partners').select('id').eq('profile_id', user.id).maybeSingle();
  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  const now = new Date().toISOString();
  const { error } = await db.from('partner_training_progress').upsert({
    partner_id:   partner.id,
    program_id:   programId,
    status,
    started_at:   status !== 'not_started' ? now : null,
    completed_at: status === 'completed'   ? now : null,
    updated_at:   now,
  }, { onConflict: 'partner_id,program_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
