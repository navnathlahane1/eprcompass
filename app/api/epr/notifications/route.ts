/**
 * GET  /api/epr/notifications        — list unread notifications for current user
 * POST /api/epr/notifications/[id]/read — mark one as read (handled inline via PATCH)
 * PATCH /api/epr/notifications/read-all — mark all as read
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// GET — return up to 20 unread notifications for the current user
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();
    const { data, error } = await (db as any)
      .from('epr_notification_queue')
      .select('id, type, payload, created_at, read_at')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const unreadCount = (data ?? []).filter((n: any) => !n.read_at).length;
    return NextResponse.json({ notifications: data ?? [], unread_count: unreadCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — mark all as read or a single id (body: { id?: string, all?: true })
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const db = adminClient();
    const now = new Date().toISOString();

    if (body.all) {
      await (db as any)
        .from('epr_notification_queue')
        .update({ read_at: now })
        .eq('recipient_id', user.id)
        .is('read_at', null);
    } else if (body.id) {
      await (db as any)
        .from('epr_notification_queue')
        .update({ read_at: now })
        .eq('id', body.id)
        .eq('recipient_id', user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
