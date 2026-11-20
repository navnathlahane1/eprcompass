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

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = db();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get counts for each project
  const ids = (projects || []).map((p: any) => p.id);
  if (!ids.length) return NextResponse.json({ projects: [] });

  const [membersRes, tasksRes, warningsRes] = await Promise.all([
    supabase.from('project_members').select('project_id, user_id').in('project_id', ids),
    supabase.from('project_tasks').select('project_id, status').in('project_id', ids),
    supabase.from('project_warnings').select('project_id, severity').eq('resolved', false).in('project_id', ids),
  ]);

  const memberCount: Record<string, number> = {};
  const taskCount: Record<string, number> = {};
  const openTaskCount: Record<string, number> = {};
  const warningCount: Record<string, number> = {};

  (membersRes.data || []).forEach((m: any) => {
    memberCount[m.project_id] = (memberCount[m.project_id] || 0) + 1;
  });
  (tasksRes.data || []).forEach((t: any) => {
    taskCount[t.project_id] = (taskCount[t.project_id] || 0) + 1;
    if (!['done', 'cancelled'].includes(t.status)) {
      openTaskCount[t.project_id] = (openTaskCount[t.project_id] || 0) + 1;
    }
  });
  (warningsRes.data || []).forEach((w: any) => {
    warningCount[w.project_id] = (warningCount[w.project_id] || 0) + 1;
  });

  const enriched = (projects || []).map((p: any) => ({
    ...p,
    member_count: memberCount[p.id] || 0,
    task_count: taskCount[p.id] || 0,
    open_task_count: openTaskCount[p.id] || 0,
    warning_count: warningCount[p.id] || 0,
  }));

  return NextResponse.json({ projects: enriched });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, status, priority, category, start_date, end_date,
    target_proposals, target_filings, target_clients, budget_inr, members } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const supabase = db();

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: name.trim(),
      description: description || null,
      status: status || 'planning',
      priority: priority || 'Medium',
      category: category || 'general',
      owner_id: actor.userId,
      start_date: start_date || null,
      end_date: end_date || null,
      target_proposals: target_proposals || 0,
      target_filings: target_filings || 0,
      target_clients: target_clients || 0,
      budget_inr: budget_inr || null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add members
  if (members?.length) {
    const memberRows = members.map((m: any) => ({
      project_id: project.id,
      user_id: m.user_id,
      role: m.role || 'member',
    }));
    await supabase.from('project_members').insert(memberRows);
  }

  // Always add owner as lead
  await supabase.from('project_members').upsert({
    project_id: project.id,
    user_id: actor.userId,
    role: 'lead',
  }, { onConflict: 'project_id,user_id' });

  // Log activity
  await supabase.from('project_activity').insert({
    project_id: project.id,
    actor_id: actor.userId,
    action: 'created_project',
    meta: { name: project.name },
  });

  return NextResponse.json({ project });
}
