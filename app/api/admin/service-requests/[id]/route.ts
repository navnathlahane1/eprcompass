import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { STATUSES, ADMIN_NEXT_STATUSES } from '@/lib/serviceRequests/constants';
import type { ServiceRequestStatus } from '@/lib/serviceRequests/constants';

/** GET /api/admin/service-requests/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();

  const { data: request, error } = await (db as any)
    .from('service_requests')
    .select(`
      id, client_id, profile_id, category, subject, description,
      priority, status, rejection_reason,
      approved_at, rejected_at, completed_at, created_at, updated_at,
      clients (
        id,
        profiles!clients_profile_id_fkey ( id, full_name, company_name, phone )
      ),
      profiles!service_requests_assigned_to_fkey ( id, full_name ),
      service_request_quotes (
        id, service_fee, govt_fee, tax_amount, total_amount,
        notes, estimated_timeline, quote_status, sent_at, approved_at, rejected_at, created_by
      ),
      service_request_messages (
        id, content, is_internal, created_at,
        profiles!service_request_messages_author_id_fkey ( id, full_name, role )
      ),
      service_request_attachments (
        id, file_name, file_url, file_size, mime_type, created_at
      ),
      service_request_status_logs (
        id, from_status, to_status, note, created_at,
        profiles!service_request_status_logs_changed_by_fkey ( full_name )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  request.service_request_messages?.sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  request.service_request_status_logs?.sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return NextResponse.json({ request });
}

/** PATCH /api/admin/service-requests/[id] — update status, assign */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, assigned_to, note } = body as {
    status?: string;
    assigned_to?: string;
    note?: string;
  };

  const db = adminClient();

  const { data: current } = await (db as any)
    .from('service_requests')
    .select('id, status, profile_id')
    .eq('id', id)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, unknown> = {};
  let statusChanged = false;

  if (status && status !== current.status) {
    if (!STATUSES.includes(status as ServiceRequestStatus))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const allowed = ADMIN_NEXT_STATUSES[current.status as ServiceRequestStatus] ?? [];
    if (!allowed.includes(status as ServiceRequestStatus))
      return NextResponse.json(
        { error: `Cannot transition from "${current.status}" to "${status}"` },
        { status: 409 }
      );

    updates.status = status;
    statusChanged = true;

    const now = new Date().toISOString();
    if (status === 'Completed') updates.completed_at = now;
    if (status === 'Closed')    updates.closed_at = now;
  }

  if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const { error: updateErr } = await (db as any)
    .from('service_requests').update(updates).eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (statusChanged) {
    await (db as any).from('service_request_status_logs').insert({
      request_id:  id,
      changed_by:  actor.userId,
      from_status: current.status,
      to_status:   status,
      note:        note || null,
    });

    // Notify client
    try {
      await (db as any).from('notifications').insert({
        profile_id: current.profile_id,
        type:       'system',
        message:    `Your service request status updated to: ${status}`,
        read:       false,
        metadata:   { request_id: id, action: 'status_updated', new_status: status },
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ok: true, status: updates.status ?? current.status });
}
