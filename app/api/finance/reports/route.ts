/**
 * GET /api/finance/reports
 * CFO-only financial analytics.
 *
 * Query params:
 *   months = 3 | 6 | 12  (default: 12)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isCFO && actor.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden — CFO only' }, { status: 403 });

  const months = parseInt(req.nextUrl.searchParams.get('months') || '12') || 12;
  const db   = getServiceClient();
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).toISOString().split('T')[0];

  // Fetch all invoices in period
  const { data: invoices, error } = await (db as any)
    .from('invoices')
    .select('id, client_id, total_inr, status, issued_date, paid_date')
    .gte('issued_date', from)
    .order('issued_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows: any[] = invoices ?? [];

  // ── Enrich client names ───────────────────────────────────────────────────
  const clientIds = [...new Set(rows.map(i => i.client_id).filter(Boolean))];
  const clientNameMap: Record<string, string> = {};
  if (clientIds.length) {
    const { data: cls } = await (db as any).from('clients').select('id, profile_id').in('id', clientIds);
    const pids = (cls ?? []).map((c: any) => c.profile_id).filter(Boolean);
    if (pids.length) {
      const { data: profs } = await db.from('profiles').select('id, company_name, full_name').in('id', pids);
      const pm: Record<string, string> = {};
      for (const p of profs ?? []) pm[(p as any).id] = (p as any).company_name || (p as any).full_name || 'Client';
      for (const c of cls ?? []) clientNameMap[(c as any).id] = pm[(c as any).profile_id] || 'Client';
    }
  }

  // ── Monthly breakdown ────────────────────────────────────────────────────
  const monthMap: Record<string, { billed: number; collected: number; count: number }> = {};
  for (const inv of rows) {
    const key = inv.issued_date?.slice(0, 7) || 'unknown';
    if (!monthMap[key]) monthMap[key] = { billed: 0, collected: 0, count: 0 };
    monthMap[key].billed  += inv.total_inr ?? 0;
    monthMap[key].count   += 1;
    if (inv.status === 'paid') monthMap[key].collected += inv.total_inr ?? 0;
  }

  const monthly = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      ...v,
    }));

  // ── By status ────────────────────────────────────────────────────────────
  const statusMap: Record<string, { count: number; total: number }> = {};
  for (const inv of rows) {
    const s = inv.status || 'unknown';
    if (!statusMap[s]) statusMap[s] = { count: 0, total: 0 };
    statusMap[s].count += 1;
    statusMap[s].total += inv.total_inr ?? 0;
  }
  const byStatus = Object.entries(statusMap)
    .map(([status, v]) => ({ status, ...v }))
    .sort((a, b) => b.total - a.total);

  // ── Top clients ──────────────────────────────────────────────────────────
  const clientMap: Record<string, { client_name: string; total: number; paid: number; count: number }> = {};
  for (const inv of rows) {
    const cid = inv.client_id || 'unknown';
    if (!clientMap[cid]) clientMap[cid] = { client_name: clientNameMap[cid] || 'Unknown', total: 0, paid: 0, count: 0 };
    clientMap[cid].total += inv.total_inr ?? 0;
    clientMap[cid].count += 1;
    if (inv.status === 'paid') clientMap[cid].paid += inv.total_inr ?? 0;
  }
  const topClients = Object.values(clientMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Summary KPIs ─────────────────────────────────────────────────────────
  const totalBilled      = rows.reduce((s, i) => s + (i.total_inr ?? 0), 0);
  const totalCollected   = rows.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_inr ?? 0), 0);
  const totalOutstanding = rows.filter(i => !['paid', 'cancelled'].includes(i.status)).reduce((s, i) => s + (i.total_inr ?? 0), 0);
  const avgInvoiceValue  = rows.length > 0 ? totalBilled / rows.length : 0;
  const collectionRate   = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  return NextResponse.json({
    monthly,
    byStatus,
    topClients,
    summary: { totalBilled, totalCollected, totalOutstanding, avgInvoiceValue, collectionRate },
  });
}
