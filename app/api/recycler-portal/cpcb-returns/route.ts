/**
 * GET  /api/recycler-portal/cpcb-returns  — list returns (+ summary, late detection)
 * POST /api/recycler-portal/cpcb-returns  — create a return period
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { validDate, validReturnPeriod, validReturnQuantity } from '@/lib/recyclerPortal/returnValidation';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_cpcb_returns')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('due_date', { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: 'Return records are unavailable. Check configuration and retry.' }, { status: 503 });
  }

  const now = Date.now();
  const returns = (data ?? []).map((r: any) => {
    let status = r.status;
    if (!['FILED', 'ACKNOWLEDGED'].includes(status) && r.due_date && new Date(r.due_date).getTime() < now) {
      status = 'LATE';
    }
    const daysToDue = r.due_date ? Math.ceil((new Date(r.due_date).getTime() - now) / 86_400_000) : null;
    return { ...r, status, daysToDue };
  });

  const summary = {
    total: returns.length,
    pending: returns.filter((r: any) => ['NOT_STARTED', 'IN_PROGRESS'].includes(r.status)).length,
    filed: returns.filter((r: any) => ['FILED', 'ACKNOWLEDGED'].includes(r.status)).length,
    late: returns.filter((r: any) => r.status === 'LATE').length,
  };

  return NextResponse.json({ returns, summary });
}

export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!b || typeof b.return_label !== 'string' || !b.return_label.trim() || b.return_label.length > 200)
    return NextResponse.json({ error: 'A return label of 1 to 200 characters is required' }, { status: 400 });
  if (!validReturnPeriod(b.period_start, b.period_end)
    || (b.due_date && !validDate(b.due_date))
    || !validReturnQuantity(b.processed_qty_mt) || !validReturnQuantity(b.credits_claimed_mt)
    || (b.period_type && !['QUARTERLY', 'HALF_YEARLY', 'ANNUAL'].includes(b.period_type))
    || (b.fiscal_year != null && typeof b.fiscal_year !== 'string')
    || (b.filing_notes != null && (typeof b.filing_notes !== 'string' || b.filing_notes.length > 10000))) {
    return NextResponse.json({ error: 'Valid ordered period dates, nonnegative quantities and supported return fields are required' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_cpcb_returns')
    .insert({
      recycler_id: actor.recyclerId,
      return_label: b.return_label.trim(),
      period_type: ['QUARTERLY', 'HALF_YEARLY', 'ANNUAL'].includes(b.period_type) ? b.period_type : 'QUARTERLY',
      fiscal_year: b.fiscal_year?.trim() || null,
      waste_category: b.waste_category || null,
      period_start: b.period_start || null,
      period_end: b.period_end || null,
      due_date: b.due_date || null,
      processed_qty_mt: b.processed_qty_mt == null || b.processed_qty_mt === '' ? null : Number(b.processed_qty_mt),
      credits_claimed_mt: b.credits_claimed_mt == null || b.credits_claimed_mt === '' ? null : Number(b.credits_claimed_mt),
      filing_notes: b.filing_notes?.trim() || null,
      status: 'NOT_STARTED',
    })
    .select()
    .single();

  if (error || !data?.id) {
    return NextResponse.json({ error: 'Return was not saved. Check configuration and retry.' }, { status: 503 });
  }
  return NextResponse.json({ return: data }, { status: 201 });
}

