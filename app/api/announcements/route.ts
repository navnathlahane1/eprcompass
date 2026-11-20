import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topOnly = request.nextUrl.searchParams.get('topOnly') === '1';
    const now = new Date();

    const admin = adminClient();
    const { data, error } = await (admin as any)
      .from('announcement_recipients')
      .select('id, profile_id, seen_top, seen_top_at, deleted_by_user, deleted_at, created_at, announcements:announcement_id(id, title, body, image_url, link_url, created_at, expires_at)')
      .eq('profile_id', user.id)
      .eq('deleted_by_user', false)
      .order('created_at', { ascending: false })
      .limit(topOnly ? 50 : 500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || [])
      .map((row: any) => ({
        recipientId: row.id,
        seenTop: Boolean(row.seen_top),
        recipientCreatedAt: row.created_at,
        announcement: {
          id: row.announcements?.id,
          title: row.announcements?.title,
          body: row.announcements?.body,
          imageUrl: row.announcements?.image_url,
          linkUrl: row.announcements?.link_url,
          createdAt: row.announcements?.created_at,
          expiresAt: row.announcements?.expires_at
        }
      }))
      .filter((row: any) => row.announcement?.id)
      .filter((row: any) => {
        const expiresAt = row.announcement?.expiresAt ? new Date(row.announcement.expiresAt) : null;
        return !expiresAt || expiresAt.getTime() >= now.getTime();
      });

    if (topOnly) {
      const top = rows.find((row: any) => !row.seenTop) || null;
      return NextResponse.json({ row: top });
    }

    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch announcements.' }, { status: 500 });
  }
}
