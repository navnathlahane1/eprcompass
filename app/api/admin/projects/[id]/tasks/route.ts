import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = db();

  const { data, error } = await supabase
    .from('project_tasks')
    .select('*, profiles!project_tasks_assigned_to_fkey(id, full_name)')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = db();

  // Verify caller is a project member
  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', actor.userId)
    .maybeSingle();

  if (!member && !['admin', 'manager', 'task_manager'].includes(actor.role || '')) {
    return NextResponse.json({ error: 'Not a project member' }, { status: 403 });
  }

  if (member?.role === 'observer') {
    return NextResponse.json({ error: 'Observers cannot create tasks' }, { status: 403 });
  }

  const { data: task, error } = await supabase
    .from('project_tasks')
    .insert({
      project_id: id,
      title: body.title,
      description: body.description || null,
      category: body.category || 'general',
      status: 'todo',
      priority: body.priority || 'Medium',
      assigned_to: body.assigned_to || null,
      created_by: actor.userId,
      due_date: body.due_date || null,
      sla_hours: body.sla_hours || null,
      tags: body.tags || [],
      depends_on: body.depends_on || [],
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('project_activity').insert({
    project_id: id,
    task_id: task.id,
    actor_id: actor.userId,
    action: 'created_task',
    meta: { title: task.title },
  });

  return NextResponse.json({ task });
}
