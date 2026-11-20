import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(_req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const db = adminClient();
  const rid = actor.recyclerId;

  // --- Credits ---
  const { data: creditsRaw } = await (db as any)
    .from('epr_credits')
    .select('waste_category, quantity_mt, total_value_inr, issue_date, created_at')
    .eq('recycler_id', rid);

  const credits = creditsRaw ?? [];
  const totalCreditValue = credits.reduce((s: number, c: any) => s + (c.total_value_inr ?? 0), 0);

  // by_category
  const categoryMap: Record<string, { count: number; value: number }> = {};
  for (const c of credits) {
    const cat = c.waste_category ?? 'Unknown';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, value: 0 };
    categoryMap[cat].count += 1;
    categoryMap[cat].value += c.total_value_inr ?? 0;
  }
  const by_category = Object.entries(categoryMap).map(([category, d]) => ({
    category,
    count: d.count,
    value: d.value,
  }));

  // trend_6m: group by month (YYYY-MM) for last 6 months
  const now = new Date();
  const trend_6m: { month: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const value = credits
      .filter((c: any) => (c.issue_date ?? c.created_at ?? '').startsWith(key))
      .reduce((s: number, c: any) => s + (c.total_value_inr ?? 0), 0);
    trend_6m.push({ month: key, value });
  }

  // --- Tenders ---
  const { data: tenderResps } = await (db as any)
    .from('tender_responses')
    .select('status')
    .eq('recycler_id', rid);

  const trList = tenderResps ?? [];
  const tendersWon = trList.filter((t: any) => t.status === 'won' || t.status === 'AWARDED').length;
  const tendersResponded = trList.length;
  const responseRate = tendersResponded > 0 ? Math.round((tendersWon / tendersResponded) * 100) : 0;

  // --- Auctions ---
  const { data: bidsRaw } = await (db as any)
    .from('auction_bids')
    .select('auction_id, status, auctions(status)')
    .eq('recycler_id', rid);

  const bids = bidsRaw ?? [];
  const auctionsWon = bids.filter((b: any) => {
    const aStatus = b.auctions?.status ?? '';
    return aStatus === 'AWARDED';
  }).length;

  // --- Capacity ---
  const { data: capLogs } = await (db as any)
    .from('recycler_capacity_log')
    .select('month, capacity_mt, utilized_mt, utilization_pct')
    .eq('recycler_id', rid)
    .order('month', { ascending: false })
    .limit(1);

  const latestCap = (capLogs ?? [])[0] ?? null;

  // --- Contracts ---
  const { data: contractsRaw } = await (db as any)
    .from('recycler_contracts')
    .select('status, total_value_inr')
    .eq('recycler_id', rid);

  const contractList = contractsRaw ?? [];
  const activeContracts = contractList.filter((c: any) => c.status === 'ACTIVE').length;
  const totalContractValue = contractList.reduce((s: number, c: any) => s + (c.total_value_inr ?? 0), 0);

  return NextResponse.json({
    credits: {
      total_count: credits.length,
      total_value_inr: totalCreditValue,
      by_category,
      trend_6m,
    },
    tenders: {
      total_responded: tendersResponded,
      won: tendersWon,
      response_rate_pct: responseRate,
    },
    auctions: {
      total_bid: bids.length,
      won: auctionsWon,
    },
    capacity: {
      avg_utilization_pct: latestCap?.utilization_pct ?? null,
      last_month_utilized_mt: latestCap?.utilized_mt ?? null,
      last_month_capacity_mt: latestCap?.capacity_mt ?? null,
    },
    contracts: {
      active_count: activeContracts,
      total_contract_value: totalContractValue,
    },
  });
}
