import { NextRequest, NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

/** GET /api/portal/compliance-hub/tasks
 *  Returns authenticated client's compliance tasks.
 *  Optional filters: status, priority, compliance_id
 */
export async function GET(req: NextRequest) {
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const { searchParams } = new URL(req.url);
  const status       = searchParams.get('status') || '';
  const priority     = searchParams.get('priority') || '';
  const complianceId = searchParams.get('compliance_id') || '';

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
      compliance_deadlines ( id, title, filing_type, due_date, grace_period_days, penalty_info )
    `)
    .eq('client_id', actor.clientId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (status)       query = query.eq('status', status);
  if (priority)     query = query.eq('priority', priority);
  if (complianceId) query = query.eq('compliance_id', complianceId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Tasks are temporarily unavailable' }, { status: 503 });

  return NextResponse.json({ tasks: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

/** PATCH /api/portal/compliance-hub/tasks
 *  Client preparers can update notes and start pending tasks.
 *  Staff completion and review use the separate admin endpoint.
 */
export async function PATCH(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['OWNER', 'MANAGER', 'COMPLIANCE'].includes(actor.memberRole)) {
    return NextResponse.json({ error: 'Compliance editing access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid task update' }, { status: 400 });
  }
  const { id, notes, status } = body;
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)
    || (notes !== undefined && (typeof notes !== 'string' || notes.length > 10000))
    || (status !== undefined && status !== 'in_progress')
    || Object.keys(body).some(key => !['id', 'notes', 'status'].includes(key))) {
    return NextResponse.json({ error: 'Invalid task update. Completion and review are staff-controlled.' }, { status: 400 });
  }

  const db = adminClient();

  const { data: task, error: taskError } = await (db as any)
    .from('client_compliance_tasks')
    .select('id, status, updated_at')
    .eq('id', id)
    .eq('client_id', actor.clientId)
    .maybeSingle();

  if (taskError) return NextResponse.json({ error: 'Task is temporarily unavailable' }, { status: 503 });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!['pending', 'in_progress', 'overdue'].includes(task.status)) {
    return NextResponse.json({ error: 'This task is locked. Contact your compliance manager.' }, { status: 409 });
  }

  const payload: Record<string, unknown> = {};
  if (notes !== undefined) payload.notes = notes;

  if (status === 'in_progress') payload.status = 'in_progress';

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  const { data, error } = await (db as any)
    .from('client_compliance_tasks')
    .update(payload)
    .eq('id', id)
    .eq('client_id', actor.clientId)
    .eq('status', task.status)
    .eq('updated_at', task.updated_at)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Task update could not be saved' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'Task changed. Refresh before retrying.' }, { status: 409 });
  return NextResponse.json({ task: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
