import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(req: NextRequest) {
  try {
    const { deny } = await requireAdminSession();
    if (deny) return deny;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);
    const month = searchParams.get('month'); // format: "YYYY-MM"
    const db = adminClient() as any;

    let query = db
      .from('notifications')
      .select('id, title, message, type, created_at, read')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1).toISOString();
      const end = new Date(year, mon, 1).toISOString();
      query = query.gte('created_at', start).lt('created_at', end);
    }

    const { data: alerts, error } = await query;
    if (error) throw error;

    const rows = (alerts || []).map((a: any) => ({
      id: a.id,
      title: a.title || '',
      message: a.message || '',
      type: a.type || 'info',
      created_at: a.created_at,
      read: a.read ?? false,
    }));

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[analytics/alerts/recent]', err);
    return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
  }
}
