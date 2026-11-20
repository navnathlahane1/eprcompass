import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';
import { syncConnection, syncAllDue } from '@/lib/comms/sync';

// POST /api/comms/sync
// Body: { connection_id?: string }  — if omitted, sync all due connections.
// Also callable by cron via Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  // Allow cron secret OR user session
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron     = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const actor = await resolveCommsActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const canManage = await checkCommsPermission(actor.role, 'connections:manage');
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { connection_id } = await req.json().catch(() => ({}));

  if (connection_id) {
    const result = await syncConnection(connection_id);
    return NextResponse.json(result);
  }

  const results = await syncAllDue();
  const succeeded = results.filter(r => r.success).length;
  const failed    = results.filter(r => !r.success).length;

  return NextResponse.json({ synced: succeeded, failed, results });
}
