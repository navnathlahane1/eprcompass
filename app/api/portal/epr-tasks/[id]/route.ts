/**
 * PATCH /api/portal/epr-tasks/[id]
 *
 * Client or manager updates a task:
 *   { status, notes, evidence_url }
 *
 * Allowed statuses from client: in_progress, completed, skipped, na
 * Manager can also set: pending (reopen)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

const CLIENT_ALLOWED = ['in_progress', 'completed', 'skipped', 'na'];
const MANAGER_ALLOWED = ['pending', 'in_progress', 'completed', 'skipped', 'na'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, notes, evidence_url } = body;

  const db = makeServiceClient();

  // Fetch the task and verify access
  const { data: task } = await db
    .from('client_epr_tasks')
    .select('id, client_id, status')
    .eq('id', id)
    .maybeSingle();

  if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });

  // Check access: client user or assigned manager
  const { data: clientRow } = await db
    .from('clients')
    .select('id, profile_id, assigned_manager_id')
    .eq('id', task.client_id)
    .maybeSingle();

  const isClient  = clientRow?.profile_id === actor.userId;
  const isManager = clientRow?.assigned_manager_id === actor.userId;
  const isAdmin   = actor.isAdmin;

  if (!isClient && !isManager && !isAdmin) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  // Validate status transition
  const allowedStatuses = isAdmin ? MANAGER_ALLOWED : isManager ? MANAGER_ALLOWED : CLIENT_ALLOWED;
  if (status && !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: `Status "${status}" not allowed.` }, { status: 400 });
  }

  const update: Record<string, any> = {};
  if (status)       update.status = status;
  if (notes !== undefined) update.notes = notes;
  if (evidence_url !== undefined) update.evidence_url = evidence_url;

  if (status === 'completed') {
    update.completed_at = new Date().toISOString();
    update.completed_by = actor.userId;
  }
  if (status === 'pending' || status === 'in_progress') {
    update.completed_at = null;
    update.completed_by = null;
  }

  const { error } = await db
    .from('client_epr_tasks')
    .update(update)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: status ?? task.status });
}
