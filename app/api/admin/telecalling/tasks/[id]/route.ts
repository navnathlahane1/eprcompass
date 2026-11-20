/**
 * PATCH /api/admin/telecalling/tasks/[id] — assign to agent / update status / escalate
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const dynamic = 'force-dynamic';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const db = makeServiceClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  // Assign to agent
  if (body.assigned_to !== undefined) {
    patch.assigned_to = body.assigned_to;
    patch.allocated_at = body.assigned_to ? now : null;
    patch.status = body.assigned_to ? 'in_progress' : 'pending';
  }

  if (body.status) {
    patch.status = body.status;
    if (body.status === 'completed') patch.completed_at = now;
    if (body.status === 'escalated') {
      patch.escalated_at = now;
      // Fetch task to get created_by for escalation record
      const { data: task } = await db.from('tc_tasks').select('created_by, title').eq('id', id).maybeSingle();
      if (task) {
        await db.from('task_escalations').insert({
          task_source: 'tc_task',
          task_id: id,
          escalated_by: actor.userId,
          escalated_at: now,
          reason: (body.escalation_reason as string) || 'Manually escalated by admin',
          severity: (body.severity as string) || 'high',
          resolved: false,
        });
      }
    }
  }

  if (body.priority) patch.priority = body.priority;
  if (body.due_date !== undefined) patch.due_date = body.due_date;
  if (body.description !== undefined) patch.description = body.description;

  const { data, error } = await db.from('tc_tasks').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor || !actor.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  await db.from('tc_tasks').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ success: true });
}
