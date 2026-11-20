import { NextRequest, NextResponse } from 'next/server';
import { scheduleAll } from '@/lib/notifications/triggers';

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const headerSecret =
    request.headers.get('x-cron-secret') ||
    request.headers.get('cron-secret') ||
    request.headers.get('CRON_SECRET') ||
    '';

  if (!expected || headerSecret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await scheduleAll();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger notifications' },
      { status: 500 }
    );
  }
}
