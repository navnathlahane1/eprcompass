/**
 * PATCH  /api/portal/team/[memberId]  — change role / suspend / reactivate
 * DELETE /api/portal/team/[memberId]  — remove member (revokes login)
 * Owner-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

type Params = { params: Promise<{ memberId: string }> };
const VALID_ROLES = ['MANAGER', 'COMPLIANCE', 'FINANCE', 'VIEWER'];

export async function PATCH(req: NextRequest, { params }: Params) {
  const rejected = rejectUnsafeWorkspaceWrite(req); if (rejected) return rejected;
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.memberRole !== 'OWNER') return NextResponse.json({ error: 'Only the owner can manage the team.' }, { status: 403 });

  const { memberId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: member } = await (db as any)
    .from('client_team_members').select('id, full_name, member_role, status')
    .eq('id', memberId).eq('client_id', actor.clientId).maybeSingle();
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  if (member.member_role === 'OWNER') return NextResponse.json({ error: 'Owner access is managed by staff' }, { status: 403 });

  const update: Record<string, any> = {};
  if (b.member_role !== undefined) {
    if (!VALID_ROLES.includes(b.member_role)) return NextResponse.json({ error: 'Invalid member_role' }, { status: 400 });
    update.member_role = b.member_role;
  }
  if (b.status !== undefined) {
    if (!['ACTIVE', 'SUSPENDED'].includes(b.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    update.status = b.status;
  }
  if (b.phone !== undefined) update.phone = b.phone?.trim() || null;

  const { data, error } = await (db as any)
    .from('client_team_members').update(update).eq('id', memberId).eq('client_id', actor.clientId).select('id, full_name, email, member_role, phone, status, created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (db as any).from('client_activity_log').insert({
    client_id: actor.clientId, actor_user_id: actor.userId, actor_name: actor.name,
    action: b.status ? `TEAM_MEMBER_${b.status}` : 'TEAM_MEMBER_UPDATED', detail: member.full_name,
  }).then((r: any) => r, () => {});

  return NextResponse.json({ member: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const rejected = rejectUnsafeWorkspaceWrite(_req); if (rejected) return rejected;
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.memberRole !== 'OWNER') return NextResponse.json({ error: 'Only the owner can manage the team.' }, { status: 403 });

  const { memberId } = await params;
  const db = adminClient();

  const { data: member } = await (db as any)
    .from('client_team_members').select('id, full_name, user_id, member_role')
    .eq('id', memberId).eq('client_id', actor.clientId).maybeSingle();
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  if (member.member_role === 'OWNER') return NextResponse.json({ error: 'Owner access is managed by staff' }, { status: 403 });
  const { error: deleteError } = await (db as any).from('client_team_members').delete().eq('id', memberId).eq('client_id', actor.clientId);
  if (deleteError) return NextResponse.json({ error: 'Unable to remove membership' }, { status: 503 });

  await (db as any).from('client_activity_log').insert({
    client_id: actor.clientId, actor_user_id: actor.userId, actor_name: actor.name,
    action: 'TEAM_MEMBER_REMOVED', detail: member.full_name,
  }).then((r: any) => r, () => {});

  return NextResponse.json({ ok: true });
}
