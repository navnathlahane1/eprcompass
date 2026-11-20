/**
 * GET /api/taskmanager/reports
 * Management reports for CCOO.
 * ?type=summary | delayed | department | risk
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

const DONE  = ['done', 'completed', 'resolved'];
const FINAL = ['done', 'completed', 'resolved', 'cancelled', 'closed', 'rejected'];

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'summary';
  const db   = getServiceClient();
  const now  = new Date();

  // ── Summary ──────────────────────────────────────────────────────────────────
  if (type === 'summary') {
    const [pRes, eRes, fRes, sRes, escRes] = await Promise.all([
      db.from('portal_tasks').select('status, due_at, priority').not('status', 'eq', 'cancelled'),
      db.from('client_epr_tasks').select('status, due_date, priority, waste_category'),
      db.from('epr_filing_statuses').select('current_status, sla_due_at, category'),
      db.from('service_requests').select('status, updated_at, created_at'),
      db.from('task_escalations').select('severity, resolved'),
    ]);

    const pT = pRes.data ?? [];
    const eT = eRes.data ?? [];
    const fT = fRes.data ?? [];
    const sR = sRes.data ?? [];
    const es = escRes.data ?? [];

    const pOverdue = pT.filter(t => t.due_at && new Date(t.due_at) < now && !DONE.includes(t.status)).length;
    const eOverdue = eT.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length;
    const fOverdue = fT.filter(f => f.sla_due_at && new Date(f.sla_due_at) < now).length;
    const srStale  = sR.filter(s => {
      const age = (now.getTime() - new Date(s.updated_at || s.created_at).getTime()) / 3_600_000;
      return !['closed', 'rejected'].includes(s.status) && age > 48;
    }).length;

    const totalTasks   = pT.length + eT.length + fT.length;
    const totalOverdue = pOverdue + eOverdue + fOverdue;
    const risk_score   = Math.min(100, Math.round(
      (totalOverdue / Math.max(1, totalTasks)) * 200 + srStale * 3
    ));

    return NextResponse.json({
      type: 'summary',
      generated_at: now.toISOString(),
      risk_score,
      portal_tasks: {
        total:       pT.length,
        overdue:     pOverdue,
        pending:     pT.filter(t => t.status === 'pending').length,
        in_progress: pT.filter(t => t.status === 'in_progress').length,
        done:        pT.filter(t => DONE.includes(t.status)).length,
        critical:    pT.filter(t => t.priority === 'critical').length,
        high:        pT.filter(t => t.priority === 'high').length,
      },
      epr_tasks: {
        total:       eT.length,
        overdue:     eOverdue,
        pending:     eT.filter(t => t.status === 'pending').length,
        in_progress: eT.filter(t => t.status === 'in_progress').length,
        completed:   eT.filter(t => t.status === 'completed').length,
        by_category: Object.fromEntries(
          [...new Set(eT.map(t => t.waste_category))].map(cat => [
            cat, eT.filter(t => t.waste_category === cat).length,
          ])
        ),
      },
      filings: {
        total:     fT.length,
        overdue:   fOverdue,
        by_status: Object.fromEntries(
          [...new Set(fT.map(f => f.current_status))].map(s => [
            s, fT.filter(f => f.current_status === s).length,
          ])
        ),
      },
      service_requests: {
        total: sR.length,
        stale: srStale,
        open:  sR.filter(s => !['closed', 'rejected'].includes(s.status)).length,
      },
      escalations: {
        active:   es.filter(e => !e.resolved).length,
        critical: es.filter(e => !e.resolved && e.severity === 'critical').length,
      },
    });
  }

  // ── Delayed ──────────────────────────────────────────────────────────────────
  if (type === 'delayed') {
    const [pRes, eRes, fRes] = await Promise.all([
      db.from('portal_tasks')
        .select('id, title, type, priority, due_at, assigned_to, client_id, status')
        .not('status', 'in', `(${FINAL.map(s => `"${s}"`).join(',')})`)
        .lt('due_at', now.toISOString())
        .order('due_at', { ascending: true })
        .limit(150),
      db.from('client_epr_tasks')
        .select('id, task_name, waste_category, priority, due_date, client_id, status, responsible_dept')
        .not('status', 'in', '("completed","cancelled")')
        .lt('due_date', now.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(150),
      db.from('epr_filing_statuses')
        .select('id, category, current_status, sla_due_at, client_id, fy_label')
        .lt('sla_due_at', now.toISOString())
        .order('sla_due_at', { ascending: true })
        .limit(60),
    ]);

    // Build lookup maps
    const aIds = [...new Set((pRes.data ?? []).map(t => t.assigned_to).filter(Boolean))];
    const cIds = [...new Set([
      ...(pRes.data ?? []).map(t => t.client_id),
      ...(eRes.data ?? []).map(t => t.client_id),
      ...(fRes.data ?? []).map(f => f.client_id),
    ].filter(Boolean))];

    const [{ data: profs }, { data: clients }] = await Promise.all([
      aIds.length ? db.from('profiles').select('id, full_name').in('id', aIds) : Promise.resolve({ data: [] }),
      cIds.length ? db.from('clients').select('id, name').in('id', cIds) : Promise.resolve({ data: [] }),
    ]);

    const pMap: Record<string, string> = {};
    for (const p of profs ?? []) pMap[p.id] = p.full_name ?? 'Unknown';
    const cMap: Record<string, string> = {};
    for (const c of clients ?? []) cMap[c.id] = c.name ?? 'Unknown';

    const toHrs = (d: string) =>
      Math.round((now.getTime() - new Date(d).getTime()) / 3_600_000);

    const delayed = [
      ...(pRes.data ?? []).map(t => ({
        id: t.id, source: 'portal_task',
        title: t.title, subtitle: t.type ?? '',
        priority: t.priority ?? 'medium',
        due: t.due_at, hours_overdue: toHrs(t.due_at),
        assignee: t.assigned_to ? pMap[t.assigned_to] ?? null : null,
        client:   t.client_id  ? cMap[t.client_id]   ?? null : null,
      })),
      ...(eRes.data ?? []).map(t => ({
        id: t.id, source: 'epr_task',
        title: t.task_name, subtitle: `${t.waste_category} · ${t.responsible_dept ?? ''}`,
        priority: t.priority ?? 'medium',
        due: t.due_date, hours_overdue: toHrs(t.due_date),
        assignee: null,
        client: t.client_id ? cMap[t.client_id] ?? null : null,
      })),
      ...(fRes.data ?? []).map(f => ({
        id: f.id, source: 'filing',
        title: `${f.category} Filing`, subtitle: `${f.fy_label} · ${f.current_status}`,
        priority: 'high',
        due: f.sla_due_at, hours_overdue: toHrs(f.sla_due_at),
        assignee: null,
        client: f.client_id ? cMap[f.client_id] ?? null : null,
      })),
    ].sort((a, b) => b.hours_overdue - a.hours_overdue);

    return NextResponse.json({ type: 'delayed', items: delayed, total: delayed.length });
  }

  // ── Department ───────────────────────────────────────────────────────────────
  if (type === 'department') {
    const { data: members } = await db
      .from('profiles')
      .select('id, role')
      .in('role', ['manager', 'task_manager', 'user_manager', 'telecaller', 'sales-executive'])
      .eq('is_banned', false);

    if (!members?.length) return NextResponse.json({ type: 'department', departments: [] });

    const ids = members.map(m => m.id);
    const { data: tasks } = await db
      .from('portal_tasks')
      .select('assigned_to, status, due_at, updated_at, created_at')
      .in('assigned_to', ids);

    const grp: Record<string, { done: number; overdue: number; total: number; onTime: number; resTimes: number[] }> = {};
    for (const m of members) {
      const g = grp[m.role] ??= { done: 0, overdue: 0, total: 0, onTime: 0, resTimes: [] };
      const mt = tasks?.filter(t => t.assigned_to === m.id) ?? [];
      g.total += mt.length;
      for (const t of mt) {
        if (DONE.includes(t.status)) {
          g.done++;
          if (!t.due_at || !t.updated_at || new Date(t.updated_at) <= new Date(t.due_at)) g.onTime++;
          if (t.updated_at) g.resTimes.push((new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 3_600_000);
        } else if (t.due_at && new Date(t.due_at) < now) {
          g.overdue++;
        }
      }
    }

    const departments = Object.entries(grp).map(([role, g]) => ({
      role,
      label: role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      member_count: members.filter(m => m.role === role).length,
      total_tasks:     g.total,
      completed_tasks: g.done,
      overdue_tasks:   g.overdue,
      completion_pct:  g.total ? Math.round((g.done  / g.total) * 100) : 0,
      sla_pct:         g.done  ? Math.round((g.onTime / g.done) * 100) : null,
      avg_resolution_hours: g.resTimes.length
        ? Math.round(g.resTimes.reduce((a, b) => a + b, 0) / g.resTimes.length * 10) / 10 : null,
      efficiency: g.total
        ? Math.max(0, Math.min(100, Math.round(((g.done - g.overdue * 0.5) / g.total) * 100))) : 0,
    }));

    return NextResponse.json({ type: 'department', departments });
  }

  // ── Risk items ───────────────────────────────────────────────────────────────
  const [pRes, eRes, fRes, escRes] = await Promise.all([
    db.from('portal_tasks')
      .select('id, title, priority, due_at, status, type, assigned_to')
      .eq('priority', 'critical')
      .not('status', 'in', `(${FINAL.map(s => `"${s}"`).join(',')})`)
      .order('due_at', { ascending: true })
      .limit(40),
    db.from('client_epr_tasks')
      .select('id, task_name, waste_category, priority, due_date, status, client_id')
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })
      .limit(40),
    db.from('epr_filing_statuses')
      .select('id, category, current_status, sla_due_at, fy_label, client_id')
      .lt('sla_due_at', now.toISOString())
      .order('sla_due_at', { ascending: true })
      .limit(30),
    db.from('task_escalations')
      .select('id, task_source, task_id, reason, severity, escalated_at, escalated_by')
      .eq('resolved', false)
      .eq('severity', 'critical')
      .order('escalated_at', { ascending: false })
      .limit(20),
  ]);

  // Assignee names for portal tasks
  const aIds = [...new Set((pRes.data ?? []).map(t => t.assigned_to).filter(Boolean))];
  const { data: profs } = aIds.length
    ? await db.from('profiles').select('id, full_name').in('id', aIds)
    : { data: [] };
  const pMap: Record<string, string> = {};
  for (const p of profs ?? []) pMap[p.id] = p.full_name ?? '—';

  const riskItems = [
    ...(escRes.data ?? []).map(e => ({
      source: 'escalation', risk_level: 'critical',
      title: `Escalated: ${e.reason.slice(0, 60)}`,
      subtitle: `${e.task_source} · ${e.severity}`,
      due: e.escalated_at, assignee: null,
      risk_reason: 'Active critical escalation unresolved',
    })),
    ...(pRes.data ?? []).map(t => ({
      source: 'portal_task', risk_level: 'critical',
      title: t.title, subtitle: t.type ?? '',
      due: t.due_at,
      assignee: t.assigned_to ? pMap[t.assigned_to] : null,
      risk_reason: 'Critical priority operational task',
    })),
    ...(eRes.data ?? []).map(t => ({
      source: 'epr_task', risk_level: 'high',
      title: t.task_name, subtitle: t.waste_category,
      due: t.due_date, assignee: null,
      risk_reason: 'EPR compliance task overdue',
    })),
    ...(fRes.data ?? []).map(f => ({
      source: 'filing', risk_level: 'high',
      title: `${f.category} Filing (${f.fy_label})`, subtitle: f.current_status,
      due: f.sla_due_at, assignee: null,
      risk_reason: 'Filing SLA breached — Environmental Compensation risk',
    })),
  ];

  return NextResponse.json({ type: 'risk', items: riskItems, total: riskItems.length });
}
