/**
 * GET /api/finance/ar
 * Accounts Receivable — aging analysis from invoices table.
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

    // All non-paid, non-cancelled invoices
    const { data: invoicesRaw, error } = await (db as any)
      .from('invoices')
      .select('id, invoice_no, total_inr, status, due_date, issued_date, client_id, created_at');

    if (error) throw new Error(error.message);

    const rows: any[] = invoicesRaw ?? [];

    // Outstanding rows only
    const outstanding = rows.filter((r: any) =>
      r.status !== 'paid' && r.status !== 'cancelled'
    );

    // ── Aging buckets ────────────────────────────────────────────────────────
    function daysPastDue(dueDate: string | null): number {
      if (!dueDate) return 0;
      const diff = new Date(todayStr).getTime() - new Date(dueDate).getTime();
      return Math.floor(diff / 86400_000);
    }

    const buckets = {
      current:    { label: 'Current (not due)',  min: null,  max: -1,   rows: [] as any[] },
      b0_30:      { label: '1–30 days',           min: 1,    max: 30,   rows: [] as any[] },
      b31_60:     { label: '31–60 days',          min: 31,   max: 60,   rows: [] as any[] },
      b61_90:     { label: '61–90 days',          min: 61,   max: 90,   rows: [] as any[] },
      b91_180:    { label: '91–180 days',         min: 91,   max: 180,  rows: [] as any[] },
      b180plus:   { label: '180+ days',           min: 181,  max: null, rows: [] as any[] },
    };

    for (const row of outstanding) {
      const days = row.due_date ? daysPastDue(row.due_date) : -999;
      if (days <= 0)        buckets.current.rows.push(row);
      else if (days <= 30)  buckets.b0_30.rows.push(row);
      else if (days <= 60)  buckets.b31_60.rows.push(row);
      else if (days <= 90)  buckets.b61_90.rows.push(row);
      else if (days <= 180) buckets.b91_180.rows.push(row);
      else                  buckets.b180plus.rows.push(row);
    }

    const agingBuckets = Object.entries(buckets).map(([key, b]) => ({
      key,
      label:  b.label,
      count:  b.rows.length,
      amount: b.rows.reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0),
    }));

    const totalOutstanding = outstanding.reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const totalOverdue     = outstanding
      .filter((r: any) => r.due_date && r.due_date < todayStr)
      .reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const overdueCount     = outstanding.filter((r: any) => r.due_date && r.due_date < todayStr).length;

    // ── Collect client names ──────────────────────────────────────────────────
    const clientIds = [...new Set(rows.map((r: any) => r.client_id).filter(Boolean))];
    const clientMap: Record<string, string> = {};

    if (clientIds.length) {
      const { data: cls } = await (db as any).from('clients').select('id, profile_id').in('id', clientIds);
      const pids = ((cls ?? []) as any[]).map((c: any) => c.profile_id).filter(Boolean);
      if (pids.length) {
        const { data: profs } = await (db as any).from('profiles').select('id, company_name, full_name').in('id', pids);
        const pm: Record<string, string> = {};
        for (const p of (profs ?? []) as any[]) pm[p.id] = p.company_name || p.full_name || 'Client';
        for (const c of (cls ?? []) as any[]) clientMap[c.id] = pm[c.profile_id] || 'Client';
      }
    }

    // ── Top debtors (top 10 by outstanding amount) ───────────────────────────
    const debtorMap: Record<string, { name: string; outstanding: number; count: number; maxDays: number }> = {};
    for (const r of outstanding) {
      const cid = r.client_id ?? '__unknown__';
      if (!debtorMap[cid]) debtorMap[cid] = { name: clientMap[cid] ?? 'Unknown', outstanding: 0, count: 0, maxDays: 0 };
      debtorMap[cid].outstanding += (r.total_inr ?? 0);
      debtorMap[cid].count       += 1;
      const d = r.due_date ? Math.max(0, daysPastDue(r.due_date)) : 0;
      debtorMap[cid].maxDays = Math.max(debtorMap[cid].maxDays, d);
    }

    const topDebtors = Object.entries(debtorMap)
      .sort(([, a], [, b]) => b.outstanding - a.outstanding)
      .slice(0, 10)
      .map(([client_id, v]) => ({ client_id, ...v }));

    // ── Recent overdue invoices ───────────────────────────────────────────────
    const overdueInvoices = outstanding
      .filter((r: any) => r.due_date && r.due_date < todayStr)
      .sort((a: any, b: any) => (a.due_date < b.due_date ? -1 : 1))
      .slice(0, 20)
      .map((r: any) => ({
        id:          r.id,
        invoice_no:  r.invoice_no,
        total_inr:   r.total_inr,
        due_date:    r.due_date,
        days_overdue: daysPastDue(r.due_date),
        client_name: clientMap[r.client_id] ?? 'Unknown',
        status:      r.status,
      }));

    // ── Collection metrics ────────────────────────────────────────────────────
    const totalBilled  = rows.reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const totalPaid    = rows.filter((r: any) => r.status === 'paid').reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const collRate     = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    const dso          = totalBilled > 0 ? Math.round(totalOutstanding / (totalBilled / 30)) : 0;

    return NextResponse.json({
      summary: {
        totalOutstanding,
        totalOverdue,
        overdueCount,
        invoiceCount:     outstanding.length,
        collectionRate:   collRate,
        dso,
      },
      agingBuckets,
      topDebtors,
      overdueInvoices,
    });
  } catch (err: any) {
    console.error('[finance/ar] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to load AR data', detail: err?.message }, { status: 500 });
  }
}
