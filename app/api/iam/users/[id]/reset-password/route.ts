/**
 * POST /api/iam/users/[id]/reset-password
 * Generates a signed Supabase recovery link and delivers it through Resend.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { sendPasswordResetEmail } from '@/lib/iam/passwordResetEmail';
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
  const adminClient = getAdminClient();

  // Get target email
  const { data: authData, error: authErr } = await adminClient.auth.admin.getUserById(targetId);
  if (authErr || !authData?.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const targetEmail = authData.user.email;

  // Guard: never reset admin users
  const { data: profile } = await adminClient
    .from('profiles').select('role, full_name').eq('id', targetId).maybeSingle();
  if (profile?.role === 'admin') {
    return NextResponse.json({ error: 'Cannot reset admin user passwords' }, { status: 403 });
  }

  // Supabase owns the signed recovery token; Resend only delivers the message.
  // IAM_PORTAL_BASE_URL is an explicit staging override. Local IAM sessions must
  // otherwise generate emails that return users to the production application.
  const siteUrl = (process.env.IAM_PORTAL_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: targetEmail,
    options: { redirectTo: `${siteUrl}/auth/reset-password` },
  });

  const resetUrl = linkData?.properties?.action_link;
  const hashedToken = linkData?.properties?.hashed_token;
  if (linkError || !resetUrl || !hashedToken) {
    console.error('IAM password reset link generation failed', {
      userId: targetId,
      message: linkError?.message || 'Missing recovery link properties',
    });
    return NextResponse.json({ error: 'Unable to generate a secure password reset link.' }, { status: 500 });
  }

  const emailResult = await sendPasswordResetEmail({
    userId: targetId,
    email: targetEmail,
    fullName: profile?.full_name,
    resetUrl,
    idempotencyKey: `iam-password-reset-${targetId}-${hashedToken.slice(0, 16)}`,
  });
  if (!emailResult.sent) {
    return NextResponse.json({ error: emailResult.reason }, { status: 502 });
  }

  // Audit
  await adminClient.from('iam_audit_log').insert({
    actor_id: actor.id,
    actor_name: actor.fullName || actor.email,
    target_id: targetId,
    target_email: targetEmail,
    action: 'password_reset',
    notes: 'Password reset email sent via Resend',
  });

  return NextResponse.json({ success: true });
}
