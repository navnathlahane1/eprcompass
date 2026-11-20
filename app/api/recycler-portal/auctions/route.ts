/**
 * GET /api/recycler-portal/auctions       — list auctions for this recycler
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status'); // optional filter

  let q = (db as any)
    .from('auctions')
    .select(
      'id, auction_number, title, epr_type, required_qty, unit, states_covered, ' +
      'auction_type, start_time, end_time, status, total_bids, unique_bidders, ' +
      'current_best_bid, currency'
    )
    .order('start_time', { ascending: false });

  if (status) q = q.eq('status', status);
  else q = q.in('status', ['LIVE', 'EXTENDED', 'SCHEDULED']);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ auctions: data ?? [] });
}
