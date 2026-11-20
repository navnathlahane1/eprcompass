/**
 * DELETE /api/recycler-portal/credits/marketplace/[listingId] — withdraw listing
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ listingId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId } = await params;
  const db = adminClient();

  const { data: listing } = await (db as any)
    .from('epr_credit_listings')
    .select('id, credit_id, seller_recycler_id, status')
    .eq('id', listingId)
    .maybeSingle();

  if (!listing || listing.seller_recycler_id !== actor.recyclerId) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  if (listing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Only active listings can be withdrawn' }, { status: 400 });
  }

  await (db as any)
    .from('epr_credit_listings')
    .update({ status: 'WITHDRAWN' })
    .eq('id', listingId);

  // Restore credit to Issued status
  await (db as any)
    .from('epr_credits')
    .update({ status: 'Issued' })
    .eq('id', listing.credit_id);

  return NextResponse.json({ ok: true });
}
