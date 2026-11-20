/**
 * POST /api/finance/clear-force-pw
 * Clears force_password_change for the authenticated user.
 * Called immediately after a successful password update on first login.
 */
import { NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  await db.from('profiles').update({ force_password_change: false }).eq('id', actor.id);

  return NextResponse.json({ ok: true });
}
