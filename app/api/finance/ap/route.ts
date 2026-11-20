/**
 * GET /api/finance/ap
 * Accounts Payable — vendor ledger, aging, cash requirement.
 */
import { NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveFinanceUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isCFO) return NextResponse.json({ error: 'Forbidden — CFO access only' }, { status: 403 });

    const db  = getServiceClient();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const { data: apRaw, error } = await (db as any)
      .from('finance_ap_records')
      .select('*')
      .order('due_date', { ascending: true });

    if (error && error.code !== 'PGRST116') throw new Error(error.message);

    const rows: any[] = apRaw ?? [];

    const pending  = rows.filter((r: any) => r.status !== 'paid' && r.status !== 'cancelled');
    const overdue  = pending.filter((r: any) => r.due_date && r.due_date < todayStr);
    const paid     = rows.filter((r: any) => r.status === 'paid');

    const totalOutstanding = pending.reduce((s: number, r: any) => s + (r.total_inr ?? r.amount_inr ?? 0), 0);
    const totalOverdue     = overdue.reduce((s: number, r: any) => s + (r.total_inr ?? r.amount_inr ?? 0), 0);
    const totalPaid        = paid.reduce((s: number, r: any) => s + (r.total_inr ?? r.amount_inr ?? 0), 0);

    // Aging buckets
    function daysPastDue(dueDate: string | null): number {
      if (!dueDate) return 0;
      return Math.floor((new Date(todayStr).getTime() - new Date(dueDate).getTime()) / 86400_000);
    }

    const aging = [
      { label: 'Current',      rows: pending.filter((r: any) => !r.due_date || r.due_date >= todayStr) },
      { label: '1–30 days',    rows: pending.filter((r: any) => { const d = daysPastDue(r.due_date); return d >= 1 && d <= 30; }) },
      { label: '31–60 days',   rows: pending.filter((r: any) => { const d = daysPastDue(r.due_date); return d >= 31 && d <= 60; }) },
      { label: '61–90 days',   rows: pending.filter((r: any) => { const d = daysPastDue(r.due_date); return d >= 61 && d <= 90; }) },
      { label: '90+ days',     rows: pending.filter((r: any) => daysPastDue(r.due_date) > 90) },
    ].map(b => ({ label: b.label, count: b.rows.length, amount: b.rows.reduce((s: number, r: any) => s + (r.total_inr ?? r.amount_inr ?? 0), 0) }));

    // Cash requirement next 30 days
    const in30 = new Date(now.getTime() + 30 * 86400_000).toISOString().split('T')[0];
    const cashReq30 = pending
      .filter((r: any) => r.due_date && r.due_date >= todayStr && r.due_date <= in30)
      .reduce((s: number, r: any) => s + (r.total_inr ?? r.amount_inr ?? 0), 0);

    return NextResponse.json({
      summary: {
        totalOutstanding,
        totalOverdue,
        totalPaid,
        pendingCount:  pending.length,
        overdueCount:  overdue.length,
        cashReq30,
      },
      aging,
      records: pending.slice(0, 50).map((r: any) => ({
        id:          r.id,
        vendor_name: r.vendor_name,
        invoice_no:  r.invoice_no,
        amount:      r.total_inr ?? r.amount_inr,
        due_date:    r.due_date,
        status:      r.status,
        days_overdue: r.due_date ? Math.max(0, daysPastDue(r.due_date)) : 0,
        category:    r.category,
      })),
    });
  } catch (err: any) {
    console.error('[finance/ap] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to load AP data', detail: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await resolveFinanceUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isCFO) return NextResponse.json({ error: 'Forbidden — CFO access only' }, { status: 403 });

    const body = await req.json();
    const db   = getServiceClient();

    const { data, error } = await (db as any)
      .from('finance_ap_records')
      .insert({
        vendor_name:   body.vendor_name,
        vendor_gstin:  body.vendor_gstin,
        invoice_no:    body.invoice_no,
        category:      body.category,
        amount_inr:    body.amount_inr ?? 0,
        gst_amount_inr: body.gst_amount_inr ?? 0,
        invoice_date:  body.invoice_date,
        due_date:      body.due_date,
        status:        body.status ?? 'pending',
        notes:         body.notes,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ record: data }, { status: 201 });
  } catch (err: any) {
    console.error('[finance/ap] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to create AP record', detail: err?.message }, { status: 500 });
  }
}
