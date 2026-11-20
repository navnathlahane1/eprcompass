import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workerUrl = new URL('/api/admin/telecalling/enrich-worker', req.url).toString();
  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${cronSecret}`,
      'content-type': 'application/json',
    },
  });

  const data = await res.json();
  return NextResponse.json({ cron: true, ...data });
}
