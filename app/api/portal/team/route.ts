import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

const roles = ['MANAGER', 'COMPLIANCE', 'FINANCE', 'VIEWER'];

export async function GET() {
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = adminClient();
  const members = await db.from('client_team_members').select('id,full_name,email,member_role,phone,status,created_at').eq('client_id', actor.clientId).order('created_at');
  const activity = await db.from('client_activity_log').select('id,actor_name,action,detail,created_at').eq('client_id', actor.clientId).order('created_at', { ascending: false }).limit(30);
  const invitations = actor.memberRole === 'OWNER' ? await db.from('client_team_invitations').select('id,email,full_name,member_role,status,expires_at').eq('client_id', actor.clientId).eq('status', 'pending').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(100) : { data: [], error: null };
  if (members.error || activity.error || invitations.error) return NextResponse.json({ error: 'Team records are unavailable. Please retry.' }, { status: 503 });
  return NextResponse.json({ members: members.data, activity: activity.data, invitations: invitations.data, myRole: actor.memberRole }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req); if (rejected) return rejected;
  const actor = await resolveClientActor();
  if (!actor || actor.memberRole !== 'OWNER') return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
  const b = await req.json().catch(() => null);
  const email = typeof b?.email === 'string' ? b.email.trim().toLowerCase() : '';
  const name = typeof b?.full_name === 'string' ? b.full_name.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 160 || !roles.includes(b?.member_role)) return NextResponse.json({ error: 'Valid name, email and team role required' }, { status: 400 });
  const db = adminClient();
  const { data: existing, error: lookupError } = await db.from('client_team_members').select('id').eq('client_id', actor.clientId).eq('email', email).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Team records are unavailable' }, { status: 503 });
  if (existing) return NextResponse.json({ error: 'This email is already on your team' }, { status: 409 });
  const { data: pending, error: pendingError } = await db.from('client_team_invitations').select('id').eq('client_id', actor.clientId).eq('status', 'pending').gt('expires_at', new Date().toISOString()).limit(100);
  if (pendingError) return NextResponse.json({ error: 'Invitations are unavailable' }, { status: 503 });
  if ((pending?.length ?? 0) >= 100) return NextResponse.json({ error: 'Revoke unused invitations before adding more' }, { status: 429 });
  const token = randomBytes(32).toString('hex');
  const { data, error } = await db.from('client_team_invitations').insert({
    client_id: actor.clientId, email, full_name: name, member_role: b.member_role, invited_by: actor.userId,
    token_hash: createHash('sha256').update(token).digest('hex'),
  }).select('id,expires_at').single();
  if (error) return NextResponse.json({ error: error.code === 'P0001' ? error.message : 'Unable to create invitation' }, { status: error.code === 'P0001' ? 409 : 503 });
  return NextResponse.json({ invitation: data, invitationPath: `/team-invitation#token=${token}` }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function DELETE(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req); if (rejected) return rejected;
  const actor = await resolveClientActor();
  if (!actor || actor.memberRole !== 'OWNER') return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (typeof b?.id !== 'string') return NextResponse.json({ error: 'Invitation required' }, { status: 400 });
  const { data, error } = await adminClient().from('client_team_invitations').update({ status: 'revoked' }).eq('id', b.id).eq('client_id', actor.clientId).eq('status', 'pending').select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to revoke invitation' }, { status: 503 });
  return NextResponse.json({ revoked: Boolean(data) });
}
