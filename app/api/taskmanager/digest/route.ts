/**
 * GET /api/taskmanager/digest
 * Weekly Digest & Smart Summary for CCOO.
 * Aggregates last 7 days vs. previous 7 days for trend analysis.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();

  const t7days  = new Date(now.getTime() - 7  * 24 * 3_600_000).toISOString();
  const t14days = new Date(now.getTime() - 14 * 24 * 3_600_000).toISOString();
  const todayStr = now.toISOString().split('T')[0];
  const in7Str   = new Date(now.getTime() + 7 * 24 * 3_600_000).toISOString().split('T')[0];

  // ── Parallel fetch ─────────────────────────────────────────────────────────
  const [ptRes, eprRes, filRes, srRes, escRes, newClientRes] = await Promise.all([
    db.from('portal_tasks').select('id, status, priority, due_at, updated_at, assigned_to'),
    db.from('client_epr_tasks').select('id, status, due_date, waste_category, updated_at'),
    db.from('epr_filing_statuses').select('id, current_status, sla_due_at, category, updated_at'),
    db.from('service_requests').select('id, status, created_at, updated_at'),
    db.from('task_escalations').select('id, severity, resolved, escalated_at, resolved_at'),
    db.from('clients').select('id, name, created_at').gte('created_at', t7days),
  ]);

  const pt     = ptRes.data     ?? [];
  const epr    = eprRes.data    ?? [];
  const fil    = filRes.data    ?? [];
  const sr     = srRes.data     ?? [];
  const esc    = escRes.data    ?? [];
  const newCli = newClientRes.data ?? [];

  // ── This week stats ───────────────────────────────────────────────────────
  const DONE = ['done', 'completed', 'resolved'];

  const this_week = {
    portal_tasks_closed:  pt.filter(t => DONE.includes(t.status) && t.updated_at >= t7days).length,
    epr_tasks_completed:  epr.filter(t => t.status === 'completed' && t.updated_at >= t7days).length,
    filings_submitted:    fil.filter(f => ['Submitted','Approved'].includes(f.current_status) && f.updated_at >= t7days).length,
    sr_closed:            sr.filter(s => ['closed'].includes(s.status) && s.updated_at >= t7days).length,
    escalations_raised:   esc.filter(e => e.escalated_at >= t7days).length,
    escalations_resolved: esc.filter(e => e.resolved && e.resolved_at && e.resolved_at >= t7days).length,
    new_clients:          newCli.length,
  };

  // ── Current state ─────────────────────────────────────────────────────────
  const now_str = now.toISOString();

  const current = {
    open_tasks:       pt.filter(t => !DONE.includes(t.status) && t.status !== 'cancelled').length,
    overdue_tasks:    pt.filter(t => !DONE.includes(t.status) && t.due_at && t.due_at < now_str).length,
    overdue_epr:      epr.filter(t => t.status === 'overdue' || (t.due_date && t.due_date < todayStr && t.status !== 'completed')).length,
    overdue_filings:  fil.filter(f => f.sla_due_at && f.sla_due_at < now_str).length,
    stale_sr:         sr.filter(s => {
      const age = (now.getTime() - new Date(s.updated_at || s.created_at).getTime()) / 3_600_000;
      return !['closed','rejected'].includes(s.status) && age > 48;
    }).length,
    active_escalations: esc.filter(e => !e.resolved).length,
    critical_escalations: esc.filter(e => !e.resolved && e.severity === 'critical').length,
  };

  // ── Critical deadlines next 7 days ───────────────────────────────────────
  const critical_deadlines = [
    ...fil.filter(f => f.sla_due_at && f.sla_due_at >= now_str && f.sla_due_at.split('T')[0] <= in7Str)
      .map(f => ({
        type:     'filing',
        title:    `${f.category} Filing SLA`,
        due:      f.sla_due_at!,
        days_to:  Math.ceil((new Date(f.sla_due_at!).getTime() - now.getTime()) / 86_400_000),
      })),
    ...epr.filter(t => t.due_date && t.due_date >= todayStr && t.due_date <= in7Str && t.status !== 'completed')
      .map(t => ({
        type:  'epr_task',
        title: `EPR ${t.waste_category?.replace(/_/g,' ')} Task`,
        due:   t.due_date,
        days_to: Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / 86_400_000),
      })),
  ].sort((a, b) => a.days_to - b.days_to).slice(0, 10);

  // ── Top managers by closed tasks this week ───────────────────────────────
  const managerMap: Record<string, number> = {};
  for (const t of pt.filter(t => DONE.includes(t.status) && t.updated_at >= t7days && t.assigned_to)) {
    managerMap[t.assigned_to!] = (managerMap[t.assigned_to!] ?? 0) + 1;
  }
  const topManagerIds = Object.entries(managerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const { data: topProfiles } = topManagerIds.length
    ? await db.from('profiles').select('id, full_name').in('id', topManagerIds)
    : { data: [] };
  const pMap: Record<string, string> = {};
  for (const p of topProfiles ?? []) pMap[p.id] = p.full_name ?? 'Unknown';

  const top_performers = Object.entries(managerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, name: pMap[id] ?? 'Unknown', tasks_closed: count }));

  // ── Smart insights ────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (current.overdue_tasks > 0)
    insights.push(`${current.overdue_tasks} operational task${current.overdue_tasks !== 1 ? 's' : ''} currently overdue — immediate action required.`);
  if (current.critical_escalations > 0)
    insights.push(`${current.critical_escalations} critical escalation${current.critical_escalations !== 1 ? 's' : ''} open — unresolved.`);
  if (current.overdue_filings > 0)
    insights.push(`${current.overdue_filings} filing SLA${current.overdue_filings !== 1 ? 's' : ''} breached — Environmental Compensation risk.`);
  if (this_week.new_clients > 0)
    insights.push(`${this_week.new_clients} new client${this_week.new_clients !== 1 ? 's' : ''} registered this week.`);
  if (this_week.portal_tasks_closed > 10)
    insights.push(`Strong execution: ${this_week.portal_tasks_closed} tasks closed this week.`);
  if (current.stale_sr > 5)
    insights.push(`${current.stale_sr} service requests stale >48h — client satisfaction risk.`);

  return NextResponse.json({
    generated_at:      now.toISOString(),
    period:            '7 days',
    this_week,
    current,
    critical_deadlines,
    top_performers,
    insights,
  });
}
