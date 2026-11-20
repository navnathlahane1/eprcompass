/**
 * PATCH /api/taskmanager/portal-tasks/[id]
 *
 * Task Manager can:
 *   - Reassign a task to a different profile (assigned_to)
 *   - Change priority
 *   - Change status (any direction — task managers have full control)
 *   - Add a resolution note
 *   - Extend due_at (snooze)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body   = await req.json().catch(() => ({}));

  const { assigned_to, priority, status, resolution_note, due_at } = body as {
    assigned_to?:    string;
    priority?:       string;
    status?:         string;
    resolution_note?: string;
    due_at?:         string;   // ISO — for snooze
  };

  const db = getServiceClient();

  const { data: task } = await db
    .from('portal_tasks')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const VALID_STATUSES = ['pending','in_progress','completed','cancelled'];
  const VALID_PRIORITIES = ['low','normal','high','urgent'];

  if (assigned_to !== undefined)  patch.assigned_to = assigned_to || null;
  if (priority && VALID_PRIORITIES.includes(priority)) patch.priority = priority;
  if (status   && VALID_STATUSES.includes(status))     {
    patch.status = status;
    if (status === 'completed') {
      patch.completed_at = new Date().toISOString();
      patch.completed_by = actor.id;
    }
    if (status === 'pending' || status === 'in_progress') {
      patch.completed_at = null;
      patch.completed_by = null;
    }
  }
  if (typeof resolution_note === 'string') patch.resolution_note = resolution_note.slice(0, 500);
  if (due_at) patch.due_at = due_at;

  const { error } = await db
    .from('portal_tasks')
    .update(patch)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log reassignment if assigned_to changed
  if (assigned_to !== undefined) {
    await db.from('iam_audit_log').insert({
      action:      'task_reassign',
      target_id:   id,
      performed_by: actor.id,
      details:     { new_assignee: assigned_to, source: 'task_manager' },
    }).then(() => {});
  }

  return NextResponse.json({ ok: true });
}
