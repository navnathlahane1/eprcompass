/**
 * GET /api/taskmanager/overview
 *
 * Master aggregation endpoint for the Task Manager Portal.
 * Returns counts + warning buckets across every task source.
 *
 * Query: ?counts_only=1  →  lightweight badge poll (shell sidebar)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

function addHours(h: number) {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const countsOnly = req.nextUrl.searchParams.get('counts_only') === '1';
  const db = getServiceClient();
  const now = new Date().toISOString();
  const in4h  = addHours(4);
  const in24h = addHours(24);
  const in48h = addHours(48);
  const today = now.split('T')[0];

  // ── 1. portal_tasks ────────────────────────────────────────────────────────
  const { data: ptAll } = await db
    .from('portal_tasks')
    .select('id, status, priority, due_at, assigned_to, task_type, title, client_id, tat_minutes, created_at')
    .not('status', 'in', '("completed","cancelled")');

  const portalTasks = ptAll ?? [];

  const overdue_portal_tasks  = portalTasks.filter(t => (t as any).due_at < now).length;
  const urgent_portal_tasks   = portalTasks.filter(t => (t as any).due_at >= now && (t as any).due_at < in4h).length;
  const today_portal_tasks    = portalTasks.filter(t => (t as any).due_at >= in4h && (t as any).due_at.startsWith(today)).length;
  const total_portal_open     = portalTasks.length;

  // ── 2. client_epr_tasks ────────────────────────────────────────────────────
  // Auto-mark overdue first
  await db
    .from('client_epr_tasks')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_date', today);

  const { data: eprAll } = await db
    .from('client_epr_tasks')
    .select('id, status, priority, due_date, client_id, waste_category, task_name')
    .not('status', 'in', '("completed","skipped","na")');

  const eprTasks = eprAll ?? [];
  const overdue_epr = eprTasks.filter(t => (t as any).status === 'overdue').length;
  const today_epr   = eprTasks.filter(t => (t as any).due_date === today && (t as any).status !== 'overdue').length;
  const total_epr_open = eprTasks.length;

  // ── 3. epr_filing_statuses with SLA ───────────────────────────────────────
  const { data: filAll } = await db
    .from('epr_filing_statuses')
    .select('id, current_status, sla_due_at, category, client_id, updated_at')
    .not('current_status', 'in', '("Approved","Certificate Issued","Rejected")');

  const filings = filAll ?? [];
  const overdue_filings = filings.filter(f => (f as any).sla_due_at && (f as any).sla_due_at < now).length;
  const urgent_filings  = filings.filter(f => {
    const s = (f as any).sla_due_at;
    return s && s >= now && s < in4h;
  }).length;
  const today_filings = filings.filter(f => {
    const s = (f as any).sla_due_at;
    return s && s >= in4h && s.startsWith(today);
  }).length;
  const total_filings_open = filings.length;

  // ── 4. service_requests ────────────────────────────────────────────────────
  const { data: srAll } = await db
    .from('service_requests')
    .select('id, status, priority, created_at, updated_at, category, assigned_to')
    .in('status', ['Submitted','Under Review','Awaiting Pricing','Quote Sent','In Progress']);

  const serviceReqs = srAll ?? [];
  // Flag as stale if Submitted/Under Review for > 48h with no update
  const stale_service_requests = serviceReqs.filter(s => {
    const stuck = ['Submitted','Under Review'].includes((s as any).status);
    const lastUpdate = (s as any).updated_at || (s as any).created_at;
    return stuck && lastUpdate < in48h;
  }).length;
  const total_service_open = serviceReqs.length;

  // ── Warning severity buckets ────────────────────────────────────────────────
  const critical_count = overdue_portal_tasks + overdue_filings + overdue_epr;
  const urgent_count   = urgent_portal_tasks  + urgent_filings;
  const warning_count  = today_portal_tasks   + today_epr + today_filings + stale_service_requests;

  // ── Active escalations (lightweight count for badge) ─────────────────────
  const { count: activeEscalations } = await db
    .from('task_escalations')
    .select('id', { count: 'exact', head: true })
    .eq('resolved', false);

  if (countsOnly) {
    return NextResponse.json({
      critical_count,
      urgent_count,
      warning_count,
      overdue_portal_tasks,
      overdue_epr,
      overdue_filings,
      active_escalations: activeEscalations ?? 0,
    });
  }

  // ── Assignee health scores ─────────────────────────────────────────────────
  // Count per-assignee: total open, overdue
  const assigneeMap: Record<string, { total: number; overdue: number; name?: string }> = {};
  for (const t of portalTasks as any[]) {
    if (!t.assigned_to) continue;
    if (!assigneeMap[t.assigned_to]) assigneeMap[t.assigned_to] = { total: 0, overdue: 0 };
    assigneeMap[t.assigned_to].total++;
    if (t.due_at < now) assigneeMap[t.assigned_to].overdue++;
  }

  // Fetch names for assignees
  const assigneeIds = Object.keys(assigneeMap);
  if (assigneeIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, role')
      .in('id', assigneeIds);
    for (const p of profiles ?? []) {
      if (assigneeMap[(p as any).id]) {
        assigneeMap[(p as any).id].name = (p as any).full_name || 'Unknown';
      }
    }
  }

  const assigneeHealth = Object.entries(assigneeMap)
    .map(([id, v]) => ({
      id,
      name:         v.name || 'Unknown',
      total_open:   v.total,
      overdue:      v.overdue,
      health_pct:   v.total > 0 ? Math.round(((v.total - v.overdue) / v.total) * 100) : 100,
    }))
    .sort((a, b) => a.health_pct - b.health_pct); // worst first

  return NextResponse.json({
    // Overall counts
    critical_count,
    urgent_count,
    warning_count,

    // Per-source
    portal_tasks: {
      total_open:   total_portal_open,
      overdue:      overdue_portal_tasks,
      urgent:       urgent_portal_tasks,
      due_today:    today_portal_tasks,
    },
    epr_tasks: {
      total_open:   total_epr_open,
      overdue:      overdue_epr,
      due_today:    today_epr,
    },
    filings: {
      total_open:   total_filings_open,
      overdue:      overdue_filings,
      urgent:       urgent_filings,
      due_today:    today_filings,
    },
    service_requests: {
      total_open:   total_service_open,
      stale:        stale_service_requests,
    },

    // Assignee health
    assignee_health: assigneeHealth,
  });
}
