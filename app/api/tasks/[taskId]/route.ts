/**
 * PATCH /api/tasks/[taskId]
 * Update task status or add a resolution note.
 * Body: { status: 'in_progress' | 'completed' | 'cancelled', resolution_note?: string }
 *
 * Rules:
 *   - Managers can only update tasks assigned to them.
 *   - Admins can update any task.
 *   - Cannot revert a completed/cancelled task back to pending (must cancel then recreate).
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:     ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed:   [],
  cancelled:   [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status: newStatus, resolution_note } = body;

  if (!newStatus) return NextResponse.json({ error: 'status is required' }, { status: 400 });

  const db = getAdminClient();

  // Fetch the task
  const { data: task, error: fetchErr } = await db
    .from('portal_tasks')
    .select('id, status, assigned_to, task_type, client_id')
    .eq('id', taskId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!task)   return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Scope check: managers can only update their own tasks
  if (actor.role !== 'admin' && (task as any).assigned_to !== actor.id) {
    return NextResponse.json({ error: 'Task not assigned to you' }, { status: 403 });
  }

  // Validate transition
  const currentStatus = (task as any).status as string;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot move task from '${currentStatus}' to '${newStatus}'` },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === 'completed') {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = actor.id;
  }
  if (typeof resolution_note === 'string' && resolution_note.trim()) {
    patch.resolution_note = resolution_note.trim().slice(0, 500);
  }

  const { error: updateErr } = await db
    .from('portal_tasks')
    .update(patch)
    .eq('id', taskId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // ── admin_connect_intel completed → admin_assign_manager ─────────────────
  if (newStatus === 'completed' && (task as any).task_type === 'admin_connect_intel') {
    await db.from('portal_tasks').insert({
      title:               `Assign compliance manager to client`,
      description:         `The client's portal login has been connected to the Intel company record. Please assign a compliance manager to this client to begin service delivery.`,
      task_type:           'admin_assign_manager',
      status:              'pending',
      priority:            'high',
      assigned_to:         actor.role === 'admin' ? actor.id : null,
      client_id:           (task as any).client_id,
      related_entity_type: 'portal_task',
      related_entity_id:   taskId,
      due_at:              new Date(Date.now() + 2 * 86400_000).toISOString(),
      tat_minutes:         2880,
      created_by:          actor.id,
    } as any);
  }

  return NextResponse.json({ success: true, status: newStatus });
}
