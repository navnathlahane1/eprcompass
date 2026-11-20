/**
 * POST /api/iam/users/[id]/send-invite
 * Sends the role-specific welcome email only after an IAM operator explicitly
 * requests it. The temporary password is never stored or written to logs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { sendUserWelcomeEmail } from '@/lib/iam/userWelcomeEmail';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
    if (parsed?.access_token) return parsed.access_token;
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

async function resolveActor() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const chunks = allCookies
    .filter(cookie => /^sb-.+-auth-token\.\d+$/.test(cookie.name))
    .sort((left, right) => Number(left.name.split('.').pop()) - Number(right.name.split('.').pop()));
  const reassembled = chunks.length ? chunks.map(cookie => cookie.value).join('') : undefined;
  const raw =
    allCookies.find(cookie => cookie.name.endsWith('-access-token') || cookie.name === 'sb-access-token') ??
    (reassembled ? { value: reassembled } : undefined) ??
    allCookies.find(cookie => cookie.name.endsWith('-auth-token') && !cookie.name.match(/\.\d+$/));
  const token = tryParseToken(raw?.value);
  if (!token) return null;

  const client = getAdminClient();
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role || (emailIsSuperAdmin(user.email) ? 'admin' : '');
  if (!['user_manager', 'admin', 'manager'].includes(role)) return null;

  return { id: user.id, email: user.email, fullName: profile?.full_name };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: targetId } = await params;
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) {
    return NextResponse.json({ error: 'Temporary password must be at least 8 characters' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const [{ data: authData, error: authError }, { data: profile, error: profileError }] = await Promise.all([
    adminClient.auth.admin.getUserById(targetId),
    adminClient.from('profiles').select('role, full_name').eq('id', targetId).maybeSingle(),
  ]);

  const targetEmail = authData?.user?.email;
  if (authError || profileError || !targetEmail || !profile?.role) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (profile.role === 'admin') {
    return NextResponse.json({ error: 'Admin accounts cannot receive IAM invite emails' }, { status: 403 });
  }

  const delivery = await sendUserWelcomeEmail({
    userId: targetId,
    email: targetEmail,
    password,
    role: profile.role,
    fullName: profile.full_name,
  });
  if (!delivery.sent) {
    return NextResponse.json({ error: delivery.reason || 'Invite email could not be sent' }, { status: 502 });
  }

  await adminClient.from('iam_audit_log').insert({
    actor_id: actor.id,
    actor_name: actor.fullName || actor.email,
    target_id: targetId,
    target_email: targetEmail,
    action: 'invite_email_sent',
    notes: 'Portal login invite sent by IAM operator',
  });

  return NextResponse.json({ success: true, message: `Invite email sent to ${targetEmail}` });
}
