import { NextResponse } from 'next/server';
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

async function getCurrentUserId() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user?.id || null;
}

type Params = {
  params: Promise<{ recipientId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { recipientId } = await params;
    const actionBody = await request.json().catch(() => ({}));
    const action = String(actionBody?.action || 'mark_top_seen');

    if (action !== 'mark_top_seen') {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
    }

    const admin = adminClient();
    const { data: row, error: fetchError } = await (admin as any)
      .from('announcement_recipients')
      .select('id, profile_id')
      .eq('id', recipientId)
      .maybeSingle();

    if (fetchError || !row || row.profile_id !== userId) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const { error } = await (admin as any)
      .from('announcement_recipients')
      .update({ seen_top: true, seen_top_at: new Date().toISOString() })
      .eq('id', recipientId)
      .eq('profile_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to mark announcement as seen.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { recipientId } = await params;
    const admin = adminClient();

    const { data: row, error: fetchError } = await (admin as any)
      .from('announcement_recipients')
      .select('id, profile_id')
      .eq('id', recipientId)
      .maybeSingle();

    if (fetchError || !row || row.profile_id !== userId) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const { error } = await (admin as any)
      .from('announcement_recipients')
      .update({ deleted_by_user: true, deleted_at: new Date().toISOString() })
      .eq('id', recipientId)
      .eq('profile_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete announcement.' }, { status: 500 });
  }
}
