/**
 * @openapi
 * /api/network/recyclers/{recyclerId}/verify:
 *   patch:
 *     summary: Update verification status (super-admin only)
 *     tags: [Recycler Network]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [PENDING, VERIFIED, SUSPENDED, BLACKLISTED] }
 *               reason: { type: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

const VALID_STATUSES = ['PENDING', 'VERIFIED', 'SUSPENDED', 'BLACKLISTED'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recyclerId: string }> }
) {
  const { recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isSuperAdminUser && !actor.isAdmin) {
    return NextResponse.json({ error: 'Super-admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? '').toUpperCase();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  const db = adminClient();

  const patch: Record<string, unknown> = { verification_status: status };
  if (status === 'VERIFIED') {
    patch.verified_at = new Date().toISOString();
    patch.verified_by = actor.userId;
  }

  const { error } = await (db as any)
    .from('recyclers')
    .update(patch)
    .eq('id', recyclerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await (db as any).from('recycler_audit_log').insert({
    recycler_id: recyclerId,
    actor_id: actor.userId,
    action: `STATUS_CHANGE_${status}`,
    payload: { reason: body.reason ?? null },
  });

  // Notify all clients who have this recycler linked
  void notifyLinkedClients(db, recyclerId, status, actor.userId);

  return NextResponse.json({ ok: true, status });
}

async function notifyLinkedClients(
  db: any,
  recyclerId: string,
  newStatus: string,
  actorId: string
) {
  try {
    const { data: links } = await db
      .from('client_recycler_links')
      .select('client_id, recyclers(name)')
      .eq('recycler_id', recyclerId)
      .eq('status', 'ACTIVE');

    if (!links?.length) return;

    const recyclerName = links[0]?.recyclers?.name ?? 'Recycler';
    const notifications = links.map((link: any) => ({
      recipient_id: link.client_id,
      type: 'recycler_status_change',
      payload: {
        title: `Recycler Status Changed: ${newStatus}`,
        message: `${recyclerName} is now ${newStatus}. Please review your network.`,
        recycler_id: recyclerId,
      },
    }));

    await db.from('epr_notification_queue').insert(notifications);
  } catch {
    // Non-critical — notifications are best-effort
  }
}
