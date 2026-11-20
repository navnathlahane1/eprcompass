/**
 * GET  /api/telecalling/tasks   — list tasks for the current telecaller
 * POST /api/telecalling/tasks   — create a task (self-assign by default; admin can assign to others)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor, makeServiceClient } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

const ADMIN_ROLE_ID = process.env.TC_ADMIN_USER_ID ?? null;

async function getAdminId(db: ReturnType<typeof makeServiceClient>): Promise<string | null> {
  if (ADMIN_ROLE_ID) return ADMIN_ROLE_ID;
  const { data } = await db.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function GET(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 30;
  const offset = (page - 1) * limit;

  let query = actor.db
    .from('tc_tasks')
    .select(
      `*, lead:leads(company_name, name, phone),
       creator:profiles!tc_tasks_created_by_fkey(full_name),
       assignee:profiles!tc_tasks_assigned_to_fkey(full_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!['admin', 'manager'].includes(actor.role)) {
    query = query.or(`created_by.eq.${actor.id},assigned_to.eq.${actor.id}`);
  }

  if (status && status !== 'all') query = query.eq('status', status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { title, description, lead_id, priority, due_date, assigned_to } = body as Record<string, string>;
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  // Default: assign to self. Admin can assign to any specified user.
  let assigneeId: string = actor.id;
  if (assigned_to && ['admin', 'manager'].includes(actor.role)) {
    assigneeId = assigned_to;
  } else if (!['admin', 'manager'].includes(actor.role)) {
    // Non-admin telecallers: also log to admin for oversight via a separate notification pattern
    // Task is assigned to self; admin can monitor via team-lead stats
    assigneeId = actor.id;
  }

  const { data, error } = await actor.db.from('tc_tasks').insert({
    title: title.trim(),
    description: description?.trim() || null,
    lead_id: lead_id || null,
    created_by: actor.id,
    assigned_to: assigneeId,
    status: 'pending',
    priority: priority || 'normal',
    due_date: due_date || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
