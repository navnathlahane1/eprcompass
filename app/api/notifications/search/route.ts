/**
 * GET /api/notifications/search?q=...
 * Supabase full-text search via RPC function
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q         = searchParams.get('q') || '';
  const authority = searchParams.get('authority') || null;
  const eprType   = searchParams.get('epr_type') || null;
  const year      = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null;
  const limit     = Math.min(50, parseInt(searchParams.get('limit') || '15', 10));
  const offset    = parseInt(searchParams.get('offset') || '0', 10);

  if (!q.trim()) {
    return NextResponse.json({ data: [], query: q });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    const { data, error } = await sb.rpc('search_scraped_notifications', {
      p_query:     q,
      p_authority: authority,
      p_epr_type:  eprType,
      p_year:      year,
      p_status:    'active',
      p_limit:     limit,
      p_offset:    offset,
    });

    if (error) throw error;

    const res = NextResponse.json({ data: data || [], query: q });
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
