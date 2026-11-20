import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/compliance-knowledge/assign?client_id=...
 *  Lists all compliance frameworks assigned to a client.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id') || '';

  const db = adminClient();
  let query = (db as any)
    .from('client_compliances')
    .select(`
      *,
      compliance_frameworks (
        id, name, short_name, portal_url,
        compliance_countries ( id, name, iso2, flag_emoji ),
        compliance_types ( id, name, code, category )
      ),
      profiles!client_compliances_assigned_by_fkey ( id, full_name )
    `)
    .order('created_at', { ascending: false });

  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assignments: data });
}

/** POST /api/admin/compliance-knowledge/assign
 *  Assigns a compliance framework to a client.
 *  Body: { client_id, framework_id, entity_type?, registration_no?, notes? }
 */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { client_id, framework_id, entity_type, registration_no, notes } = body;

  if (!client_id || !framework_id) {
    return NextResponse.json({ error: 'client_id and framework_id are required' }, { status: 400 });
  }

  const db = adminClient();

  // Upsert: if already assigned, update status to active
  const { data, error } = await (db as any)
    .from('client_compliances')
    .upsert(
      {
        client_id,
        framework_id,
        assigned_by: actor.userId,
        status: 'active',
        entity_type: entity_type || null,
        registration_no: registration_no || null,
        notes: notes || null,
      },
      { onConflict: 'client_id,framework_id' }
    )
    .select(`
      *,
      compliance_frameworks (
        id, name, short_name,
        compliance_countries ( id, name, iso2, flag_emoji ),
        compliance_types ( id, name, code )
      )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-generate upcoming deadline tasks for this assignment
  await generateTasksForAssignment(db, data.id, client_id, framework_id);

  return NextResponse.json({ assignment: data }, { status: 201 });
}

/** DELETE /api/admin/compliance-knowledge/assign?id=...
 *  Suspends (soft-removes) a client compliance assignment.
 */
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = adminClient();
  const { error } = await (db as any)
    .from('client_compliances')
    .update({ status: 'suspended' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** Auto-generate tasks for upcoming deadlines when a framework is assigned */
async function generateTasksForAssignment(
  db: ReturnType<typeof adminClient>,
  complianceId: string,
  clientId: string,
  frameworkId: string
) {
  try {
    // Get all active deadlines for this framework in the future
    const today = new Date().toISOString().split('T')[0];
    const { data: deadlines } = await (db as any)
      .from('compliance_deadlines')
      .select('id, title, filing_type, due_date, description')
      .eq('framework_id', frameworkId)
      .eq('is_active', true)
      .gte('due_date', today)
      .order('due_date', { ascending: true });

    if (!deadlines?.length) return;

    const tasks = deadlines.map((d: { id: string; title: string; filing_type: string; due_date: string; description?: string }) => ({
      client_id: clientId,
      compliance_id: complianceId,
      deadline_id: d.id,
      title: d.title,
      description: d.description || null,
      task_type: d.filing_type === 'renewal' ? 'renewal' : 'filing',
      due_date: d.due_date,
      priority: 'normal',
      status: 'pending',
      is_auto_generated: true,
    }));

    // Check which deadlines already have tasks for this client
    const deadlineIds = tasks.map((t: { deadline_id: string }) => t.deadline_id);
    const { data: existing } = await (db as any)
      .from('client_compliance_tasks')
      .select('deadline_id')
      .eq('client_id', clientId)
      .in('deadline_id', deadlineIds);

    const existingIds = new Set((existing ?? []).map((e: { deadline_id: string }) => e.deadline_id));
    const newTasks = tasks.filter((t: { deadline_id: string }) => !existingIds.has(t.deadline_id));

    if (newTasks.length > 0) {
      await (db as any).from('client_compliance_tasks').insert(newTasks);
    }
  } catch {
    // Non-critical: task generation failure should not block assignment
  }
}
