/**
 * GET /api/admin/scraper/jobs/[jobId]
 * Returns per-job logs and job detail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { deny } = await requireAdminSession();
  if (deny) return deny;

  const { jobId } = await params;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [
    { data: job,  error: jobErr  },
    { data: logs, error: logsErr },
  ] = await Promise.all([
    sb.from('scraping_jobs').select('*').eq('id', jobId).single(),
    sb.from('scraping_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
      .limit(500),
  ]);

  if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 404 });

  return NextResponse.json({ job, logs: logs || [] });
}
