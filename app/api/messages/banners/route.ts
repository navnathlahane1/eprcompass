/**
 * GET /api/messages/banners
 *
 * Returns all undismissed, non-expired announcements for the current user.
 * Used by InboxBanners component on all dashboards.
 *
 * PATCH /api/messages/banners  { id, action: 'dismiss' | 'read' }
 * Marks a banner as dismissed or read.
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
    // Supabase v2 stores a JSON array: ["access_token_value", ...]
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

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const now = new Date().toISOString();

  // Get undismissed recipient rows with announcement data
  const { data, error } = await db
    .from('announcement_recipients')
    .select(`
      id,
      announcement_id,
      dismissed_at,
      read_at,
      announcements (
        id,
        title,
        body,
        message_type,
        link_url,
        created_at,
        expires_at
      )
    `)
    .eq('profile_id', userId)
    .is('dismissed_at', null)
    .eq('is_archived', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? [])
    .filter((r: any) => {
      const ann = r.announcements;
      if (!ann) return false;
      // Filter out expired
      if (ann.expires_at && new Date(ann.expires_at) < new Date()) return false;
      return true;
    })
    .map((r: any) => ({
      recipientId: r.id,
      announcementId: r.announcement_id,
      title: r.announcements.title,
      body: r.announcements.body,
      messageType: r.announcements.message_type ?? 'info',
      linkUrl: r.announcements.link_url ?? null,
      createdAt: r.announcements.created_at,
      isRead: !!r.read_at,
    }))
    // Newest first
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ banners: rows });
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { recipientId, action } = body as { recipientId: string; action: 'dismiss' | 'read' };

  if (!recipientId) return NextResponse.json({ error: 'recipientId required' }, { status: 400 });
  if (!['dismiss', 'read'].includes(action)) return NextResponse.json({ error: 'action must be dismiss or read' }, { status: 400 });

  const db = makeServiceClient();

  // Safety: only allow updating your own recipient row
  const { data: row } = await db
    .from('announcement_recipients')
    .select('id, profile_id')
    .eq('id', recipientId)
    .eq('profile_id', userId)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const update: Record<string, any> =
    action === 'dismiss'
      ? { dismissed_at: new Date().toISOString() }
      : { read_at: new Date().toISOString() };

  const { error } = await db
    .from('announcement_recipients')
    .update(update)
    .eq('id', recipientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
