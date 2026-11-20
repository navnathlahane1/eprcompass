/**
 * PATCH /api/manager/filings/[filingId]
 * Update the status of an EPR filing — only if the filing's client
 * is assigned to the current manager.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';
import { createTask } from '@/lib/tasks/createTask';

const ALLOWED_STATUSES = [
  'Received',
  'Under Review',
  'Clarification',
  'Approved',
  'Certificate Issued',
  'Rejected',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { filingId } = await params;
  const body = await req.json().catch(() => ({}));
  const newStatus: string = body.status ?? '';

  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 });
  }

  const db = getAdminClient();

  // Verify the filing belongs to one of this manager's assigned clients
  const { data: filing } = await db
    .from('epr_filing_statuses')
    .select('id, client_id, current_status')
    .eq('id', filingId)
    .maybeSingle();

  if (!filing) {
    return NextResponse.json({ error: 'Filing not found.' }, { status: 404 });
  }

  // Check the client is assigned to this manager
  const { data: client } = await db
    .from('clients')
    .select('id')
    .eq('id', filing.client_id)
    .eq('assigned_manager_id', actor.id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: 'Filing not accessible — client is not assigned to you.' }, { status: 403 });
  }

  // Update
  const { error } = await db
    .from('epr_filing_statuses')
    .update({ current_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', filingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Auto-task: create admin oversight task for terminal / important statuses ──
  // 'Certificate Issued' and 'Approved' warrant an admin verification task.
  const OVERSIGHT_STATUSES = ['Approved', 'Certificate Issued', 'Rejected'];
  if (OVERSIGHT_STATUSES.includes(newStatus)) {
    // Find admins to assign (just use null = unassigned admin-pool task)
    await createTask({
      title: `Verify filing status: ${newStatus} — ${filing.client_id}`,
      description: `Manager marked filing ${filingId} as "${newStatus}". Please verify and take any follow-up action.`,
      task_type: 'filing_status_oversight',
      assigned_to: null, // admin pool — any admin can pick it up
      client_id: client.id,
      related_entity_type: 'filing',
      related_entity_id: filingId,
      priority: newStatus === 'Certificate Issued' ? 'high' : 'normal',
      created_by: actor.id,
    });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
