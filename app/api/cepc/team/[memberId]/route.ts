/**
 * PATCH  /api/cepc/team/[memberId]  — change role / suspend / reactivate
 * DELETE /api/cepc/team/[memberId]  — remove member (revokes login)
 * Owner-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCepcActor, adminClient } from '@/lib/cepc/cepcAuth';

type Params = { params: Promise<{ memberId: string }> };
const VALID_ROLES = ['COORDINATOR', 'COMPLIANCE', 'VIEWER'];

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveCepcActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.memberRole !== 'OWNER') return NextResponse.json({ error: 'Only the owner can manage the team.' }, { status: 403 });

  const { memberId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: member } = await (db as any)
    .from('cepc_team_members').select('id, full_name, member_role, status')
    .eq('id', memberId).eq('cepc_profile_id', actor.cepcProfileId).maybeSingle();
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

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
    .from('cepc_team_members').update(update).eq('id', memberId).select('id, full_name, email, member_role, phone, status, created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (db as any).from('cepc_activity_log').insert({
    cepc_profile_id: actor.cepcProfileId, actor_user_id: actor.userId, actor_name: actor.name,
    action: b.status ? `TEAM_MEMBER_${b.status}` : 'TEAM_MEMBER_UPDATED', detail: member.full_name,
  }).then((r: any) => r, () => {});

  return NextResponse.json({ member: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveCepcActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.memberRole !== 'OWNER') return NextResponse.json({ error: 'Only the owner can manage the team.' }, { status: 403 });

  const { memberId } = await params;
  const db = adminClient();

  const { data: member } = await (db as any)
    .from('cepc_team_members').select('id, full_name, user_id')
    .eq('id', memberId).eq('cepc_profile_id', actor.cepcProfileId).maybeSingle();
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  await (db as any).from('cepc_team_members').delete().eq('id', memberId);

  if (member.user_id) {
    await db.auth.admin.deleteUser(member.user_id).catch(() => {});
  }

  await (db as any).from('cepc_activity_log').insert({
    cepc_profile_id: actor.cepcProfileId, actor_user_id: actor.userId, actor_name: actor.name,
    action: 'TEAM_MEMBER_REMOVED', detail: member.full_name,
  }).then((r: any) => r, () => {});

  return NextResponse.json({ ok: true });
}
