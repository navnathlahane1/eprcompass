/**
 * POST /api/admin/clients/[clientId]/account
 *
 * Performs account-management actions on a client's Supabase Auth user.
 *
 * Supported actions (pass in JSON body as `action`):
 *   - "reset-password"  → generate a password-reset link (Supabase recovery email)
 *   - "send-welcome"    → generate a magic-link for first-time login
 *   - "toggle-active"   → ban (deactivate) or unban (reactivate) the auth user
 *
 * Security: admin or manager role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin or manager role required' }, { status: 403 });

  const { clientId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action } = body as { action?: string };
  if (!action) return NextResponse.json({ error: '"action" is required in request body' }, { status: 400 });

  const db = makeServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // ── Resolve client → profile_id (= auth user ID) ─────────────────────────

  const { data: client, error: clientFetchError } = await (db as any)
    .from('clients')
    .select('profile_id')
    .eq('id', clientId)
    .maybeSingle();

  if (clientFetchError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const authUserId: string = client.profile_id;

  // ── Fetch auth user (for email + ban status) ──────────────────────────────

  const { data: authUserData, error: authFetchError } = await db.auth.admin.getUserById(authUserId);
  if (authFetchError || !authUserData?.user) {
    return NextResponse.json({ error: 'Auth user not found for this client' }, { status: 404 });
  }
  const authUser = authUserData.user;

  // ── Dispatch by action ────────────────────────────────────────────────────

  switch (action) {
    /**
     * reset-password
     * Generates a Supabase "recovery" link (password-reset email).
     * Admin can copy the link directly or let Supabase send the email.
     */
    case 'reset-password': {
      const { data, error } = await db.auth.admin.generateLink({
        type: 'recovery',
        email: authUser.email!,
        options: { redirectTo: `${siteUrl}/auth/reset-password` },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ url: data.properties?.action_link ?? null, email: authUser.email });
    }

    /**
     * send-welcome
     * Generates a one-time magic link so the client can log in without needing
     * their password. Useful for onboarding new accounts.
     */
    case 'send-welcome': {
      const { data, error } = await db.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser.email!,
        options: { redirectTo: `${siteUrl}/portal/dashboard` },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ url: data.properties?.action_link ?? null, email: authUser.email });
    }

    /**
     * toggle-active
     * Bans (deactivates) or unbans (reactivates) the auth user.
     * Supabase ban_duration '876000h' ≈ 100 years (effectively permanent until lifted).
     */
    case 'toggle-active': {
      const isBanned =
        !!authUser.banned_until && new Date(authUser.banned_until) > new Date();

      const { error } = await db.auth.admin.updateUserById(authUserId, {
        ban_duration: isBanned ? 'none' : '876000h',
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({
        active: isBanned, // was banned → now active
        banned: !isBanned, // was active → now banned
        email: authUser.email,
      });
    }

    default:
      return NextResponse.json(
        { error: `Unknown action "${action}". Valid: reset-password, send-welcome, toggle-active` },
        { status: 400 }
      );
  }
}
