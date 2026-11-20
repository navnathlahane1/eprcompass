/**
 * PATCH /api/finance/tasks/[id]
 * Update a finance task (status, resolution_note).
 *
 * Special action via body.action:
 *   'payment_confirmed' → marks task completed AND creates IAM task to set up client login
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

async function findFinanceExecutive(db: any): Promise<string | null> {
  const { data } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'finance_executive')
    .eq('is_banned', false)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function findUserManager(db: any): Promise<string | null> {
  const { data } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'user_manager')
    .eq('is_banned', false)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, resolution_note, action } = body as {
    status?: string;
    resolution_note?: string;
    action?: string;
  };

  const db  = getServiceClient();
  const now = new Date().toISOString();

  // Fetch the task to verify assignment
  const { data: task, error: tErr } = await (db as any)
    .from('portal_tasks')
    .select('id, title, client_id, assigned_to, status, task_type')
    .eq('id', id)
    .maybeSingle();

  if (tErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Non-CFO can only update their own tasks
  if (!actor.isCFO && task.assigned_to !== actor.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Build update payload
  const updates: Record<string, unknown> = {};
  if (status)          updates.status          = status;
  if (resolution_note !== undefined) updates.resolution_note = resolution_note;
  if (status === 'completed') {
    updates.completed_at = now;
    updates.completed_by = actor.id;
  }

  if (Object.keys(updates).length) {
    const { error: uErr } = await (db as any).from('portal_tasks').update(updates).eq('id', id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  // ── Special action: payment_confirmed ────────────────────────────────────────
  // Triggers: IAM task → client login creation
  if (action === 'payment_confirmed') {
    const iamUserId = await findUserManager(db);
    await (db as any).from('portal_tasks').insert({
      title:               `Create client login — ${task.client_id ? `client ${task.client_id}` : 'new client'} (payment confirmed)`,
      description:         `Payment has been confirmed by finance for this deal/service. Create the client's portal login account so they can access the EPR portal.`,
      task_type:           'iam_create_client',
      status:              'pending',
      priority:            'high',
      assigned_to:         iamUserId,
      client_id:           task.client_id,
      related_entity_type: 'portal_task',
      related_entity_id:   id,
      due_at:              new Date(Date.now() + 2 * 86400_000).toISOString(), // 2 days
      tat_minutes:         2880,
      created_by:          actor.id,
    });
  }

  // ── Special action: service_payment_confirmed ─────────────────────────────────
  // For service requests: payment confirmed → task for manager to fulfil the service
  if (action === 'service_payment_confirmed') {
    // Find the manager assigned to this client
    let managerId: string | null = null;
    if (task.client_id) {
      const { data: cl } = await (db as any)
        .from('clients')
        .select('assigned_manager_id')
        .eq('id', task.client_id)
        .maybeSingle();
      managerId = cl?.assigned_manager_id ?? null;
    }
    await (db as any).from('portal_tasks').insert({
      title:               `Fulfil service request — payment received`,
      description:         `Finance has confirmed payment for this service request. Please complete the service delivery.`,
      task_type:           'service_fulfillment',
      status:              'pending',
      priority:            'high',
      assigned_to:         managerId,
      client_id:           task.client_id,
      related_entity_type: 'portal_task',
      related_entity_id:   id,
      due_at:              new Date(Date.now() + 7 * 86400_000).toISOString(), // 7 days
      tat_minutes:         10080,
      created_by:          actor.id,
    });
  }

  return NextResponse.json({ ok: true });
}
