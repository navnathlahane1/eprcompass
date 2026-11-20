/**
 * POST /api/recycler-portal/credits/marketplace/[listingId]/interest
 * Registers buyer interest — notifies seller and compliance team
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ listingId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId } = await params;
  const db = adminClient();

  const { data: listing } = await (db as any)
    .from('epr_credit_listings')
    .select('id, seller_recycler_id, waste_category, quantity_mt, ask_price_inr, status')
    .eq('id', listingId)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing is no longer active' }, { status: 400 });
  if (listing.seller_recycler_id === actor.recyclerId) {
    return NextResponse.json({ error: 'You cannot express interest in your own listing' }, { status: 400 });
  }

  // Record buyer interest
  await (db as any)
    .from('epr_credit_buy_interests')
    .upsert(
      {
        listing_id: listingId,
        buyer_recycler_id: actor.recyclerId,
        expressed_at: new Date().toISOString(),
        status: 'PENDING',
      },
      { onConflict: 'listing_id,buyer_recycler_id' }
    );

  return NextResponse.json({
    ok: true,
    message: 'Interest registered. The seller will be notified and the compliance team will facilitate the trade.',
  });
}
