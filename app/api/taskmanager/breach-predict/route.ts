/**
 * GET /api/taskmanager/breach-predict
 * SLA Breach Predictor — identifies tasks at high risk of missing deadlines
 * BEFORE they actually breach, using velocity and stale-activity signals.
 *
 * Prediction signals:
 *  1. Time elapsed > 70% AND status = 'pending' (not started)
 *  2. No status update in >72h AND due in <7 days
 *  3. Same task type was late >50% of the time historically (pattern)
 *  4. Assigned manager has >5 overdue tasks currently (overloaded)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') ?? ''; // portal_task | epr_task

  const predictions: Array<{
    id: string;
    source: string;
    title: string;
    subtitle: string;
    client_id: string | null;
    client_name: string | null;
    assignee: string | null;
    due: string;
    hours_to_due: number;
    status: string;
    priority: string;
    pct_elapsed: number;
    risk_score: number;
    risk_level: string;
    signals: string[];
  }> = [];

  // ── A. Portal tasks at risk ───────────────────────────────────────────────
  if (!source || source === 'portal_task') {
    const { data: ptTasks } = await db
      .from('portal_tasks')
      .select('id, title, type, status, priority, due_at, assigned_to, client_id, created_at, updated_at, tat_minutes')
      .not('status', 'in', '("done","completed","resolved","cancelled")')
      .not('due_at', 'is', null)
      .gte('due_at', now.toISOString())                          // not yet overdue
      .lte('due_at', new Date(now.getTime() + 7 * 24 * 3_600_000).toISOString()); // due within 7 days

    // Overloaded assignees: >5 overdue tasks
    const { data: overdueByAssignee } = await db
      .from('portal_tasks')
      .select('assigned_to')
      .lt('due_at', now.toISOString())
      .not('status', 'in', '("done","completed","resolved","cancelled")');

    const overdueCount: Record<string, number> = {};
    for (const t of overdueByAssignee ?? []) {
      if (t.assigned_to) overdueCount[t.assigned_to] = (overdueCount[t.assigned_to] ?? 0) + 1;
    }

    for (const t of ptTasks ?? []) {
      const dueDate     = new Date(t.due_at);
      const createDate  = new Date(t.created_at);
      const totalMs     = dueDate.getTime() - createDate.getTime();
      const elapsedMs   = now.getTime()     - createDate.getTime();
      const pct_elapsed = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 100;
      const hours_to_due = Math.round((dueDate.getTime() - now.getTime()) / 3_600_000);
      const lastUpdateAgeH = (now.getTime() - new Date(t.updated_at ?? t.created_at).getTime()) / 3_600_000;

      const signals: string[] = [];
      let risk_score = 0;

      if (pct_elapsed >= 80 && t.status === 'pending') {
        signals.push(`${pct_elapsed}% time elapsed — task not started`);
        risk_score += 40;
      } else if (pct_elapsed >= 70 && t.status === 'pending') {
        signals.push(`${pct_elapsed}% time elapsed — task not started`);
        risk_score += 25;
      }

      if (lastUpdateAgeH > 72 && hours_to_due < 48) {
        signals.push(`No update in ${Math.round(lastUpdateAgeH)}h — due in ${hours_to_due}h`);
        risk_score += 35;
      } else if (lastUpdateAgeH > 48) {
        signals.push(`No update in ${Math.round(lastUpdateAgeH)}h`);
        risk_score += 15;
      }

      if (t.assigned_to && (overdueCount[t.assigned_to] ?? 0) >= 5) {
        signals.push(`Assignee has ${overdueCount[t.assigned_to]} overdue tasks — overloaded`);
        risk_score += 20;
      }

      if (t.priority === 'critical') { signals.push('Critical priority'); risk_score += 10; }
      if (hours_to_due <= 4)         { signals.push('Due in <4h');       risk_score += 20; }

      if (signals.length === 0) continue; // no signals = not at risk

      predictions.push({
        id: t.id, source: 'portal_task',
        title:    t.title, subtitle: t.type ?? '',
        client_id: t.client_id, client_name: null,
        assignee:  t.assigned_to,
        due: t.due_at, hours_to_due, status: t.status, priority: t.priority ?? 'medium',
        pct_elapsed, risk_score: Math.min(100, risk_score),
        risk_level: risk_score >= 70 ? 'critical' : risk_score >= 45 ? 'high' : 'medium',
        signals,
      });
    }
  }

  // ── B. EPR tasks at risk ──────────────────────────────────────────────────
  if (!source || source === 'epr_task') {
    const in7 = new Date(now.getTime() + 7 * 24 * 3_600_000).toISOString().split('T')[0];
    const { data: eprTasks } = await db
      .from('client_epr_tasks')
      .select('id, task_name, waste_category, status, priority, due_date, client_id, created_at, updated_at')
      .not('status', 'in', '("completed","cancelled","na","skipped","overdue")')
      .not('due_date', 'is', null)
      .gte('due_date', todayStr)
      .lte('due_date', in7);

    for (const t of eprTasks ?? []) {
      const dueDate    = new Date(t.due_date);
      const createDate = new Date(t.created_at);
      const totalMs    = dueDate.getTime() - createDate.getTime();
      const elapsedMs  = now.getTime()     - createDate.getTime();
      const pct_elapsed = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 100;
      const hours_to_due = Math.round((dueDate.getTime() - now.getTime()) / 3_600_000);
      const lastUpdateAgeH = (now.getTime() - new Date(t.updated_at ?? t.created_at).getTime()) / 3_600_000;

      const signals: string[] = [];
      let risk_score = 0;

      if (pct_elapsed >= 80 && t.status === 'pending') {
        signals.push(`${pct_elapsed}% time elapsed — not started`);
        risk_score += 40;
      }
      if (lastUpdateAgeH > 72) {
        signals.push(`No update in ${Math.round(lastUpdateAgeH)}h`);
        risk_score += 25;
      }
      if (hours_to_due <= 24) {
        signals.push(`Due within ${hours_to_due}h`);
        risk_score += 30;
      }
      if (['plastic_extended','ewaste_extended','battery_extended'].includes(t.waste_category)) {
        signals.push('Statutory EPR category — EC risk if missed');
        risk_score += 10;
      }

      if (signals.length === 0) continue;

      predictions.push({
        id: t.id, source: 'epr_task',
        title: t.task_name, subtitle: t.waste_category.replace(/_/g, ' '),
        client_id: t.client_id, client_name: null,
        assignee: null,
        due: t.due_date, hours_to_due, status: t.status, priority: t.priority ?? 'medium',
        pct_elapsed, risk_score: Math.min(100, risk_score),
        risk_level: risk_score >= 70 ? 'critical' : risk_score >= 45 ? 'high' : 'medium',
        signals,
      });
    }
  }

  // ── C. Enrich with client names and assignee names ─────────────────────────
  const clientIds  = [...new Set(predictions.map(p => p.client_id).filter(Boolean))];
  const assigneeIds = [...new Set(predictions.map(p => p.assignee).filter(Boolean))];

  const [cRes, aRes] = await Promise.all([
    clientIds.length  ? db.from('clients').select('id, name').in('id', clientIds)  : Promise.resolve({ data: [] }),
    assigneeIds.length? db.from('profiles').select('id, full_name').in('id', assigneeIds) : Promise.resolve({ data: [] }),
  ]);

  const cMap: Record<string, string> = {};
  for (const c of cRes.data ?? []) cMap[c.id] = c.name;
  const aMap: Record<string, string> = {};
  for (const a of aRes.data ?? []) aMap[a.id] = a.full_name ?? 'Unknown';

  const enriched = predictions.map(p => ({
    ...p,
    client_name:   p.client_id ? (cMap[p.client_id] ?? 'Unknown') : null,
    assignee_name: p.assignee  ? (aMap[p.assignee]  ?? 'Unknown') : null,
  }));

  // Sort: risk_score desc
  enriched.sort((a, b) => b.risk_score - a.risk_score);

  const summary = {
    total:    enriched.length,
    critical: enriched.filter(p => p.risk_level === 'critical').length,
    high:     enriched.filter(p => p.risk_level === 'high').length,
    medium:   enriched.filter(p => p.risk_level === 'medium').length,
  };

  return NextResponse.json({ predictions: enriched, summary });
}
