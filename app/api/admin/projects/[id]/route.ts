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

async function runWarningCheck(supabase: ReturnType<typeof db>, projectId: string) {
  const now = new Date();
  const [tasksRes, activityRes, membersRes] = await Promise.all([
    supabase.from('project_tasks').select('*').eq('project_id', projectId),
    supabase.from('project_activity').select('created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
    supabase.from('project_members').select('user_id').eq('project_id', projectId),
  ]);

  const tasks = tasksRes.data || [];
  const warnings: any[] = [];

  // Get existing unresolved warnings to avoid dupes
  const { data: existing } = await supabase
    .from('project_warnings')
    .select('task_id, warning_type')
    .eq('project_id', projectId)
    .eq('resolved', false);

  const existingSet = new Set((existing || []).map((w: any) => `${w.task_id}:${w.warning_type}`));

  for (const task of tasks) {
    if (['done', 'cancelled'].includes(task.status)) continue;
    const key = (type: string) => `${task.id}:${type}`;

    // Overdue
    if (task.due_date && new Date(task.due_date) < now && !existingSet.has(key('overdue'))) {
      const daysOver = Math.floor((now.getTime() - new Date(task.due_date).getTime()) / 86400000);
      warnings.push({
        project_id: projectId,
        task_id: task.id,
        warning_type: 'overdue',
        severity: daysOver > 5 ? 'critical' : daysOver > 2 ? 'high' : 'medium',
        message: `Task "${task.title}" is ${daysOver} day(s) overdue`,
      });
    }

    // SLA breach
    if (task.sla_hours && !existingSet.has(key('sla_breach'))) {
      const elapsed = (now.getTime() - new Date(task.created_at).getTime()) / 3600000;
      if (elapsed > task.sla_hours) {
        warnings.push({
          project_id: projectId,
          task_id: task.id,
          warning_type: 'sla_breach',
          severity: 'high',
          message: `Task "${task.title}" has exceeded SLA of ${task.sla_hours}h`,
        });
      }
    }

    // Blocked too long
    if (task.status === 'blocked' && !existingSet.has(key('blocked_too_long'))) {
      const hrs = (now.getTime() - new Date(task.updated_at).getTime()) / 3600000;
      if (hrs > 4) {
        warnings.push({
          project_id: projectId,
          task_id: task.id,
          warning_type: 'blocked_too_long',
          severity: hrs > 8 ? 'critical' : 'high',
          message: `Task "${task.title}" has been blocked for ${Math.floor(hrs)}h`,
        });
      }
    }
  }

  // No activity in 24h
  const lastActivity = activityRes.data?.[0]?.created_at;
  const noActivityKey = `null:no_activity`;
  if (!existingSet.has(noActivityKey)) {
    const hrs = lastActivity
      ? (now.getTime() - new Date(lastActivity).getTime()) / 3600000
      : 999;
    if (hrs > 24) {
      warnings.push({
        project_id: projectId,
        task_id: null,
        warning_type: 'no_activity',
        severity: 'low',
        message: `No activity recorded in the last 24 hours`,
      });
    }
  }

  // Member overloaded (>10 open tasks)
  for (const member of membersRes.data || []) {
    const memberTasks = tasks.filter((t: any) =>
      t.assigned_to === member.user_id && !['done', 'cancelled'].includes(t.status)
    );
    const overloadKey = `${member.user_id}:member_overloaded`;
    if (memberTasks.length > 10 && !existingSet.has(overloadKey)) {
      warnings.push({
        project_id: projectId,
        task_id: null,
        warning_type: 'member_overloaded',
        severity: 'high',
        message: `A member has ${memberTasks.length} open tasks assigned`,
        meta: { user_id: member.user_id },
      });
    }
  }

  if (warnings.length) {
    await supabase.from('project_warnings').insert(warnings);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = db();

  // Run warning check on every load
  await runWarningCheck(supabase, id);

  const [projectRes, membersRes, tasksRes, warningsRes, activityRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('project_members').select('*, profiles(id, full_name, role)').eq('project_id', id),
    supabase.from('project_tasks').select('*, profiles!project_tasks_assigned_to_fkey(id, full_name), creator:profiles!project_tasks_created_by_fkey(id, full_name)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('project_warnings').select('*').eq('project_id', id).eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('project_activity').select('*, actor:profiles!project_activity_actor_id_fkey(id, full_name)').eq('project_id', id).order('created_at', { ascending: false }).limit(20),
  ]);

  if (projectRes.error) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  return NextResponse.json({
    project: projectRes.data,
    members: membersRes.data || [],
    tasks: tasksRes.data || [],
    warnings: warningsRes.data || [],
    activity: activityRes.data || [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = db();

  const { error } = await supabase
    .from('projects')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('project_activity').insert({
    project_id: id,
    actor_id: actor.userId,
    action: 'updated_project',
    meta: body,
  });

  return NextResponse.json({ success: true });
}
