/**
 * PATCH /api/iam/tasks/[id]
 * Update an IAM task (iam_create_client).
 *
 * When status = 'completed' on an 'iam_create_client' task:
 *   → creates 'admin_connect_intel' portal_task for an admin/manager
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || !['user_manager', 'admin', 'manager'].includes(authUser.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, resolution_note } = body as { status?: string; resolution_note?: string };

  const db  = getServiceClient();
  const now = new Date().toISOString();

  // Fetch task
  const { data: task, error: tErr } = await (db as any)
    .from('portal_tasks')
    .select('id, title, task_type, status, client_id, assigned_to')
    .eq('id', id)
    .maybeSingle();

  if (tErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Non-admin can only update their own tasks
  if (authUser.role === 'user_manager' && task.assigned_to !== authUser.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (resolution_note !== undefined) updates.resolution_note = resolution_note;
  if (status === 'completed') {
    updates.completed_at = now;
    updates.completed_by = authUser.id;
  }

  if (Object.keys(updates).length) {
    const { error: uErr } = await (db as any).from('portal_tasks').update(updates).eq('id', id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  // ── iam_create_client completed → admin_connect_intel ───────────────────
  if (status === 'completed' && task.task_type === 'iam_create_client') {
    // Find an admin/manager to assign intel connection task
    const { data: adminUser } = await (db as any)
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager'])
      .eq('is_banned', false)
      .limit(1)
      .maybeSingle();

    await (db as any).from('portal_tasks').insert({
      title:               `Connect client login to Intel company record`,
      description:         `IAM has created the client portal login. Please connect this login to the corresponding company in the Intel module to complete account setup.`,
      task_type:           'admin_connect_intel',
      status:              'pending',
      priority:            'high',
      assigned_to:         adminUser?.id ?? null,
      client_id:           task.client_id,
      related_entity_type: 'portal_task',
      related_entity_id:   id,
      due_at:              new Date(Date.now() + 2 * 86400_000).toISOString(),
      tat_minutes:         2880,
      created_by:          authUser.id,
    });
  }

  return NextResponse.json({ ok: true });
}
