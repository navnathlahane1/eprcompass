/**
 * GET /api/taskmanager/epr-tasks
 *
 * Cross-client EPR task view for task managers.
 * Returns ALL client_epr_tasks across every client, enriched with
 * client name, assigned manager name, and per-client summaries.
 *
 * Query params:
 *   fy        = '2026-27'    (default)
 *   category  = waste_category slug
 *   clientId  = narrow to one client
 *   manager   = assigned_manager_id UUID
 *
 * Auth: task_manager or admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

function emptyStats() {
  return { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0, skipped: 0 };
}

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp             = req.nextUrl.searchParams;
  const fy             = sp.get('fy')       || '2026-27';
  const filterCategory = sp.get('category') || '';
  const filterClientId = sp.get('clientId') || '';
  const filterManager  = sp.get('manager')  || '';

  const db    = getServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // ── 1. Load clients (optionally filtered by manager / clientId) ────────────
  let clientQ = db
    .from('clients')
    .select('id, name, waste_categories, profile_id, assigned_manager_id')
    .order('name');

  if (filterClientId) clientQ = clientQ.eq('id', filterClientId);
  if (filterManager)  clientQ = clientQ.eq('assigned_manager_id', filterManager);

  const { data: clients, error: cErr } = await clientQ;
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  if (!clients?.length) {
    return NextResponse.json({
      summary:  emptyStats(),
      clients:  [],
      tasks:    [],
      managers: [],
    });
  }

  const clientIds  = clients.map((c: any) => c.id);
  const profileIds = clients.map((c: any) => c.profile_id).filter(Boolean);

  // ── 2. Resolve client display names from profiles ──────────────────────────
  const profileNameMap: Record<string, string> = {};
  if (profileIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, company_name, full_name')
      .in('id', profileIds as string[]);
    for (const p of profiles ?? []) {
      profileNameMap[(p as any).id] =
        (p as any).company_name || (p as any).full_name || 'Unknown';
    }
  }

  const clientNameMap: Record<string, string> = {};
  for (const c of clients as any[]) {
    clientNameMap[c.id] = profileNameMap[c.profile_id] || c.name || 'Unknown';
  }

  // ── 3. Resolve manager names ───────────────────────────────────────────────
  const managerIds = [...new Set(
    (clients as any[]).map(c => c.assigned_manager_id).filter(Boolean)
  )] as string[];

  const managerNameMap: Record<string, string> = {};
  if (managerIds.length > 0) {
    const { data: mgrs } = await db
      .from('profiles')
      .select('id, full_name')
      .in('id', managerIds);
    for (const m of mgrs ?? []) {
      managerNameMap[(m as any).id] = (m as any).full_name || 'Unknown';
    }
  }

  // ── 4. Auto-mark overdue tasks ─────────────────────────────────────────────
  await db
    .from('client_epr_tasks')
    .update({ status: 'overdue' })
    .in('client_id', clientIds as string[])
    .eq('fy', fy)
    .eq('status', 'pending')
    .lt('due_date', today);

  // ── 5. Fetch all EPR tasks (with optional category filter) ─────────────────
  let q = db
    .from('client_epr_tasks')
    .select('id, client_id, status, waste_category, priority, due_date, title, description, frequency, responsible_dept, notes, period_label')
    .in('client_id', clientIds as string[])
    .eq('fy', fy)
    .order('due_date', { ascending: true });

  if (filterCategory) q = q.eq('waste_category', filterCategory);

  const { data: rawTasks, error: tErr } = await q;
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const allTasks: any[] = rawTasks ?? [];

  // Build client → manager lookup for annotation
  const clientManagerMap: Record<string, string | null> = {};
  for (const c of clients as any[]) {
    clientManagerMap[c.id] = c.assigned_manager_id || null;
  }

  // ── 6. Per-client summaries ────────────────────────────────────────────────
  const clientSummaries = (clients as any[]).map(c => {
    const ct = allTasks.filter(t => t.client_id === c.id);
    const cs = emptyStats();
    for (const t of ct) {
      cs.total++;
      if (t.status in cs) (cs as any)[t.status]++;
    }
    const mid = c.assigned_manager_id;
    return {
      id:               c.id,
      name:             clientNameMap[c.id],
      waste_categories: c.waste_categories ?? [],
      has_tasks:        ct.length > 0,
      manager_id:       mid ?? null,
      manager_name:     mid ? (managerNameMap[mid] || 'Unknown') : null,
      summary:          cs,
    };
  });

  // ── 7. Overall summary ─────────────────────────────────────────────────────
  const summary = emptyStats();
  for (const t of allTasks) {
    summary.total++;
    if (t.status in summary) (summary as any)[t.status]++;
  }

  // ── 8. Annotate tasks with client + manager names ──────────────────────────
  const tasks = allTasks.map(t => {
    const mid = clientManagerMap[t.client_id];
    return {
      ...t,
      client_name:  clientNameMap[t.client_id]  || 'Unknown',
      manager_id:   mid ?? null,
      manager_name: mid ? (managerNameMap[mid] || 'Unknown') : null,
    };
  });

  const managers = Object.entries(managerNameMap).map(([id, name]) => ({ id, name }));

  return NextResponse.json({ summary, clients: clientSummaries, tasks, managers });
}
