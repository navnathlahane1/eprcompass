import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { cancelRenewalSequence } from '@/lib/renewal/engine';

async function isAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return ['admin', 'manager'].includes(profile?.role || '');
}

export async function POST(request: Request) {
  if (!(await isAdminManager())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const sequenceId = String(body?.sequenceId || '').trim();
  const reason = String(body?.reason || 'Cancelled manually');

  if (!sequenceId) {
    return NextResponse.json({ error: 'sequenceId is required' }, { status: 400 });
  }

  await cancelRenewalSequence(sequenceId, reason);
  return NextResponse.json({ success: true });
}
