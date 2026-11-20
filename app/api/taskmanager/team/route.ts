/**
 * GET /api/taskmanager/team
 * Team performance & accountability dashboard for the CCOO.
 * Returns per-member KPIs (SLA adherence, avg resolution, overdue count)
 * and department-level efficiency aggregates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['manager', 'task_manager', 'user_manager', 'telecaller', 'sales-executive'];

export async function GET(_req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();

  // ── 1. All active staff members ─────────────────────────────────────────────
  const { data: members } = await db
    .from('profiles')
    .select('id, full_name, role')
    .in('role', STAFF_ROLES)
    .eq('is_banned', false);

  if (!members?.length) {
    return NextResponse.json({
      members: [],
      departments: [],
      summary: { total_members: 0, avg_sla_pct: 0, total_tasks: 0, total_overdue: 0, total_completed: 0 },
    });
  }

  const memberIds = members.map(m => m.id);

  // ── 2. Portal tasks assigned to these members ───────────────────────────────
  const { data: tasks } = await db
    .from('portal_tasks')
    .select('id, assigned_to, status, due_at, created_at, updated_at, priority')
    .in('assigned_to', memberIds)
    .not('status', 'eq', 'cancelled');

  // ── 3. Open escalations per member ─────────────────────────────────────────
  const { data: escalations } = await db
    .from('task_escalations')
    .select('escalated_by, resolved')
    .in('escalated_by', memberIds);

  // ── 4. Per-member statistics ────────────────────────────────────────────────
  const DONE = ['done', 'completed', 'resolved'];

  const memberStats = members.map(m => {
    const myTasks = tasks?.filter(t => t.assigned_to === m.id) ?? [];
    const done     = myTasks.filter(t => DONE.includes(t.status));
    const overdue  = myTasks.filter(t =>
      !DONE.includes(t.status) && t.due_at && new Date(t.due_at) < now
    );
    const in_prog  = myTasks.filter(t => t.status === 'in_progress');
    const pending  = myTasks.filter(t => t.status === 'pending');

    // SLA adherence — % of completed tasks finished before due_at
    const onTime = done.filter(t => {
      if (!t.due_at) return true;
      // use updated_at as proxy for completion time
      return !t.updated_at || new Date(t.updated_at) <= new Date(t.due_at);
    });
    const sla_pct = done.length > 0
      ? Math.round((onTime.length / done.length) * 100)
      : null;

    // Average resolution time (hours) using created_at → updated_at for done tasks
    const times = done
      .filter(t => t.updated_at)
      .map(t => (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 3_600_000);
    const avg_resolution_hours = times.length
      ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
      : null;

    const myEsc = escalations?.filter(e => e.escalated_by === m.id) ?? [];

    const risk: string = overdue.length === 0 ? 'low'
      : overdue.length <= 2            ? 'medium'
      : overdue.length <= 5            ? 'high'
      :                                  'critical';

    return {
      id: m.id,
      name: m.full_name ?? 'Unknown',
      role: m.role,
      total:       myTasks.length,
      completed:   done.length,
      overdue:     overdue.length,
      in_progress: in_prog.length,
      pending:     pending.length,
      completion_pct: myTasks.length
        ? Math.round((done.length / myTasks.length) * 100) : 0,
      sla_pct,
      avg_resolution_hours,
      open_escalations: myEsc.filter(e => !e.resolved).length,
      risk,
    };
  });

  // ── 5. Department (role-level) aggregates ──────────────────────────────────
  const roleGroups: Record<string, typeof memberStats> = {};
  for (const m of memberStats) {
    (roleGroups[m.role] ??= []).push(m);
  }

  const departments = Object.entries(roleGroups).map(([role, mems]) => {
    const total     = mems.reduce((s, m) => s + m.total, 0);
    const completed = mems.reduce((s, m) => s + m.completed, 0);
    const overdue   = mems.reduce((s, m) => s + m.overdue, 0);
    const slaVals   = mems.filter(m => m.sla_pct !== null).map(m => m.sla_pct!);
    const avg_sla   = slaVals.length
      ? Math.round(slaVals.reduce((a, b) => a + b, 0) / slaVals.length) : null;
    const efficiency = total
      ? Math.max(0, Math.min(100, Math.round(((completed - overdue * 0.5) / total) * 100))) : 0;

    return {
      role,
      label: role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      member_count: mems.length,
      total_tasks:  total,
      completed_tasks: completed,
      overdue_tasks: overdue,
      completion_pct: total ? Math.round((completed / total) * 100) : 0,
      avg_sla_pct: avg_sla,
      efficiency_score: efficiency,
    };
  });

  // ── 6. Overall summary ──────────────────────────────────────────────────────
  const allSla = memberStats.filter(m => m.sla_pct !== null).map(m => m.sla_pct!);
  const avg_sla_pct = allSla.length
    ? Math.round(allSla.reduce((a, b) => a + b, 0) / allSla.length) : 0;

  return NextResponse.json({
    members:     memberStats.sort((a, b) => b.overdue - a.overdue),
    departments: departments.sort((a, b) => b.efficiency_score - a.efficiency_score),
    summary: {
      total_members:   memberStats.length,
      avg_sla_pct,
      total_tasks:     memberStats.reduce((s, m) => s + m.total, 0),
      total_overdue:   memberStats.reduce((s, m) => s + m.overdue, 0),
      total_completed: memberStats.reduce((s, m) => s + m.completed, 0),
    },
  });
}
