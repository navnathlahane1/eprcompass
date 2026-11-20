/**
 * GET  /api/admin/telecalling/tasks  — all tasks + auto-escalate overdue ones
 * POST /api/admin/telecalling/tasks  — admin creates a task directly
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

async function autoEscalateOverdue(db: ReturnType<typeof makeServiceClient>) {
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Find tasks pending >24h that haven't been escalated yet
  const { data: overdue } = await db
    .from('tc_tasks')
    .select('id, created_by, title')
    .in('status', ['pending', 'in_progress'])
    .lt('created_at', cutoff24h)
    .is('escalated_at', null);

  if (!overdue?.length) return;

  // Mark them escalated
  const ids = overdue.map(t => t.id);
  await db.from('tc_tasks').update({ status: 'escalated', escalated_at: now, updated_at: now }).in('id', ids);

  // Insert into task_escalations for task manager portal visibility
  const escalations = overdue.map(t => ({
    task_source: 'tc_task',
    task_id: t.id,
    escalated_by: t.created_by,
    escalated_at: now,
    reason: 'Task unresolved for 24+ hours',
    severity: 'high',
    resolved: false,
  }));
  await db.from('task_escalations').insert(escalations);
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const agentId = searchParams.get('agent_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Run escalation check on every admin load (lightweight)
  await autoEscalateOverdue(db);

  let query = db
    .from('tc_tasks')
    .select(
      `*, lead:leads(company_name, name, phone),
       creator:profiles!tc_tasks_created_by_fkey(id, full_name, role),
       assignee:profiles!tc_tasks_assigned_to_fkey(id, full_name, role)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') query = query.eq('status', status);
  if (agentId) query = query.eq('created_by', agentId);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary counts
  const { data: summary } = await db
    .from('tc_tasks')
    .select('status')
    .neq('status', 'cancelled');

  const counts = { pending: 0, in_progress: 0, completed: 0, escalated: 0, total: 0 };
  for (const row of summary ?? []) {
    const s = row.status as keyof typeof counts;
    if (s in counts) counts[s]++;
    counts.total++;
  }

  // Fetch telecaller/agent profiles for assign dropdown
  const { data: agents } = await db
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['telecaller', 'sales-executive'])
    .eq('is_banned', false)
    .order('full_name');

  return NextResponse.json({ tasks: data ?? [], total: count ?? 0, page, limit, summary: counts, agents: agents ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor || !actor.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { title, description, lead_id, priority, due_date, assigned_to } = body as Record<string, string>;
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const db = makeServiceClient();
  const { data, error } = await db.from('tc_tasks').insert({
    title: title.trim(),
    description: description?.trim() || null,
    lead_id: lead_id || null,
    created_by: actor.userId,
    assigned_to: assigned_to || null,
    allocated_at: assigned_to ? new Date().toISOString() : null,
    status: assigned_to ? 'in_progress' : 'pending',
    priority: priority || 'normal',
    due_date: due_date || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
