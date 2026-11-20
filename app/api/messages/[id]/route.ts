/**
 * PATCH /api/messages/[id]
 *
 * Update message state for the current user.
 * id format:
 *   "ann:{recipientId}"  — announcement recipient row
 *   "dm:{messageId}"     — direct message row
 *
 * Body: { action: 'read' | 'dismiss' | 'archive' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const tokenCookie = allCookies.find(
      (c) =>
        c.name.endsWith('-auth-token') ||
        c.name === 'sb-access-token' ||
        c.name.endsWith('-access-token')
    );
    if (!tokenCookie?.value) return null;

    let token = tokenCookie.value;
    if (token.startsWith('[')) {
      try {
        const arr = JSON.parse(token);
        token = Array.isArray(arr) ? arr[0] : token;
      } catch {}
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await db.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action: string = body.action ?? '';

  if (!['read', 'dismiss', 'archive'].includes(action)) {
    return NextResponse.json({ error: 'action must be read, dismiss, or archive' }, { status: 400 });
  }

  const db = makeServiceClient();
  const now = new Date().toISOString();

  // ── Announcement recipient row ─────────────────────────────────────────────
  if (id.startsWith('ann:')) {
    const recipientId = id.slice(4);
    const { data: row } = await db
      .from('announcement_recipients')
      .select('id, profile_id')
      .eq('id', recipientId)
      .eq('profile_id', userId)
      .maybeSingle();

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: Record<string, any> = {};
    if (action === 'read') update.read_at = now;
    if (action === 'dismiss') update.dismissed_at = now;
    if (action === 'archive') { update.is_archived = true; update.dismissed_at = now; }

    const { error } = await db
      .from('announcement_recipients')
      .update(update)
      .eq('id', recipientId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── Direct message row ─────────────────────────────────────────────────────
  if (id.startsWith('dm:')) {
    const dmId = id.slice(3);
    const { data: row } = await db
      .from('portal_direct_messages')
      .select('id, recipient_profile_id')
      .eq('id', dmId)
      .eq('recipient_profile_id', userId)
      .maybeSingle();

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: Record<string, any> = {};
    if (action === 'read') update.read_at = now;
    if (action === 'archive' || action === 'dismiss') update.is_archived = true;

    const { error } = await db
      .from('portal_direct_messages')
      .update(update)
      .eq('id', dmId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid message id format' }, { status: 400 });
}
