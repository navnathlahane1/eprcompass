/**
 * GET /api/recycler-portal/cpcb-returns/prep?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Filing assistant: aggregates processed tonnage (recycler_capacity_log) and
 * issued credits (epr_credits) for the period, to pre-fill a CPCB return.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { validReturnPeriod } from '@/lib/recyclerPortal/returnValidation';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  if (!from || !to || !validReturnPeriod(from, to)) return NextResponse.json({ error: 'Valid ordered from and to dates are required' }, { status: 400 });
  const lastDay = new Date(`${to}T00:00:00Z`);
  lastDay.setUTCDate(lastDay.getUTCDate() + 1);
  if (!from.endsWith('-01') || lastDay.getUTCDate() !== 1) {
    return NextResponse.json({ error: 'Preparation uses monthly capacity logs; choose complete calendar months.' }, { status: 400 });
  }

  const db = adminClient();

  const [tonnageRes, creditsRes] = await Promise.all([
    (db as any)
      .from('recycler_capacity_log')
      .select('month, utilized_mt')
      .eq('recycler_id', actor.recyclerId)
      .gte('month', from)
      .lte('month', to),
    (db as any)
      .from('epr_credits')
      .select('quantity_mt, waste_category, issue_date, status')
      .eq('recycler_id', actor.recyclerId)
      .in('status', ['Issued', 'Listed', 'Transferred', 'Used'])
      .gte('issue_date', from)
      .lte('issue_date', to),
  ]);

  if (tonnageRes.error || creditsRes.error) {
    return NextResponse.json({ error: 'Preparation data is unavailable; no totals were calculated.' }, { status: 503 });
  }
  if ([...(tonnageRes.data || []).map((r: any) => r.utilized_mt), ...(creditsRes.data || []).map((r: any) => r.quantity_mt)]
    .some(value => value == null || !Number.isFinite(Number(value)) || Number(value) < 0)) {
    return NextResponse.json({ error: 'Invalid quantity records require staff review.' }, { status: 409 });
  }

  const processed_qty_mt = (tonnageRes.data ?? []).reduce(
    (s: number, r: any) => s + Number(r.utilized_mt || 0), 0
  );
  const credits_issued_mt = (creditsRes.data ?? []).reduce(
    (s: number, r: any) => s + Number(r.quantity_mt || 0), 0
  );

  const byCategory: Record<string, number> = {};
  for (const c of creditsRes.data ?? []) {
    byCategory[c.waste_category] = (byCategory[c.waste_category] ?? 0) + Number(c.quantity_mt || 0);
  }

  return NextResponse.json({
    processed_qty_mt: Math.round(processed_qty_mt * 1000) / 1000,
    credits_issued_mt: Math.round(credits_issued_mt * 1000) / 1000,
    months_logged: (tonnageRes.data ?? []).length,
    by_category: byCategory,
  });
}
