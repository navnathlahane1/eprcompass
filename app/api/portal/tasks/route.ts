/**
 * POST /api/portal/tasks
 *
 * Allows portal clients to create tasks that are automatically assigned to
 * their RM (assigned_manager_id from clients table). Falls back to the
 * first admin profile when no RM is assigned.
 *
 * GET /api/portal/tasks
 *
 * Returns portal tasks created by or for the authenticated client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
type Priority = typeof VALID_PRIORITIES[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveAssignee(db: ReturnType<typeof adminClient>, clientId: string): Promise<string | null> {
  // 1. Try RM from clients row
  const { data: clientRow } = await (db as any)
    .from('clients')
    .select('assigned_manager_id')
    .eq('id', clientId)
    .maybeSingle();

  if (clientRow?.assigned_manager_id) {
    return clientRow.assigned_manager_id as string;
  }

  // 2. Fallback: first admin profile
  const { data: admins } = await (db as any)
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1);

  return admins?.[0]?.id ?? null;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'client' && !actor.isAdmin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();

  const { data: clientRow } = await (db as any)
    .from('clients')
    .select('id')
    .eq('profile_id', actor.userId)
    .maybeSingle();

  if (!clientRow) return NextResponse.json({ tasks: [] });

  const { data, error } = await (db as any)
    .from('portal_tasks')
    .select('id, title, description, task_type, status, priority, due_at, created_at, completed_at, resolution_note, assigned_to')
    .eq('client_id', clientRow.id)
    .eq('created_by', actor.userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with assignee name
  const tasks = data ?? [];
  const assigneeIds = [...new Set(tasks.map((t: any) => t.assigned_to).filter(Boolean))];
  const nameMap: Record<string, string> = {};

  if (assigneeIds.length > 0) {
    const { data: profiles } = await (db as any)
      .from('profiles')
      .select('id, full_name')
      .in('id', assigneeIds);
    for (const p of profiles ?? []) nameMap[p.id] = p.full_name || 'Team';
  }

  return NextResponse.json({
    tasks: tasks.map((t: any) => ({
      ...t,
      assignee_name: t.assigned_to ? (nameMap[t.assigned_to] || 'Team') : null,
    })),
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'client' && !actor.isAdmin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const title       = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const priority    = (body.priority as Priority) ?? 'normal';
  const tatMinutes  = Number(body.tat_minutes) || 120;

  if (!title || title.length < 3)
    return NextResponse.json({ error: 'Title is required (min 3 characters)' }, { status: 400 });
  if (!VALID_PRIORITIES.includes(priority))
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });

  const db = adminClient();

  // Resolve the client's row
  const { data: clientRow } = await (db as any)
    .from('clients')
    .select('id')
    .eq('profile_id', actor.userId)
    .maybeSingle();

  if (!clientRow) return NextResponse.json({ error: 'Client record not found' }, { status: 404 });

  // Resolve assignee: RM → admin fallback
  const assignedTo = await resolveAssignee(db, clientRow.id);

  const dueAt = new Date(Date.now() + tatMinutes * 60 * 1000).toISOString();

  const { data: task, error } = await (db as any)
    .from('portal_tasks')
    .insert({
      title,
      description: description || null,
      task_type:   'general',
      status:      'pending',
      priority,
      assigned_to: assignedTo,
      client_id:   clientRow.id,
      tat_minutes: tatMinutes,
      due_at:      dueAt,
      created_by:  actor.userId,
    })
    .select('id, title, description, task_type, status, priority, due_at, created_at, assigned_to')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the assignee via notifications (non-fatal)
  if (assignedTo) {
    await (db as any)
      .from('notifications')
      .insert({
        profile_id: assignedTo,
        type:       'system',
        message:    `New task from client: "${title}"`,
        read:       false,
        metadata:   { task_id: (task as any).id, action: 'client_task_created' },
      })
      .then(() => {});
  }

  // Fetch assignee name
  let assigneeName: string | null = null;
  if (assignedTo) {
    const { data: profile } = await (db as any)
      .from('profiles')
      .select('full_name')
      .eq('id', assignedTo)
      .maybeSingle();
    assigneeName = profile?.full_name || 'Team';
  }

  return NextResponse.json(
    { task: { ...(task as object), assignee_name: assigneeName } },
    { status: 201 }
  );
}
