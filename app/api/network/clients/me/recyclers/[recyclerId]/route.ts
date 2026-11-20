/**
 * DELETE /api/network/clients/me/recyclers/[recyclerId]
 * Soft-removes a recycler from the current user's network.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  resolveActor,
  adminClient,
  checkRecyclerNetworkAccess,
  FORBIDDEN_RESPONSE,
} from '@/lib/recyclerNetwork/networkAuth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ recyclerId: string }> }
) {
  const { recyclerId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAccess = await checkRecyclerNetworkAccess(actor);
  if (!hasAccess) return FORBIDDEN_RESPONSE;

  const db = adminClient();
  const { error } = await (db as any)
    .from('client_recycler_links')
    .update({ status: 'REMOVED' })
    .eq('client_id', actor.userId)
    .eq('recycler_id', recyclerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
