import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enrichLead } from '@/lib/telecalling/enrichLead';

export const runtime = 'nodejs';
export const maxDuration = 300;

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  // Only callable with service role or from cron
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized = authHeader === `Bearer ${cronSecret}` || authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  if (!isAuthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();

  // Claim up to 10 pending queue items (set to 'processing' atomically via status filter)
  const { data: queueItems, error: fetchErr } = await db.from('tc_enrichment_queue')
    .select('id, lead_id, attempts')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!queueItems || queueItems.length === 0) {
    return NextResponse.json({ processed: 0, message: 'Queue empty' });
  }

  // Mark all as processing
  const ids = queueItems.map(q => q.id);
  await db.from('tc_enrichment_queue').update({
    status: 'processing',
    last_attempted_at: new Date().toISOString(),
  }).in('id', ids);

  // Process in batches of 5 in parallel
  const results: { lead_id: string; success: boolean; error?: string }[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
    const batch = queueItems.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(item => enrichLead(item.lead_id, db))
    );

    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        results.push({ lead_id: item.lead_id, success: true });
      } else {
        const errMsg = result.reason?.message || 'Unknown error';
        results.push({ lead_id: item.lead_id, success: false, error: errMsg });
        // Mark failed items; enrichLead already handles status update on its own failure
        await db.from('tc_enrichment_queue').update({
          status: item.attempts >= 2 ? 'failed' : 'pending',
          attempts: (item.attempts || 0) + 1,
          error: errMsg,
        }).eq('id', item.id);
      }
    }
  }

  const successCount = results.filter(r => r.success).length;
  return NextResponse.json({
    processed: queueItems.length,
    succeeded: successCount,
    failed: queueItems.length - successCount,
    results,
  });
}
