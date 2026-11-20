/**
 * POST /api/iam/users/[id]/ban   — ban a user
 * POST /api/iam/users/[id]/ban   body: { unban: true } — unban a user
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
  const isSuperAdmin = emailIsSuperAdmin(user.email);
  const role = profile?.role || (isSuperAdmin ? 'admin' : '');
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
  const body = await req.json();
  const { unban, reason } = body;
  const isBanning = !unban;

  const adminClient = getAdminClient();

  // Guard: never ban admin users
  const { data: target } = await adminClient
    .from('profiles').select('role, full_name, is_banned').eq('id', targetId).maybeSingle();

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'admin') return NextResponse.json({ error: 'Cannot ban admin users' }, { status: 403 });

  // Get target email for Supabase Auth ban
  const { data: authUser } = await adminClient.auth.admin.getUserById(targetId);
  const targetEmail = authUser?.user?.email || null;

  if (isBanning) {
    // 1. Set profile flag
    await adminClient.from('profiles').update({
      is_banned: true,
      banned_reason: reason || null,
      banned_at: new Date().toISOString(),
      banned_by: actor.id,
    }).eq('id', targetId);

    // 2. Ban in Supabase Auth (prevents future sign-ins)
    await adminClient.auth.admin.updateUserById(targetId, {
      ban_duration: '87600h', // 10 years ≈ permanent
    });
  } else {
    // 1. Clear profile flag
    await adminClient.from('profiles').update({
      is_banned: false,
      banned_reason: null,
      banned_at: null,
      banned_by: null,
    }).eq('id', targetId);

    // 2. Unban in Supabase Auth
    await adminClient.auth.admin.updateUserById(targetId, {
      ban_duration: 'none',
    });
  }

  // Audit log
  await adminClient.from('iam_audit_log').insert({
    actor_id: actor.id,
    actor_name: actor.fullName || actor.email,
    target_id: targetId,
    target_email: targetEmail,
    action: isBanning ? 'ban' : 'unban',
    new_value: isBanning ? { reason } : {},
    notes: isBanning ? reason : 'Account restored',
  });

  return NextResponse.json({ success: true, banned: isBanning });
}
