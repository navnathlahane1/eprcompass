import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/compliance-knowledge/tasks
 *  Lists compliance tasks — filter by client_id, status, priority, assigned_to.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const clientId   = searchParams.get('client_id') || '';
  const status     = searchParams.get('status') || '';
  const priority   = searchParams.get('priority') || '';
  const assignedTo = searchParams.get('assigned_to') || '';
  const overdue    = searchParams.get('overdue') === 'true';

  const db = adminClient();
  let query = (db as any)
    .from('client_compliance_tasks')
    .select(`
      *,
      client_compliances (
        id,
        compliance_frameworks (
          id, name, short_name,
          compliance_countries ( id, name, iso2, flag_emoji ),
          compliance_types ( id, name, code )
        )
      ),
      compliance_deadlines ( id, title, due_date, filing_type ),
      assignee:profiles!client_compliance_tasks_assigned_to_fkey ( id, full_name ),
      clients ( id, profiles!clients_profile_id_fkey ( full_name, company_name ) )
    `)
    .order('due_date', { ascending: true });

  if (clientId)   query = query.eq('client_id', clientId);
  if (status)     query = query.eq('status', status);
  if (priority)   query = query.eq('priority', priority);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);
  if (overdue) {
    const today = new Date().toISOString().split('T')[0];
    query = query.lt('due_date', today).not('status', 'in', '("completed","waived")');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data });
}

/** POST /api/admin/compliance-knowledge/tasks — create a manual task */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const {
    client_id, compliance_id, deadline_id,
    title, description, task_type,
    due_date, priority, assigned_to, notes
  } = body;

  if (!client_id || !compliance_id || !title) {
    return NextResponse.json({ error: 'client_id, compliance_id, and title are required' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('client_compliance_tasks')
    .insert({
      client_id,
      compliance_id,
      deadline_id: deadline_id || null,
      title,
      description: description || null,
      task_type: task_type || 'other',
      due_date: due_date || null,
      priority: priority || 'normal',
      status: 'pending',
      assigned_to: assigned_to || null,
      notes: notes || null,
      is_auto_generated: false,
      created_by: actor.userId,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}

/** PATCH /api/admin/compliance-knowledge/tasks — update task (id in body) */
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const allowed = [
    'title','description','task_type','due_date','priority',
    'status','assigned_to','notes','completed_at','completed_by'
  ];
  const payload: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in updates) payload[k] = updates[k];
  }

  // Auto-set completed_at when status → completed
  if (payload.status === 'completed' && !payload.completed_at) {
    payload.completed_at = new Date().toISOString();
    payload.completed_by = actor.userId;
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('client_compliance_tasks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
