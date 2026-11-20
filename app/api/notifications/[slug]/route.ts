/**
 * GET /api/notifications/[slug]
 * ─────────────────────────────
 * Returns full notification detail with files + related.
 * Used by the ISR detail page and direct API consumers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sb = getSb();

  try {
    const { data, error } = await sb
      .from('scraped_notifications')
      .select(
        `*,
         notification_authorities!authority_id(*),
         notification_categories!category_id(*),
         notification_files(*)`
      )
      .eq('slug', slug)
      .eq('status', 'active')
      .eq('is_deleted', false)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Related (same EPR type or authority, most recent first)
    const { data: related } = await sb
      .from('scraped_notifications')
      .select(
        `id, slug, title, short_description, published_date, epr_type,
         notification_authorities!authority_id(short_name)`
      )
      .neq('id', data.id)
      .eq('status', 'active')
      .eq('is_deleted', false)
      .eq('epr_type', data.epr_type || '')
      .order('published_date', { ascending: false, nullsFirst: false })
      .limit(5);

    // Increment view count asynchronously
    sb.from('scraped_notifications')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => {});

    const res = NextResponse.json({ data, related: related || [] });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
    return res;

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
