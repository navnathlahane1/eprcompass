/**
 * GET  /api/partner/team  — list team members + recent activity
 * POST /api/partner/team  — owner adds a team member (provisions a login)
 */
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolvePartnerActor, adminClient } from '@/lib/partnerPortal/partnerAuth';

const VALID_ROLES = ['SALES', 'COMPLIANCE', 'FINANCE', 'VIEWER'];

function tempPassword(): string {
  return 'Epr#' + randomBytes(6).toString('base64url');
}

export async function GET() {
  const actor = await resolvePartnerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const [membersRes, activityRes] = await Promise.all([
    (db as any).from('partner_team_members')
      .select('id, full_name, email, member_role, phone, status, created_at, user_id')
      .eq('partner_id', actor.partnerId).order('created_at', { ascending: true }),
    (db as any).from('partner_activity_log')
      .select('id, actor_name, action, detail, created_at')
      .eq('partner_id', actor.partnerId).order('created_at', { ascending: false }).limit(30),
  ]);

  return NextResponse.json({
    members: membersRes.error ? [] : (membersRes.data ?? []),
    activity: activityRes.error ? [] : (activityRes.data ?? []),
    myRole: actor.memberRole,
  });
}

export async function POST(req: NextRequest) {
  const actor = await resolvePartnerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.memberRole !== 'OWNER') {
    return NextResponse.json({ error: 'Only the account owner can add team members.' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  if (!b.full_name?.trim()) return NextResponse.json({ error: 'full_name is required' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });
  if (!VALID_ROLES.includes(b.member_role)) return NextResponse.json({ error: 'Invalid member_role' }, { status: 400 });

  const db = adminClient();

  const { data: dupe } = await (db as any)
    .from('partner_team_members').select('id').eq('partner_id', actor.partnerId).eq('email', email).maybeSingle();
  if (dupe) return NextResponse.json({ error: 'A team member with this email already exists.' }, { status: 409 });

  const password = tempPassword();
  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (authErr || !authData?.user) {
    return NextResponse.json({ error: authErr?.message || 'Failed to create login' }, { status: 400 });
  }
  const userId = authData.user.id;

  const { error: profErr } = await db.from('profiles').upsert(
    { id: userId, role: 'partner', full_name: b.full_name.trim(), force_password_change: true },
    { onConflict: 'id' }
  );
  if (profErr) {
    await db.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const { data: member, error } = await (db as any)
    .from('partner_team_members')
    .insert({
      partner_id: actor.partnerId,
      user_id: userId,
      full_name: b.full_name.trim(),
      email,
      member_role: b.member_role,
      phone: b.phone?.trim() || null,
      status: 'ACTIVE',
      invited_by: actor.userId,
    })
    .select('id, full_name, email, member_role, phone, status, created_at')
    .single();

  if (error) {
    await db.auth.admin.deleteUser(userId);
    if (error.code === '42P01') return NextResponse.json({ error: 'Team feature not yet migrated.' }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await (db as any).from('partner_activity_log').insert({
    partner_id: actor.partnerId, actor_user_id: actor.userId, actor_name: actor.name,
    action: 'TEAM_MEMBER_ADDED', detail: `${b.full_name.trim()} (${b.member_role})`,
  }).then((r: any) => r, () => {});

  return NextResponse.json({ member, tempPassword: password, loginUrl: '/partner/login' }, { status: 201 });
}
