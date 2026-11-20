/**
 * GET /api/finance/payments
 * Payment tracking view — invoices enriched with payment status.
 *
 * Query params:
 *   status = pending | overdue | paid | all  (default: pending + overdue)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp     = req.nextUrl.searchParams;
  const filter = sp.get('status') || 'active';

  const db  = getServiceClient();
  const now = new Date().toISOString().split('T')[0];

  // Auto-mark overdue
  await (db as any)
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('status', 'sent')
    .lt('due_date', now);

  let q = (db as any)
    .from('invoices')
    .select('id, client_id, invoice_no, total_inr, status, issued_date, due_date, paid_date, notes')
    .order('due_date', { ascending: true });

  if (filter === 'active') {
    q = q.in('status', ['sent', 'overdue', 'draft']);
  } else if (filter === 'paid') {
    q = q.eq('status', 'paid');
  } else if (filter === 'overdue') {
    q = q.eq('status', 'overdue');
  }
  // 'all' → no filter

  const { data: invoices, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows: any[] = invoices ?? [];

  // Enrich client names
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

  const enriched = rows.map(i => ({
    ...i,
    client_name: clientNameMap[i.client_id] || 'Unknown',
    days_overdue: i.status === 'overdue' && i.due_date
      ? Math.floor((new Date().getTime() - new Date(i.due_date).getTime()) / 86400_000)
      : null,
  }));

  return NextResponse.json({ payments: enriched, total: enriched.length });
}
