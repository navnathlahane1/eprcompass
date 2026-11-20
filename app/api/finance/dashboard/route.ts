/**
 * GET /api/finance/dashboard
 * Finance portal dashboard — enriched CFO data.
 */
import { NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveFinanceUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db  = getServiceClient();
    const now = new Date();
    const todayStr   = now.toISOString().split('T')[0];
    const in7days    = new Date(now.getTime() + 7 * 86400_000).toISOString().split('T')[0];

    // Month boundaries for MoM
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

    // ── 1. All invoices ────────────────────────────────────────────────────────
    const { data: invoicesRaw } = await (db as any)
      .from('invoices')
      .select('id, total_inr, status, due_date, paid_date, issued_date, client_id, invoice_no, created_at');

    const rows: any[] = invoicesRaw ?? [];

    // ── 2. Primary KPIs ──────────────────────────────────────────────────────
    const totalValue   = rows.reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const collected    = rows.filter((r: any) => r.status === 'paid').reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const outstanding  = rows
      .filter((r: any) => r.status !== 'paid' && r.status !== 'cancelled')
      .reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const overdueRows  = rows.filter((r: any) => r.status !== 'paid' && r.status !== 'cancelled' && r.due_date && r.due_date < todayStr);
    const overdueAmount = overdueRows.reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const overdueCount  = overdueRows.length;
    const dueNext7Days  = rows.filter((r: any) =>
      r.status !== 'paid' && r.status !== 'cancelled' &&
      r.due_date && r.due_date >= todayStr && r.due_date <= in7days
    ).length;
    const invoiceCount = rows.length;

    // ── 3. Secondary KPIs ────────────────────────────────────────────────────
    const collectionRate = totalValue > 0 ? Math.round((collected / totalValue) * 100) : 0;
    const dso = totalValue > 0 ? Math.round((outstanding / (totalValue / 30))) : 0;

    // ── 4. Month-over-Month ──────────────────────────────────────────────────
    const thisMonthBilled = rows
      .filter((r: any) => r.issued_date && r.issued_date >= thisMonthStart)
      .reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const lastMonthBilled = rows
      .filter((r: any) => r.issued_date && r.issued_date >= lastMonthStart && r.issued_date <= lastMonthEnd)
      .reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0);
    const momChange: number | null = lastMonthBilled > 0
      ? Math.round(((thisMonthBilled - lastMonthBilled) / lastMonthBilled) * 100)
      : null;

    // ── 5. Status breakdown ──────────────────────────────────────────────────
    const sentNonOverdue = rows.filter((r: any) => r.status === 'sent' && (!r.due_date || r.due_date >= todayStr));
    const statusBreakdown = [
      {
        status: 'paid',
        label:  'Collected',
        count:  rows.filter((r: any) => r.status === 'paid').length,
        amount: collected,
      },
      {
        status: 'sent',
        label:  'Sent / Due',
        count:  sentNonOverdue.length,
        amount: sentNonOverdue.reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0),
      },
      {
        status: 'overdue',
        label:  'Overdue',
        count:  overdueCount,
        amount: overdueAmount,
      },
      {
        status: 'draft',
        label:  'Draft',
        count:  rows.filter((r: any) => r.status === 'draft').length,
        amount: rows.filter((r: any) => r.status === 'draft').reduce((s: number, r: any) => s + (r.total_inr ?? 0), 0),
      },
    ];

    // ── 6. Top 5 clients ──────────────────────────────────────────────────────
    const clientMap: Record<string, { billed: number; paid: number; count: number }> = {};
    for (const r of rows) {
      if (!r.client_id) continue;
      if (!clientMap[r.client_id]) clientMap[r.client_id] = { billed: 0, paid: 0, count: 0 };
      clientMap[r.client_id].billed += (r.total_inr ?? 0);
      clientMap[r.client_id].count  += 1;
      if (r.status === 'paid') clientMap[r.client_id].paid += (r.total_inr ?? 0);
    }
    const topClientIds = Object.entries(clientMap)
      .sort(([, a], [, b]) => b.billed - a.billed)
      .slice(0, 5)
      .map(([id]) => id);

    let topClients: any[] = [];
    if (topClientIds.length) {
      const { data: topCls } = await (db as any).from('clients').select('id, profile_id').in('id', topClientIds);
      const topPids = ((topCls ?? []) as any[]).map((c: any) => c.profile_id).filter(Boolean);
      const topProfMap: Record<string, string> = {};
      if (topPids.length) {
        const { data: topProfs } = await (db as any).from('profiles').select('id, company_name, full_name').in('id', topPids);
        for (const p of (topProfs ?? []) as any[]) topProfMap[p.id] = p.company_name || p.full_name || 'Client';
      }
      topClients = topClientIds.map(cid => {
        const cl   = ((topCls ?? []) as any[]).find((c: any) => c.id === cid);
        const name = cl ? (topProfMap[cl.profile_id] || 'Client') : 'Client';
        return { client_id: cid, name, ...(clientMap[cid] ?? { billed: 0, paid: 0, count: 0 }) };
      });
    }

    // ── 7. Pending finance tasks ──────────────────────────────────────────────
    let taskQuery = (db as any)
      .from('portal_tasks')
      .select('id, title, task_type, status, priority, due_at, client_id')
      .in('task_type', ['finance_invoice_deal', 'finance_invoice_service', 'payment_followup'])
      .in('status', ['pending', 'in_progress'])
      .order('due_at', { ascending: true })
      .limit(8);
    if (!actor.isCFO) taskQuery = taskQuery.eq('assigned_to', actor.id);
    const { data: taskRows } = await taskQuery;

    const taskClientIds = [...new Set(((taskRows ?? []) as any[]).map((t: any) => t.client_id).filter(Boolean))];
    const taskClientMap: Record<string, string> = {};
    if (taskClientIds.length) {
      const { data: tCls } = await (db as any).from('clients').select('id, profile_id').in('id', taskClientIds);
      const tPids = ((tCls ?? []) as any[]).map((c: any) => c.profile_id).filter(Boolean);
      if (tPids.length) {
        const { data: tProfs } = await (db as any).from('profiles').select('id, company_name, full_name').in('id', tPids);
        const tPm: Record<string, string> = {};
        for (const p of (tProfs ?? []) as any[]) tPm[p.id] = p.company_name || p.full_name || 'Client';
        for (const c of (tCls ?? []) as any[]) taskClientMap[c.id] = tPm[c.profile_id] || 'Client';
      }
    }
    const pendingTasks = ((taskRows ?? []) as any[]).map((t: any) => ({
      id:          t.id,
      title:       t.title,
      task_type:   t.task_type,
      status:      t.status,
      due_at:      t.due_at ?? null,
      client_name: taskClientMap[t.client_id] || 'Client',
      is_overdue:  t.due_at ? t.due_at < now.toISOString() : false,
    }));

    // ── 8. Recent invoices ───────────────────────────────────────────────────
    const { data: recentRaw } = await (db as any)
      .from('invoices')
      .select('id, invoice_no, total_inr, status, issued_date, due_date, paid_date, client_id')
      .order('created_at', { ascending: false })
      .limit(6);

    const rclientIds = [...new Set(((recentRaw ?? []) as any[]).map((i: any) => i.client_id).filter(Boolean))];
    const rclientMap: Record<string, string> = {};
    if (rclientIds.length) {
      const { data: rCls } = await (db as any).from('clients').select('id, profile_id').in('id', rclientIds);
      const rPids = ((rCls ?? []) as any[]).map((c: any) => c.profile_id).filter(Boolean);
      if (rPids.length) {
        const { data: rProfs } = await (db as any).from('profiles').select('id, company_name, full_name').in('id', rPids);
        const rPm: Record<string, string> = {};
        for (const p of (rProfs ?? []) as any[]) rPm[p.id] = p.company_name || p.full_name || 'Client';
        for (const c of (rCls ?? []) as any[]) rclientMap[c.id] = rPm[c.profile_id] || 'Client';
      }
    }
    const recentInvoices = ((recentRaw ?? []) as any[]).map((i: any) => ({
      id:           i.id,
      invoice_no:   i.invoice_no,
      total_inr:    i.total_inr,
      status:       i.status,
      due_date:     i.due_date ?? null,
      paid_date:    i.paid_date ?? null,
      client_name:  rclientMap[i.client_id] || 'Unknown',
      is_overdue:   i.status !== 'paid' && i.status !== 'cancelled' && i.due_date && i.due_date < todayStr,
    }));

    return NextResponse.json({
      kpis: {
        totalValue,
        collected,
        outstanding,
        overdueAmount,
        overdueCount,
        dueNext7Days,
        invoiceCount,
        collectionRate,
        dso,
        thisMonthBilled,
        lastMonthBilled,
        momChange,
      },
      statusBreakdown,
      topClients,
      pendingTasks,
      recentInvoices,
    });
  } catch (err: any) {
    console.error('[finance/dashboard] GET error:', err?.message ?? err);
    return NextResponse.json(
      { error: 'Failed to load dashboard data', detail: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
