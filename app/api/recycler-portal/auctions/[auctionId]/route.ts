/**
 * GET  /api/recycler-portal/auctions/[auctionId]       — auction detail + my bids
 * POST /api/recycler-portal/auctions/[auctionId]       — place a bid
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { validateAuctionBid, shouldExtendAuction, computeExtendedEndTime } from '@/lib/recyclerPortal/auctionService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  const { auctionId } = await params;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [auctionRes, myBidsRes] = await Promise.all([
    (db as any).from('auctions').select('*').eq('id', auctionId).maybeSingle(),
    (db as any)
      .from('auction_bids')
      .select('id, bid_amount, currency, placed_at, rank, is_winning')
      .eq('auction_id', auctionId)
      .eq('recycler_id', actor.recyclerId)
      .order('placed_at', { ascending: false }),
  ]);

  if (!auctionRes.data) return NextResponse.json({ error: 'Auction not found' }, { status: 404 });

  return NextResponse.json({ auction: auctionRes.data, myBids: myBidsRes.data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  const { auctionId } = await params;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (actor.verificationStatus !== 'VERIFIED') {
    return NextResponse.json({ error: 'Only VERIFIED recyclers can bid.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const bidAmount = Number(body.bidAmount);

  if (isNaN(bidAmount)) {
    return NextResponse.json({ error: 'bidAmount must be a number' }, { status: 400 });
  }

  const db = adminClient();

  // Fetch live auction state
  const { data: auction } = await (db as any)
    .from('auctions')
    .select('id, status, auction_type, end_time, extension_minutes, current_best_bid, reserve_price, currency')
    .eq('id', auctionId)
    .maybeSingle();

  if (!auction) return NextResponse.json({ error: 'Auction not found' }, { status: 404 });

  const currentBest = auction.current_best_bid?.amount as number | undefined;

  const validation = validateAuctionBid(bidAmount, {
    id: auction.id,
    auctionType: auction.auction_type,
    status: auction.status,
    startTime: '',
    endTime: auction.end_time,
    extensionMinutes: auction.extension_minutes,
    reservePrice: auction.reserve_price,
    currentBestBid: currentBest,
  }, currentBest);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  // Insert bid
  const { data: bid, error: bidErr } = await (db as any)
    .from('auction_bids')
    .insert({
      auction_id: auctionId,
      recycler_id: actor.recyclerId,
      bid_amount: bidAmount,
      currency: auction.currency,
      notes: body.notes,
    })
    .select('id, bid_amount, placed_at')
    .single();

  if (bidErr) return NextResponse.json({ error: bidErr.message }, { status: 500 });

  // Check if auction needs extending
  const extendNeeded = shouldExtendAuction(auction.end_time, auction.extension_minutes);

  const auctionUpdate: Record<string, unknown> = {
    total_bids: (auction.total_bids ?? 0) + 1,
    current_best_bid: { amount: bidAmount, recyclerId: actor.recyclerId, placedAt: bid.placed_at },
    updated_at: new Date().toISOString(),
  };

  if (extendNeeded) {
    auctionUpdate.end_time = computeExtendedEndTime(auction.end_time, auction.extension_minutes);
    auctionUpdate.status = 'EXTENDED';
  }

  await (db as any).from('auctions').update(auctionUpdate).eq('id', auctionId);

  return NextResponse.json({
    ok: true,
    bid,
    extended: extendNeeded,
    newEndTime: extendNeeded ? auctionUpdate.end_time : null,
  }, { status: 201 });
}
