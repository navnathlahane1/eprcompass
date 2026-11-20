import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import TaskBoardPageClient from './TaskBoardPageClient';

export default async function TaskBoardPage() {
  const supabase = await createServerComponentClient();

  const [tasksRes, commentsRes, profilesRes, clientsRes, leadsRes, partnersRes, recyclersRes, cepcRes, authRes] = await Promise.all([
    (supabase as any)
      .from('tasks')
      .select('id, title, description, entity_type, entity_id, assigned_to, created_by, priority, status, due_date, completed_at, sla_hours, actual_hours, tags, created_at')
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('task_comments')
      .select('id, task_id, author_id, content, created_at')
      .order('created_at', { ascending: true }),
    (supabase as any)
      .from('profiles')
      .select('id, full_name, company_name, role')
      .order('full_name', { ascending: true }),
    (supabase as any).from('clients').select('id, profile_id'),
    (supabase as any).from('leads').select('id, company, contact_name, tc_status'),
    (supabase as any).from('partners').select('id, company_name, contact_person'),
    (supabase as any).from('recyclers').select('id, company_name, contact_person'),
    (supabase as any).from('cepc_consultants').select('id, full_name'),
    supabase.auth.getUser()
  ]);

  const profileMap = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));

  const clientEntities = (clientsRes.data || []).map((c: any) => {
    const p = profileMap.get(c.profile_id);
    return { id: c.id, type: 'client', name: p?.company_name || p?.full_name || c.id };
  });

  const entities = [
    ...clientEntities,
    ...(leadsRes.data || []).map((l: any) => ({ id: l.id, type: 'lead', name: l.company || l.contact_name || l.id })),
    ...(partnersRes.data || []).map((p: any) => ({ id: p.id, type: 'partner', name: p.company_name || p.contact_person || p.id })),
    ...(recyclersRes.data || []).map((r: any) => ({ id: r.id, type: 'recycler', name: r.company_name || r.contact_person || r.id })),
    ...(cepcRes.data || []).map((c: any) => ({ id: c.id, type: 'cepc', name: c.full_name || c.id }))
  ];

  const entityNameMap = new Map<string, string>(entities.map((e: any) => [`${e.type}:${e.id}`, e.name]));

  const commentsByTask = new Map<string, any[]>();
  (commentsRes.data || []).forEach((row: any) => {
    if (!commentsByTask.has(row.task_id)) commentsByTask.set(row.task_id, []);
    commentsByTask.get(row.task_id)?.push({
      ...row,
      author_name: profileMap.get(row.author_id)?.full_name || row.author_id
    });
  });

  const tasks = (tasksRes.data || []).map((t: any) => ({
    ...t,
    assigned_name: t.assigned_to ? (profileMap.get(t.assigned_to)?.full_name || t.assigned_to) : null,
    assigned_initials: t.assigned_to ? (profileMap.get(t.assigned_to)?.full_name || 'NA').split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : null,
    entity_name: t.entity_id ? (entityNameMap.get(`${t.entity_type}:${t.entity_id}`) || t.entity_id) : t.entity_type,
    comments: commentsByTask.get(t.id) || []
  }));

  const assignees = (profilesRes.data || []).filter((p: any) => ['admin', 'manager'].includes(p.role || ''));

  // Workflow counts
  const allLeads = leadsRes.data || [];
  const leadIn = allLeads.filter((l: any) => l.tc_status === 'Interested').length;
  const clientOn = allLeads.filter((l: any) => l.tc_status === 'Converted').length;

  const [proposalsRes, filingsRes] = await Promise.all([
    (supabase as any).from('tc_proposals').select('id, status'),
    (supabase as any).from('tc_filings').select('id').limit(1)
  ]);

  const proposals = proposalsRes.data || [];
  const proposalOut = proposals.filter((p: any) => p.status === 'sent').length;
  const invoice = proposals.filter((p: any) => p.status === 'accepted').length;
  const filingDone = filingsRes.error ? 0 : (filingsRes.data || []).length;

  const workflowCounts = { leadIn, proposalOut, invoice, clientOn, filingDone };

  return (
    <TaskBoardPageClient
      initialTasks={tasks}
      entities={entities}
      assignees={assignees}
      currentUserId={authRes?.data?.user?.id || null}
      workflowCounts={workflowCounts}
    />
  );
}
