/**
 * GET /api/cron/keepalive
 *
 * Pings the Render backend /health endpoint every 10 minutes so the free-tier
 * dyno never spins down (Render free tier sleeps after 15 min of inactivity).
 *
 * Invoked by the Vercel cron defined in vercel.json.
 * Protected by the standard CRON_SECRET bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic  = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ping Render specifically — it's the one that spins down on inactivity.
  // Vercel serverless functions don't have this problem.
  const backendUrl = process.env.NEXT_PUBLIC_SCRAPER_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) {
    return NextResponse.json({ skipped: true, reason: 'NEXT_PUBLIC_SCRAPER_URL not set' });
  }

  const start = Date.now();
  try {
    const res = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    const latencyMs = Date.now() - start;
    const body = await res.json().catch(() => ({}));

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      latencyMs,
      backend: body,
      pingedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error('[keepalive] Backend ping failed:', message);
    return NextResponse.json(
      { ok: false, error: message, latencyMs, pingedAt: new Date().toISOString() },
      { status: 502 },
    );
  }
}
