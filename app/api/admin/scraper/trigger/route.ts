/**
 * POST /api/admin/scraper/trigger
 * Triggers a manual scrape via the backend API.
 * Proxies to backend Express server or triggers inline (if same process).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

export const dynamic = 'force-dynamic';

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const { actor, deny } = await requireAdminSession();
  if (deny) return deny;
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const jobType  = body.jobType  || 'incremental';
  const url      = body.url      || null;
  const maxPages = body.maxPages || 30;

  try {
    // Scraper runs on Render (Playwright). Prefer SCRAPER_URL, fall back to API_URL.
    const backendUrl = process.env.NEXT_PUBLIC_SCRAPER_URL || process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL;

    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (backendUrl && internalApiKey) {
      const resp = await fetch(`${backendUrl}/api/notifications/admin/scraper/trigger`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': internalApiKey },
        body:    JSON.stringify({ jobType, url, maxPages }),
      });
      const data = await resp.json();
      return NextResponse.json(data);
    }

    // If no backend URL, create job record in DB and return job ID
    // (actual scraper runs as a separate process/cron)
    const sb = getSb();
    const { data: job, error } = await sb
      .from('scraping_jobs')
      .insert({
        job_type:      jobType,
        source_portal: 'filemyepr',
        source_url:    url,
        triggered_by:  actor.userId,
        is_cron:       false,
        status:        'pending',
        config:        { maxPages },
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok:      true,
      jobId:   job.id,
      message: `Scrape job ${job.id} queued. It will run on the next cron cycle.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
