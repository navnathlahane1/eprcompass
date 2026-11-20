/**
 * GET /api/admin/scraper/status
 * Returns latest 10 scraping jobs + analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const { deny } = await requireAdminSession();
  if (deny) return deny;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    const [
      { data: jobs,    error: jobsErr    },
      { count: total,  error: totalErr   },
      { count: active, error: activeErr  },
      { count: draft,  error: draftErr   },
    ] = await Promise.all([
      sb.from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      sb.from('scraped_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false),
      sb.from('scraped_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('is_deleted', false),
      sb.from('scraped_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
        .eq('is_deleted', false),
    ]);

    if (jobsErr) throw jobsErr;

    return NextResponse.json({
      jobs:    jobs    || [],
      stats: {
        total:  total  || 0,
        active: active || 0,
        draft:  draft  || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
