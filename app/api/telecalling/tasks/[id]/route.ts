/**
 * GET   /api/telecalling/tasks/[id]  — task detail
 * PATCH /api/telecalling/tasks/[id]  — update status / mark complete
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await actor.db
    .from('tc_tasks')
    .select(`*, lead:leads(company_name, name, phone),
             creator:profiles!tc_tasks_created_by_fkey(full_name),
             assignee:profiles!tc_tasks_assigned_to_fkey(full_name)`)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ task: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (body.status) {
    patch.status = body.status;
    if (body.status === 'completed') patch.completed_at = now;
    if (body.status === 'in_progress' && !body.allocated_at) patch.allocated_at = now;
    if (body.status === 'escalated') patch.escalated_at = now;
  }
  if (body.description !== undefined) patch.description = body.description;
  if (body.priority)    patch.priority = body.priority;
  if (body.due_date !== undefined)    patch.due_date = body.due_date;

  const { data, error } = await actor.db
    .from('tc_tasks')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
