/**
 * GET /api/messages/inbox
 *
 * Returns the full notification inbox for the current user:
 *   - Announcements (up to 6 months, then archived)
 *   - Direct messages (client ↔ manager)
 *
 * Query params:
 *   ?archived=1  — return archived items instead of active
 *   ?unread_count=1 — return only { unreadCount: number }
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

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get('archived') === '1';
  const unreadOnly = searchParams.get('unread_count') === '1';

  const db = makeServiceClient();
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

  // ── Fetch announcements ────────────────────────────────────────────────────
  const annQuery = db
    .from('announcement_recipients')
    .select(`
      id,
      announcement_id,
      dismissed_at,
      read_at,
      is_archived,
      announcements (
        id,
        title,
        body,
        message_type,
        link_url,
        created_at,
        expires_at,
        created_by
      )
    `)
    .eq('profile_id', userId)
    .eq('is_archived', showArchived);

  const { data: annData } = await annQuery;

  const announcements = (annData ?? [])
    .filter((r: any) => {
      if (!r.announcements) return false;
      const createdAt = r.announcements.created_at;
      // Auto-archive after 6 months even if flag not set
      if (!showArchived && createdAt && new Date(createdAt) < new Date(sixMonthsAgo)) return false;
      return true;
    })
    .map((r: any) => ({
      id: `ann:${r.id}`,
      recipientId: r.id,
      type: 'announcement' as const,
      messageType: r.announcements.message_type ?? 'info',
      title: r.announcements.title,
      body: r.announcements.body,
      linkUrl: r.announcements.link_url ?? null,
      createdAt: r.announcements.created_at,
      isRead: !!r.read_at,
      isDismissed: !!r.dismissed_at,
      isArchived: r.is_archived,
    }));

  // ── Fetch direct messages received ────────────────────────────────────────
  const { data: dmData } = await db
    .from('portal_direct_messages')
    .select(`
      id,
      body,
      sender_role,
      read_at,
      is_archived,
      created_at,
      client_id,
      sender_profile_id,
      profiles!portal_direct_messages_sender_profile_id_fkey (
        full_name,
        company_name
      )
    `)
    .eq('recipient_profile_id', userId)
    .eq('is_archived', showArchived)
    .order('created_at', { ascending: false })
    .limit(100);

  const directMessages = (dmData ?? []).map((r: any) => {
    const senderProfile = r.profiles;
    const senderName =
      senderProfile?.company_name || senderProfile?.full_name || 'Unknown';
    return {
      id: `dm:${r.id}`,
      dmId: r.id,
      type: 'direct_message' as const,
      messageType: r.sender_role === 'client' ? 'info' : 'info',
      title: `Message from ${senderName}`,
      body: r.body,
      linkUrl: null,
      createdAt: r.created_at,
      isRead: !!r.read_at,
      isDismissed: false,
      isArchived: r.is_archived,
      senderRole: r.sender_role,
      senderName,
      clientId: r.client_id,
    };
  });

  // ── Merge and sort ─────────────────────────────────────────────────────────
  const all = [...announcements, ...directMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (unreadOnly) {
    return NextResponse.json({ unreadCount: all.filter((m) => !m.isRead).length });
  }

  return NextResponse.json({ messages: all, total: all.length });
}
