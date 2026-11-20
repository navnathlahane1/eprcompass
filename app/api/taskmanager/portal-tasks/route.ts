/**
 * GET /api/taskmanager/portal-tasks
 *
 * Returns all portal_tasks with assignee + client display names.
 * Supports filtering by status, type, priority, assignee_id.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const filterStatus   = sp.get('status')    || '';
  const filterType     = sp.get('type')      || '';
  const filterPriority = sp.get('priority')  || '';
  const filterAssignee = sp.get('assignee')  || '';
  const limit = Math.min(parseInt(sp.get('limit') || '200', 10), 500);

  const db  = getServiceClient();
  const now = new Date().toISOString();

  let q = db
    .from('portal_tasks')
    .select('id, title, description, task_type, status, priority, assigned_to, client_id, related_entity_type, related_entity_id, tat_minutes, due_at, created_at, updated_at, completed_at, completed_by, resolution_note, created_by')
    .order('due_at', { ascending: true })
    .limit(limit);

  if (filterStatus === 'overdue') {
    q = (q as any).lt('due_at', now).in('status', ['pending', 'in_progress']);
  } else if (filterStatus) {
    q = (q as any).eq('status', filterStatus);
  }

  if (filterType)     q = (q as any).eq('task_type', filterType);
  if (filterPriority) q = (q as any).eq('priority',  filterPriority);
  if (filterAssignee) q = (q as any).eq('assigned_to', filterAssignee);

  const { data: tasks, error } = await (q as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = tasks ?? [];

  // Collect all unique IDs for enrichment
  const assigneeIds = [...new Set(rows.map((t: any) => t.assigned_to).filter(Boolean))];
  const clientIds   = [...new Set(rows.map((t: any) => t.client_id).filter(Boolean))];

  // Batch-fetch profiles
  const profileMap: Record<string, string> = {};
  if (assigneeIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, role')
      .in('id', assigneeIds);
    for (const p of profiles ?? []) {
      profileMap[(p as any).id] = (p as any).full_name || 'Unknown';
    }
  }

  // Batch-fetch client names
  const clientNameMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const { data: clients } = await db
      .from('clients')
      .select('id, name, profile_id');
    const profileIds = (clients ?? []).map((c: any) => c.profile_id).filter(Boolean);

    if (profileIds.length > 0) {
      const { data: clientProfiles } = await db
        .from('profiles')
        .select('id, company_name, full_name')
        .in('id', profileIds);
      const cpMap: Record<string, string> = {};
      for (const p of clientProfiles ?? []) {
        cpMap[(p as any).id] = (p as any).company_name || (p as any).full_name || '';
      }
      for (const c of clients ?? []) {
        clientNameMap[(c as any).id] = cpMap[(c as any).profile_id] || (c as any).name || 'Unknown';
      }
    }
  }

  // Annotate
  const enriched = rows.map((t: any) => {
    const isOverdue  = !['completed','cancelled'].includes(t.status) && t.due_at < now;
    const elapsedMin = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 60000);
    const pctElapsed = t.tat_minutes > 0 ? Math.round((elapsedMin / t.tat_minutes) * 100) : 0;

    return {
      ...t,
      assignee_name: t.assigned_to ? (profileMap[t.assigned_to] || 'Unknown') : null,
      client_name:   t.client_id   ? (clientNameMap[t.client_id] || 'Unknown') : null,
      is_overdue:    isOverdue,
      elapsed_min:   elapsedMin,
      pct_elapsed:   pctElapsed,
    };
  });

  // Summary stats
  const summary = { total: enriched.length, pending: 0, in_progress: 0, completed_today: 0, overdue: 0, urgent: 0 };
  const in4h = new Date(Date.now() + 4 * 3_600_000).toISOString();
  for (const t of enriched) {
    if (t.status === 'pending')     summary.pending++;
    if (t.status === 'in_progress') summary.in_progress++;
    if (t.is_overdue)               summary.overdue++;
    if (!t.is_overdue && t.due_at < in4h && !['completed','cancelled'].includes(t.status)) summary.urgent++;
  }

  // All assignees for filter dropdown
  const assignees = [...new Set(enriched.map((t: any) => t.assigned_to).filter(Boolean))]
    .map(id => ({ id, name: profileMap[id as string] || 'Unknown' }));

  return NextResponse.json({ tasks: enriched, summary, assignees });
}
