/**
 * GET /api/finance/tasks
 * Returns finance tasks assigned to the authenticated finance user.
 * CFO sees all finance tasks. Finance executive sees only their own.
 *
 * Query params:
 *   status   = pending | in_progress | completed | all  (default: all active)
 *   type     = finance_invoice_deal | finance_invoice_service | payment_followup
 *   countOnly = 1  → returns { count: N } only (for badge)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp          = req.nextUrl.searchParams;
  const statusFilter = sp.get('status') || '';
  const typeFilter   = sp.get('type')   || '';
  const countOnly    = sp.get('countOnly') === '1';

  const db  = getServiceClient();
  const now = new Date().toISOString();

  let q = (db as any)
    .from('portal_tasks')
    .select('id, title, description, task_type, status, priority, assigned_to, client_id, due_at, created_at, resolution_note', { count: countOnly ? 'exact' : undefined, head: countOnly ? true : undefined })
    .in('task_type', ['finance_invoice_deal', 'finance_invoice_service', 'payment_followup'])
    .order('due_at', { ascending: true });

  if (!actor.isCFO) q = q.or(`assigned_to.eq.${actor.id},assigned_to.is.null`);

  if (statusFilter === 'overdue') {
    q = q.lt('due_at', now).in('status', ['pending', 'in_progress']);
  } else if (statusFilter === 'pending') {
    q = q.eq('status', 'pending');
  } else if (statusFilter === 'in_progress') {
    q = q.eq('status', 'in_progress');
  } else if (statusFilter === 'completed') {
    q = q.eq('status', 'completed');
  } else {
    // Default: active (not completed/cancelled)
    q = q.in('status', ['pending', 'in_progress']);
  }

  if (typeFilter) q = q.eq('task_type', typeFilter);

  const { data: tasks, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (countOnly) return NextResponse.json({ count: count ?? 0 });

  // Enrich with client names + assignee names
  const rows: any[] = tasks ?? [];
  const clientIds  = [...new Set(rows.map(t => t.client_id).filter(Boolean))];
  const assigneeIds = [...new Set(rows.map(t => t.assigned_to).filter(Boolean))];

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

  const assigneeNameMap: Record<string, string> = {};
  if (assigneeIds.length) {
    const { data: profs } = await db.from('profiles').select('id, full_name').in('id', assigneeIds as string[]);
    for (const p of profs ?? []) assigneeNameMap[(p as any).id] = (p as any).full_name || 'Unknown';
  }

  const enriched = rows.map(t => ({
    ...t,
    client_name:   clientNameMap[t.client_id] || 'Unknown',
    assignee_name: assigneeNameMap[t.assigned_to] || null,
    is_overdue:    !['completed','cancelled'].includes(t.status) && t.due_at && t.due_at < now,
  }));

  return NextResponse.json({ tasks: enriched, total: enriched.length });
}
