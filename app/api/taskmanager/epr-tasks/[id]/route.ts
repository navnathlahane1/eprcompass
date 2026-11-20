/**
 * PATCH /api/taskmanager/epr-tasks/[id]
 *
 * Task managers can update the status and notes on any client_epr_task.
 *
 * Body: { status?: string; notes?: string }
 *
 * Auth: task_manager or admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Task id is required' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { status, notes } = body as { status?: string; notes?: string };

  const db = getServiceClient();

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (notes  !== undefined) updates.notes  = notes;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await db
    .from('client_epr_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
