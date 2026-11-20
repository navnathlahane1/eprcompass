import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req); if (rejected) return rejected;
  const body = await req.json().catch(() => null);
  if (typeof body?.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return NextResponse.json({ error: 'Invalid invitation' }, { status: 400 });
  const db: SupabaseClient = await createServerComponentClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in with the invited email first' }, { status: 401 });
  const { error } = await db.rpc('accept_client_team_invitation', { p_token_hash: createHash('sha256').update(body.token).digest('hex') });
  if (error) {
    const message = error.code === 'P0001' ? error.message : 'Invitation acceptance is unavailable. Contact your account team.';
    return NextResponse.json({ error: message }, { status: error.code === 'P0001' ? 409 : 503 });
  }
  return NextResponse.json({ accepted: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
