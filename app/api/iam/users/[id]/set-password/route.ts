/**
 * POST /api/iam/users/[id]/set-password
 * Directly sets a new password for a target user via Supabase Auth admin API.
 * Unlike reset-password (which emails a reset link), this lets an IAM operator
 * choose the new password immediately.
 *
 * Body: { password: string, force_change?: boolean }
 *   force_change=true  → user must change the password again on next login.
 *   force_change=false → the admin-set password is final (default).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const p = JSON.parse(raw);
    if (typeof p === 'string') return p;
    if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
    if (p?.access_token) return p.access_token;
  } catch {}
  return raw;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function resolveActor(req: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.getAll().find(
    c => c.name.endsWith('-access-token') || c.name === 'sb-access-token'
  );
  const token = tryParseToken(raw?.value);
  if (!token) return null;
  const client = getAdminClient();
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await client.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  const role = profile?.role || (emailIsSuperAdmin(user.email) ? 'admin' : '');
  if (!['user_manager', 'admin', 'manager'].includes(role)) return null;
  return { id: user.id, email: user.email, role, fullName: profile?.full_name };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: targetId } = await params;
  const body = await req.json().catch(() => ({}));
  const password: string = body?.password ?? '';
  const forceChange: boolean = !!body?.force_change;

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const adminClient = getAdminClient();

  // Get target email + guard against acting on admin users
  const { data: authData, error: authErr } = await adminClient.auth.admin.getUserById(targetId);
  if (authErr || !authData?.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const targetEmail = authData.user.email;

  const { data: profile } = await adminClient
    .from('profiles').select('role').eq('id', targetId).maybeSingle();
  if (profile?.role === 'admin') {
    return NextResponse.json({ error: 'Cannot change admin user passwords' }, { status: 403 });
  }

  // Set the new password directly
  const { error: updateErr } = await adminClient.auth.admin.updateUserById(targetId, { password });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Sync the force-change flag so the admin-set password behaves as intended:
  // either final (default) or requiring a change on the user's next login.
  await adminClient.from('profiles')
    .update({ force_password_change: forceChange })
    .eq('id', targetId);

  // Audit (never log the password itself)
  await adminClient.from('iam_audit_log').insert({
    actor_id: actor.id,
    actor_name: actor.fullName || actor.email,
    target_id: targetId,
    target_email: targetEmail,
    action: 'password_set',
    notes: forceChange
      ? 'Password set by operator; user must change on next login'
      : 'Password set directly by operator',
  });

  return NextResponse.json({ success: true });
}
