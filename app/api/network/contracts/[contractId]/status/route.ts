/**
 * @openapi
 * /api/network/contracts/{contractId}/status:
 *   patch:
 *     summary: Transition contract status
 *     description: |
 *       Valid transitions:
 *         DRAFT -> ACTIVE (requires start_date + end_date)
 *         ACTIVE -> TERMINATED (requires termination_reason)
 *         ACTIVE -> EXPIRED (system only — via PATCH for admin override)
 *     tags: [Recycler Network]
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['TERMINATED', 'EXPIRED'],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const body = await req.json().catch(() => ({}));
  const newStatus = String(body.status ?? '').toUpperCase();

  const db = adminClient();
  const { data: contract } = await (db as any)
    .from('recycler_contracts')
    .select('id, client_id, status, start_date, end_date, recycler_id')
    .eq('id', contractId)
    .maybeSingle();

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!actor.isAdmin && contract.client_id !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allowed = VALID_TRANSITIONS[contract.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({
      error: `Cannot transition from ${contract.status} to ${newStatus}. Allowed: ${allowed.join(', ')}`,
    }, { status: 422 });
  }

  if (newStatus === 'ACTIVE') {
    if (!contract.start_date || !contract.end_date) {
      return NextResponse.json({ error: 'start_date and end_date required before activating' }, { status: 400 });
    }
  }

  if (newStatus === 'TERMINATED' && !body.termination_reason?.trim()) {
    return NextResponse.json({ error: 'termination_reason required' }, { status: 400 });
  }

  const patch: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'ACTIVE') patch.activated_at = new Date().toISOString();
  if (newStatus === 'TERMINATED') {
    patch.terminated_at = new Date().toISOString();
    patch.termination_reason = body.termination_reason.trim();
  }

  const { error } = await (db as any)
    .from('recycler_contracts')
    .update(patch)
    .eq('id', contractId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify client on termination
  if (newStatus === 'TERMINATED') {
    void (async () => {
      try {
        await db.from('epr_notification_queue').insert({
          recipient_id: contract.client_id,
          type: 'contract_terminated',
          payload: {
            title: 'Contract Terminated',
            message: `Contract ${contractId} has been terminated. Reason: ${body.termination_reason}`,
            contract_id: contractId,
          },
        });
      } catch { /* non-critical */ }
    })();
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
