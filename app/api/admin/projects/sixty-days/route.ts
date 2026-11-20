import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const dynamic = 'force-dynamic';

const SIXTY_DAY_GROUPS = {
  cepc:        { label: 'CEPC',        color: 'violet', roles: ['cepc'] },
  employees:   { label: 'Employees',   color: 'blue',   roles: ['manager', 'user_manager', 'task_manager', 'sales-executive', 'finance_executive', 'cfo', 'trainer', 'academy_manager', 'academy_director', 'training_program_manager'] },
  interns:     { label: 'Interns',     color: 'amber',  roles: ['learner'] },
  freelancers: { label: 'Freelancers', color: 'teal',   roles: ['guest_trainer', 'partner_trainer'] },
};

const ALL_SIXTY_DAY_ROLES = Object.values(SIXTY_DAY_GROUPS).flatMap(g => g.roles);

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

  // Find or create the 60 Days Project
  let { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('category', 'sixty_days')
    .maybeSingle();

  if (!project) {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 86400000);
    const { data: created } = await supabase
      .from('projects')
      .insert({
        name: '60 Days Project',
        description: 'Cross-portal initiative tracking CEPC staff, employees, interns, and freelancers over a 60-day period.',
        status: 'active',
        priority: 'High',
        category: 'sixty_days',
        owner_id: actor.userId,
        start_date: now.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      })
      .select('*')
      .single();
    project = created;

    // Log creation
    if (project) {
      await supabase.from('project_activity').insert({
        project_id: project.id,
        actor_id: actor.userId,
        action: 'created_project',
        meta: { name: '60 Days Project', auto_created: true },
      });
    }
  }

  if (!project) return NextResponse.json({ error: 'Failed to init project' }, { status: 500 });

  // Get all participants from relevant roles
  const { data: participants } = await supabase
    .from('profiles')
    .select('id, full_name, role, email')
    .in('role', ALL_SIXTY_DAY_ROLES)
    .order('full_name');

  // Auto-sync members (upsert all participants)
  if (participants?.length) {
    await supabase.from('project_members').upsert(
      participants.map((p: any) => ({ project_id: project!.id, user_id: p.id, role: 'member' })),
      { onConflict: 'project_id,user_id' }
    );
  }

  // Fetch tasks + warnings + activity
  const [tasksRes, warningsRes, activityRes, membersRes] = await Promise.all([
    supabase.from('project_tasks')
      .select('*, assignee:profiles!project_tasks_assigned_to_fkey(id, full_name, role)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false }),
    supabase.from('project_warnings').select('*').eq('project_id', project.id).eq('resolved', false),
    supabase.from('project_activity')
      .select('*, actor:profiles!project_activity_actor_id_fkey(id, full_name)')
      .eq('project_id', project.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('project_members')
      .select('user_id, role, profiles(id, full_name, role)')
      .eq('project_id', project.id),
  ]);

  const tasks = tasksRes.data || [];
  const now = new Date();

  // Per-participant stats
  const allParticipants = participants || [];
  const participantStats = allParticipants.map((p: any) => {
    const pTasks = tasks.filter((t: any) => t.assigned_to === p.id);
    const done = pTasks.filter((t: any) => t.status === 'done').length;
    const open = pTasks.filter((t: any) => !['done', 'cancelled'].includes(t.status)).length;
    const overdue = pTasks.filter((t: any) => t.due_date && new Date(t.due_date) < now && !['done', 'cancelled'].includes(t.status)).length;
    const blocked = pTasks.filter((t: any) => t.status === 'blocked').length;
    const groupKey = Object.entries(SIXTY_DAY_GROUPS).find(([, g]) => g.roles.includes(p.role))?.[0] || 'employees';
    return { ...p, total: pTasks.length, done, open, overdue, blocked, groupKey };
  });

  // Group-level stats
  const groupStats = Object.entries(SIXTY_DAY_GROUPS).map(([key, g]) => {
    const members = participantStats.filter((p: any) => p.groupKey === key);
    const total = members.reduce((s: number, m: any) => s + m.total, 0);
    const done = members.reduce((s: number, m: any) => s + m.done, 0);
    const overdue = members.reduce((s: number, m: any) => s + m.overdue, 0);
    return { key, label: g.label, color: g.color, memberCount: members.length, total, done, overdue, completionRate: total > 0 ? Math.round((done / total) * 100) : 0 };
  });

  // Days remaining
  const daysRemaining = project.end_date
    ? Math.max(0, Math.ceil((new Date(project.end_date).getTime() - now.getTime()) / 86400000))
    : 60;

  return NextResponse.json({
    project,
    tasks,
    participants: participantStats,
    groupStats,
    warnings: warningsRes.data || [],
    activity: activityRes.data || [],
    members: membersRes.data || [],
    daysRemaining,
  });
}
