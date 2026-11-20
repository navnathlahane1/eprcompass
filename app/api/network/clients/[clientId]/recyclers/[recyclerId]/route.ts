/**
 * @openapi
 * /api/network/clients/{clientId}/recyclers/{recyclerId}:
 *   patch:  { summary: Update link status (pause/restore), tags: [Recycler Network] }
 *   delete: { summary: Remove recycler from client network, tags: [Recycler Network] }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

type Params = { params: Promise<{ clientId: string; recyclerId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { clientId, recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const effectiveClientId = actor.isAdmin ? clientId : actor.userId;
  if (!actor.isAdmin && effectiveClientId !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? '').toUpperCase();
  if (!['ACTIVE', 'PAUSED'].includes(status)) {
    return NextResponse.json({ error: 'status must be ACTIVE or PAUSED' }, { status: 400 });
  }

  const db = adminClient();
  const { error } = await (db as any)
    .from('client_recycler_links')
    .update({ status, primary_contact: body.primary_contact ?? undefined, notes: body.notes ?? undefined })
    .eq('client_id', effectiveClientId)
    .eq('recycler_id', recyclerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { clientId, recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const effectiveClientId = actor.isAdmin ? clientId : actor.userId;
  if (!actor.isAdmin && effectiveClientId !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();
  // Soft-delete: REMOVED status
  const { error } = await (db as any)
    .from('client_recycler_links')
    .update({ status: 'REMOVED' })
    .eq('client_id', effectiveClientId)
    .eq('recycler_id', recyclerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
