/**
 * GET /api/notifications
 * ─────────────────────
 * Lists active scraped notifications with filtering, sorting, pagination.
 * Cached at the CDN edge for 5 minutes (ISR-friendly).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic    = 'force-dynamic';
export const revalidate = 0;

function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit      = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
  const offset     = (page - 1) * limit;
  const eprType    = searchParams.get('epr_type')   || null;
  const authority  = searchParams.get('authority')  || null;
  const year       = searchParams.get('year')       || null;
  const q          = searchParams.get('q')          || null;
  const sort       = searchParams.get('sort')       || 'date_desc';
  const category   = searchParams.get('category')  || null;
  const featured   = searchParams.get('featured')  === 'true';

  const sb = getSb();

  try {
    let qb = sb
      .from('scraped_notifications')
      .select(
        `id, slug, title, short_description, epr_type, document_type,
         published_date, tags, is_featured, view_count, download_count,
         notification_authorities!authority_id(id, slug, short_name, name),
         notification_categories!category_id(id, slug, name),
         notification_files(id, cdn_url, mime_type, is_primary, display_name, file_extension)`,
        { count: 'exact' }
      )
      .eq('status', 'active')
      .eq('is_deleted', false);

    if (eprType)   qb = qb.eq('epr_type', eprType);
    if (featured)  qb = qb.eq('is_featured', true);
    if (year)      qb = qb
      .gte('published_date', `${year}-01-01`)
      .lte('published_date', `${year}-12-31`);

    if (q) {
      qb = qb.or(
        `title.ilike.%${q}%,short_description.ilike.%${q}%,tags.cs.{${q}}`
      );
    }

    qb = qb.order('published_date', {
      ascending:  sort === 'date_asc',
      nullsFirst: false,
    });

    qb = qb.range(offset, offset + limit - 1);

    const { data, count, error } = await qb;
    if (error) throw error;

    const total      = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      data: data || [],
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });

    // CDN cache: 5 minutes, stale-while-revalidate 60s
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return response;

  } catch (err: any) {
    console.error('[/api/notifications] error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
