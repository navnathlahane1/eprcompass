/**
 * GET /api/recycler-portal/price-intelligence
 *
 * Aggregates credit-price signals per waste category:
 *   - market ask (active listings), trade average (recent trades),
 *   - the recycler's own issued-credit average rate,
 *   - supply (listed MT) vs demand (open PIBO requirement MT),
 *   - a 6-month rate trend + naive forecast direction.
 *
 * Pure read aggregation over existing tables (service-role); no new schema.
 */
import { NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const safe = async (p: Promise<any>) => { try { const r = await p; return r?.data ?? []; } catch { return []; } };

  const [listings, trades, allCredits, myCredits, demands] = await Promise.all([
    safe((db as any).from('epr_credit_listings').select('waste_category, quantity_mt, ask_price_inr, status').eq('status', 'ACTIVE')),
    safe((db as any).from('epr_credit_trades').select('waste_category, trade_price_inr, traded_at').gte('traded_at', ninetyDaysAgo.toISOString())),
    safe((db as any).from('epr_credits').select('waste_category, rate_per_mt_inr, issue_date').gte('issue_date', sixMonthsAgo.toISOString().slice(0, 10))),
    safe((db as any).from('epr_credits').select('waste_category, rate_per_mt_inr').eq('recycler_id', actor.recyclerId)),
    safe((db as any).from('pibo_credit_requirements').select('waste_category, required_qty_mt, target_price_inr, status').eq('status', 'OPEN')),
  ]);

  const categories = new Set<string>();
  [listings, trades, allCredits, demands].forEach((arr) => arr.forEach((r: any) => r.waste_category && categories.add(r.waste_category)));

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const perCategory = Array.from(categories).map((cat) => {
    const catListings = listings.filter((r: any) => r.waste_category === cat);
    const catTrades = trades.filter((r: any) => r.waste_category === cat);
    const catMine = myCredits.filter((r: any) => r.waste_category === cat);
    const catDemand = demands.filter((r: any) => r.waste_category === cat);

    // 6-month trend of issue rate
    const byMonth: Record<string, number[]> = {};
    allCredits.filter((r: any) => r.waste_category === cat).forEach((r: any) => {
      if (!r.issue_date) return;
      const k = monthKey(new Date(r.issue_date));
      (byMonth[k] ||= []).push(Number(r.rate_per_mt_inr || 0));
    });
    const months: string[] = [];
    const cur = new Date(sixMonthsAgo);
    for (let i = 0; i < 6; i++) { months.push(monthKey(cur)); cur.setMonth(cur.getMonth() + 1); }
    const trend = months.map((m) => ({ month: m, rate: byMonth[m]?.length ? avg(byMonth[m]) : null }));

    const recent = trend.slice(-3).map(t => t.rate).filter((n): n is number => n != null);
    const prior = trend.slice(0, 3).map(t => t.rate).filter((n): n is number => n != null);
    const recentAvg = avg(recent), priorAvg = avg(prior);
    let direction: 'up' | 'down' | 'stable' = 'stable';
    let changePct = 0;
    if (recentAvg != null && priorAvg != null && priorAvg > 0) {
      changePct = Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
      direction = changePct > 3 ? 'up' : changePct < -3 ? 'down' : 'stable';
    }

    const supply = Math.round(catListings.reduce((s: number, r: any) => s + Number(r.quantity_mt || 0), 0) * 100) / 100;
    const demand = Math.round(catDemand.reduce((s: number, r: any) => s + Number(r.required_qty_mt || 0), 0) * 100) / 100;

    return {
      category: cat,
      market_ask_avg: avg(catListings.map((r: any) => Number(r.ask_price_inr || 0))),
      trade_avg: avg(catTrades.map((r: any) => Number(r.trade_price_inr || 0))),
      my_issued_avg: avg(catMine.map((r: any) => Number(r.rate_per_mt_inr || 0))),
      target_avg: avg(catDemand.map((r: any) => Number(r.target_price_inr || 0)).filter((n: number) => n > 0)),
      supply_mt: supply,
      demand_mt: demand,
      supply_demand: demand > supply ? 'demand_high' : supply > demand ? 'supply_high' : 'balanced',
      trend,
      direction,
      changePct,
    };
  }).sort((a, b) => (b.my_issued_avg ?? 0) - (a.my_issued_avg ?? 0));

  return NextResponse.json({
    categories: perCategory,
    meta: {
      active_listings: listings.length,
      recent_trades: trades.length,
      open_requirements: demands.length,
      generated_at: new Date().toISOString(),
    },
  });
}
