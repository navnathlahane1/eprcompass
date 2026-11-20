/**
 * GET /api/tasks
 * Returns portal tasks for the current user.
 *   - Managers: tasks assigned to them
 *   - Admins:   all tasks (optionally filtered by assigned_to or client_id)
 *
 * Query params:
 *   status   pending | in_progress | completed | cancelled | overdue
 *   type     task_type filter
 *   client_id
 *   assigned_to  (admin only)
 *   limit    default 50
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const statusFilter = sp.get('status') || '';
  const typeFilter   = sp.get('type') || '';
  const clientFilter = sp.get('client_id') || '';
  const assigneeFilter = sp.get('assigned_to') || '';
  const limit = Math.min(parseInt(sp.get('limit') || '50', 10), 200);

  const db = getAdminClient();
  const now = new Date().toISOString();
  const isAdmin = actor.role === 'admin';

  let query = db
    .from('portal_tasks')
    .select(`
      id, title, description, task_type, status, priority,
      assigned_to, client_id,
      related_entity_type, related_entity_id,
      tat_minutes, due_at, created_at, updated_at,
      completed_at, completed_by, resolution_note, created_by
    `)
    .order('due_at', { ascending: true });

  // Scope: managers see only their tasks; admins see all
  if (!isAdmin) {
    (query as any) = (query as any).eq('assigned_to', actor.id);
  } else if (assigneeFilter) {
    (query as any) = (query as any).eq('assigned_to', assigneeFilter);
  }

  // Filters
  if (clientFilter) (query as any) = (query as any).eq('client_id', clientFilter);
  if (typeFilter)   (query as any) = (query as any).eq('task_type', typeFilter);

  if (statusFilter === 'overdue') {
    // Overdue = due_at < now AND not completed/cancelled
    (query as any) = (query as any)
      .lt('due_at', now)
      .in('status', ['pending', 'in_progress']);
  } else if (statusFilter) {
    (query as any) = (query as any).eq('status', statusFilter);
  }

  (query as any) = (query as any).limit(limit);

  const { data, error } = await (query as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tasks = (data ?? []).map((t: any) => {
    const elapsedMs   = Date.now() - new Date(t.created_at).getTime();
    const elapsedMin  = Math.floor(elapsedMs / 60000);
    const isOverdue   = !['completed', 'cancelled'].includes(t.status) && t.due_at < now;
    const isDone      = ['completed', 'cancelled'].includes(t.status);
    const actualTatMin = isDone && t.completed_at
      ? Math.round((new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / 60000)
      : null;

    return {
      ...t,
      elapsed_min: elapsedMin,
      is_overdue: isOverdue,
      actual_tat_min: actualTatMin,
    };
  });

  // Summary counts
  const pending   = tasks.filter((t: any) => t.status === 'pending').length;
  const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
  const overdue   = tasks.filter((t: any) => t.is_overdue).length;
  const completed = tasks.filter((t: any) => t.status === 'completed').length;

  return NextResponse.json({ tasks, summary: { pending, in_progress: inProgress, overdue, completed, total: tasks.length } });
}
