/**
 * GET  /api/recycler-portal/credits/marketplace         — listings + rates
 * GET  /api/recycler-portal/credits/marketplace?view=trades — trade history
 * POST /api/recycler-portal/credits/marketplace         — create sell listing
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { cpcbCertBlockReason, isCpcbCertLive } from '@/lib/recyclers/certGate';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const view = req.nextUrl.searchParams.get('view');

  if (view === 'trades') {
    // Return completed trade history for this recycler
    const { data: trades, error } = await (db as any)
      .from('epr_credit_trades')
      .select('id, trade_ref, waste_category, quantity_mt, trade_price_inr, total_value_inr, buyer_name, traded_at, settlement_status')
      .eq('seller_recycler_id', actor.recyclerId)
      .order('traded_at', { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ trades: [] });
    return NextResponse.json({ trades: trades ?? [] });
  }

  // Full marketplace view
  const [listingsRes, myListingsRes, marketRatesRes, availableCreditsRes, meRes] = await Promise.all([
    // All active listings (not mine, for buying)
    (db as any)
      .from('epr_credit_listings')
      .select('id, credit_id, seller_name, waste_category, credit_type, quantity_mt, ask_price_inr, validity_date, listed_at, status, seller_recycler_id')
      .eq('status', 'ACTIVE')
      .order('listed_at', { ascending: false })
      .limit(50),

    // My listings
    (db as any)
      .from('epr_credit_listings')
      .select('id, credit_id, seller_name, waste_category, credit_type, quantity_mt, ask_price_inr, validity_date, listed_at, status, seller_recycler_id')
      .eq('seller_recycler_id', actor.recyclerId)
      .order('listed_at', { ascending: false })
      .limit(50),

    // Market rates aggregated
    (db as any)
      .from('epr_credit_listings')
      .select('waste_category, ask_price_inr')
      .eq('status', 'ACTIVE'),

    // Credits available to list (Issued status, not already listed)
    (db as any)
      .from('epr_credits')
      .select('id, waste_category, credit_type, quantity_mt, issue_date, validity_date, status')
      .eq('recycler_id', actor.recyclerId)
      .eq('status', 'Issued'),
    (db as any)
      .from('recyclers')
      .select('cpcb_cert_no, cpcb_cert_expiry')
      .eq('id', actor.recyclerId)
      .maybeSingle(),
  ]);

  const listBlock = cpcbCertBlockReason(meRes.data?.cpcb_cert_no, meRes.data?.cpcb_cert_expiry);

  const myRecyclerId = actor.recyclerId;

  const sellerIds = Array.from(
    new Set((listingsRes.data ?? []).map((l: any) => l.seller_recycler_id).filter(Boolean))
  );
  const { data: sellerCerts } = sellerIds.length
    ? await (db as any)
        .from('recyclers')
        .select('id, cpcb_cert_no, cpcb_cert_expiry')
        .in('id', sellerIds)
    : { data: [] };
  const liveSeller = new Set(
    (sellerCerts ?? [])
      .filter((r: any) => isCpcbCertLive(r.cpcb_cert_no, r.cpcb_cert_expiry))
      .map((r: any) => r.id)
  );

  const listings = (listingsRes.data ?? [])
    .filter((l: any) => l.seller_recycler_id === myRecyclerId || liveSeller.has(l.seller_recycler_id))
    .map((l: any) => ({
      ...l,
      is_mine: l.seller_recycler_id === myRecyclerId,
    }));

  const myListings = (myListingsRes.data ?? []).map((l: any) => ({
    ...l,
    is_mine: true,
  }));

  const rateMap: Record<string, number[]> = {};
  for (const row of listings) {
    if (!rateMap[row.waste_category]) rateMap[row.waste_category] = [];
    rateMap[row.waste_category].push(Number(row.ask_price_inr));
  }
  const marketRates = Object.entries(rateMap).map(([category, rates]) => ({
    category,
    avg_rate: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
    min_rate: Math.min(...rates),
    max_rate: Math.max(...rates),
  }));

  return NextResponse.json({
    listings,
    myListings,
    marketRates,
    availableToList: listBlock ? [] : (availableCreditsRes.data ?? []),
    cpcb_list_block: listBlock,
    tradeHistory: [],
  });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { credit_id, quantity_mt, ask_price_inr } = body;

  if (!credit_id) return NextResponse.json({ error: 'credit_id is required' }, { status: 400 });
  if (!quantity_mt || quantity_mt <= 0) return NextResponse.json({ error: 'quantity_mt must be positive' }, { status: 400 });
  if (!ask_price_inr || ask_price_inr <= 0) return NextResponse.json({ error: 'ask_price_inr must be positive' }, { status: 400 });

  const db = adminClient();

  const { data: seller } = await (db as any)
    .from('recyclers')
    .select('id, name, company_name, cpcb_cert_no, cpcb_cert_expiry')
    .eq('id', actor.recyclerId)
    .maybeSingle();

  const blocked = cpcbCertBlockReason(seller?.cpcb_cert_no, seller?.cpcb_cert_expiry);
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 409 });
  }

  // Verify the credit belongs to this recycler and is in Issued status
  const { data: credit, error: creditErr } = await (db as any)
    .from('epr_credits')
    .select('id, waste_category, credit_type, quantity_mt, validity_date, status, recycler_id')
    .eq('id', credit_id)
    .eq('recycler_id', actor.recyclerId)
    .maybeSingle();

  if (creditErr || !credit) return NextResponse.json({ error: 'Credit not found or not owned by you' }, { status: 404 });
  if (credit.status !== 'Issued') return NextResponse.json({ error: 'Only credits with "Issued" status can be listed for trading' }, { status: 400 });
  if (quantity_mt > credit.quantity_mt) return NextResponse.json({ error: `Cannot list more than available quantity (${credit.quantity_mt} MT)` }, { status: 400 });

  const { data: listing, error: listErr } = await (db as any)
    .from('epr_credit_listings')
    .insert({
      credit_id,
      seller_recycler_id: actor.recyclerId,
      seller_name: seller?.name ?? seller?.company_name ?? 'Unknown',
      waste_category: credit.waste_category,
      credit_type: credit.credit_type,
      quantity_mt,
      ask_price_inr,
      validity_date: credit.validity_date,
      status: 'ACTIVE',
      listed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (listErr) {
    if (listErr.code === '42P01') {
      return NextResponse.json({ error: 'Credit marketplace is not yet available. Please contact support.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }

  // Mark the credit as Listed
  await (db as any)
    .from('epr_credits')
    .update({ status: 'Listed' })
    .eq('id', credit_id);

  return NextResponse.json({ listing, message: 'Credit listed for sale successfully.' });
}
