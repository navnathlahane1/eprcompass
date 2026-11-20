/**
 * GET /api/taskmanager/epr-oversight
 *
 * Returns all portal_tasks of type 'epr_oversight', grouped by client,
 * each enriched with:
 *   - assigned manager name
 *   - client display name
 *   - EPR task progress summary (total / completed / overdue / pct_done)
 *   - delay_risk flag: oversight is still 'pending' while ≥1 EPR task is overdue
 *
 * Query params:
 *   fy        = '2026-27'        (default — filters EPR summary to matching FY)
 *   manager   = profile UUID     (filter by assigned manager)
 *   status    = pending|in_progress|completed|overdue  (filter oversight status)
 *
 * Auth: task manager role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp            = req.nextUrl.searchParams;
  const fy            = sp.get('fy')      || '2026-27';
  const filterManager = sp.get('manager') || '';
  const filterStatus  = sp.get('status')  || '';

  const db  = getServiceClient();
  const now = new Date().toISOString();

  // ── 1. Fetch all epr_oversight portal_tasks ────────────────────────────────
  let q = db
    .from('portal_tasks')
    .select('id, title, status, priority, due_at, assigned_to, client_id, created_at, resolution_note')
    .eq('task_type', 'epr_oversight')
    .order('due_at', { ascending: true });

  if (filterManager) q = (q as any).eq('assigned_to', filterManager);
  if (filterStatus === 'overdue') {
    q = (q as any).lt('due_at', now).in('status', ['pending', 'in_progress']);
  } else if (filterStatus) {
    q = (q as any).eq('status', filterStatus);
  }

  const { data: oversight, error: oErr } = await (q as any);
  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  const oRows: any[] = oversight ?? [];

  // ── 2. Collect unique manager + client IDs ─────────────────────────────────
  const managerIds = [...new Set(oRows.map((t: any) => t.assigned_to).filter(Boolean))];
  const clientIds  = [...new Set(oRows.map((t: any) => t.client_id).filter(Boolean))];

  // ── 3. Batch-fetch manager names ───────────────────────────────────────────
  const managerNameMap: Record<string, string> = {};
  if (managerIds.length > 0) {
    const { data: mgrs } = await db
      .from('profiles')
      .select('id, full_name')
      .in('id', managerIds as string[]);
    for (const m of mgrs ?? []) {
      managerNameMap[(m as any).id] = (m as any).full_name || 'Unknown';
    }
  }

  // ── 4. Batch-fetch client display names ────────────────────────────────────
  const clientNameMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const { data: cls } = await db
      .from('clients')
      .select('id, profile_id')
      .in('id', clientIds as string[]);

    const profileIds = (cls ?? []).map((c: any) => c.profile_id).filter(Boolean);
    if (profileIds.length > 0) {
      const { data: profs } = await db
        .from('profiles')
        .select('id, company_name, full_name')
        .in('id', profileIds as string[]);
      const pMap: Record<string, string> = {};
      for (const p of profs ?? []) {
        pMap[(p as any).id] = (p as any).company_name || (p as any).full_name || 'Unknown';
      }
      for (const c of cls ?? []) {
        clientNameMap[(c as any).id] = pMap[(c as any).profile_id] || 'Unknown';
      }
    }
  }

  // ── 5. Batch-fetch EPR task summaries per client for the given FY ──────────
  const today = now.split('T')[0];
  // Auto-mark overdue before summarising
  if (clientIds.length > 0) {
    await db
      .from('client_epr_tasks')
      .update({ status: 'overdue' })
      .in('client_id', clientIds as string[])
      .eq('fy', fy)
      .eq('status', 'pending')
      .lt('due_date', today);
  }

  const eprSummaryMap: Record<string, {
    total: number; completed: number; in_progress: number;
    pending: number; overdue: number; pct_done: number;
  }> = {};

  if (clientIds.length > 0) {
    const { data: eprRows } = await db
      .from('client_epr_tasks')
      .select('client_id, status')
      .in('client_id', clientIds as string[])
      .eq('fy', fy)
      .not('status', 'in', '("skipped","na")');

    for (const cid of clientIds) {
      const rows = (eprRows ?? []).filter((r: any) => r.client_id === cid);
      const total       = rows.length;
      const completed   = rows.filter((r: any) => r.status === 'completed').length;
      const in_progress = rows.filter((r: any) => r.status === 'in_progress').length;
      const overdue_c   = rows.filter((r: any) => r.status === 'overdue').length;
      const pending     = rows.filter((r: any) => r.status === 'pending').length;
      eprSummaryMap[cid as string] = {
        total, completed, in_progress,
        pending,
        overdue:  overdue_c,
        pct_done: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    }
  }

  // ── 6. Group oversight tasks by client ─────────────────────────────────────
  const clientMap: Record<string, {
    client_id: string;
    client_name: string;
    manager_id: string | null;
    manager_name: string | null;
    oversight_tasks: any[];
    epr_summary: (typeof eprSummaryMap)[string];
    has_delay_risk: boolean;
    all_done: boolean;
  }> = {};

  for (const t of oRows) {
    const cid = t.client_id ?? '__none__';
    if (!clientMap[cid]) {
      const eprSum = eprSummaryMap[cid] ?? { total: 0, completed: 0, in_progress: 0, pending: 0, overdue: 0, pct_done: 0 };
      clientMap[cid] = {
        client_id:      cid,
        client_name:    clientNameMap[cid]  || 'Unknown',
        manager_id:     t.assigned_to ?? null,
        manager_name:   t.assigned_to ? (managerNameMap[t.assigned_to] || 'Unknown') : null,
        oversight_tasks: [],
        epr_summary:    eprSum,
        has_delay_risk: false,
        all_done:       false,
      };
    }

    const isOverdue = !['completed','cancelled'].includes(t.status) && t.due_at < now;
    clientMap[cid].oversight_tasks.push({
      ...t,
      manager_name: t.assigned_to ? (managerNameMap[t.assigned_to] || 'Unknown') : null,
      is_overdue:   isOverdue,
    });
  }

  // ── 7. Compute risk flags ──────────────────────────────────────────────────
  const clients = Object.values(clientMap).map(c => {
    const pendingOversight = c.oversight_tasks.some(
      t => t.status === 'pending' && c.epr_summary.overdue > 0
    );
    const overdueOversight = c.oversight_tasks.some(t => t.is_overdue);
    const allOversightDone = c.oversight_tasks.length > 0 &&
      c.oversight_tasks.every(t => ['completed','cancelled'].includes(t.status));

    return {
      ...c,
      has_delay_risk: pendingOversight || overdueOversight,
      all_done:       allOversightDone,
    };
  });

  // Sort: delay_risk first, then by client name
  clients.sort((a, b) => {
    if (a.has_delay_risk && !b.has_delay_risk) return -1;
    if (!a.has_delay_risk && b.has_delay_risk) return  1;
    return a.client_name.localeCompare(b.client_name);
  });

  // ── 8. Summary stats ──────────────────────────────────────────────────────
  const summary = {
    clients_total:       clients.length,
    oversight_total:     oRows.length,
    pending:             oRows.filter(t => t.status === 'pending').length,
    in_progress:         oRows.filter(t => t.status === 'in_progress').length,
    completed:           oRows.filter(t => ['completed','cancelled'].includes(t.status)).length,
    overdue_oversight:   oRows.filter(t => !['completed','cancelled'].includes(t.status) && t.due_at < now).length,
    at_risk:             clients.filter(c => c.has_delay_risk).length,
  };

  // All unique managers for filter dropdown
  const managers = Object.entries(managerNameMap).map(([id, name]) => ({ id, name }));

  return NextResponse.json({ clients, summary, managers });
}
