/**
 * POST  /api/recycler-portal/cpcb-alerts/[alertId]/read
 *   Mark alert as read and optionally mark important / add action note.
 *   Body: { markedImportant?: boolean, actionTaken?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const { alertId } = await params;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = adminClient();

  const { error } = await (db as any)
    .from('recycler_alert_reads')
    .upsert(
      {
        recycler_id: actor.recyclerId,
        alert_id: alertId,
        read_at: new Date().toISOString(),
        marked_important: body.markedImportant ?? false,
        action_taken: body.actionTaken ?? null,
      },
      { onConflict: 'recycler_id,alert_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
