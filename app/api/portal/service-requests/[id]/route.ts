import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/portal/service-requests/[id] — get request detail + quote + messages */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const { data: request, error } = await (db as any)
    .from('service_requests')
    .select(`
      id, category, subject, description, priority, status,
      rejection_reason, approved_at, rejected_at, completed_at,
      created_at, updated_at,
      profiles!service_requests_assigned_to_fkey ( full_name ),
      service_request_quotes (
        id, service_fee, govt_fee, tax_amount, total_amount,
        notes, estimated_timeline, quote_status, sent_at, approved_at, rejected_at
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

  // Clients can only view their own requests
  if (actor.role === 'client' && !actor.isAdmin) {
    const { data: client } = await (db as any)
      .from('clients').select('id').eq('profile_id', actor.userId).maybeSingle();
    if (!client || request.client_id !== client.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Strip internal messages for clients
    request.service_request_messages = (request.service_request_messages || []).filter(
      (m: { is_internal: boolean }) => !m.is_internal
    );
  }

  // Sort messages and logs by created_at ascending
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

/** PATCH /api/portal/service-requests/[id] — client approves or rejects quote */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'client' && !actor.isAdmin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, comment } = body as { action: string; comment?: string };
  if (!['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  if (action === 'reject' && !comment?.trim())
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });

  const db = adminClient();

  // Verify ownership
  const { data: request } = await (db as any)
    .from('service_requests')
    .select('id, status, client_id, assigned_to')
    .eq('id', id)
    .maybeSingle();

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (actor.role === 'client') {
    const { data: client } = await (db as any)
      .from('clients').select('id').eq('profile_id', actor.userId).maybeSingle();
    if (!client || request.client_id !== client.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (request.status !== 'Quote Sent')
    return NextResponse.json({ error: 'Request is not in "Quote Sent" state' }, { status: 409 });

  const newStatus = action === 'approve' ? 'Client Approved' : 'Client Rejected';
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: newStatus,
    ...(action === 'approve' ? { approved_at: now } : { rejected_at: now, rejection_reason: comment }),
  };

  const { error: updateErr } = await (db as any)
    .from('service_requests').update(updateData).eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Update quote status
  await (db as any)
    .from('service_request_quotes')
    .update({
      quote_status: action === 'approve' ? 'Approved' : 'Rejected',
      ...(action === 'approve' ? { approved_at: now } : { rejected_at: now }),
    })
    .eq('request_id', id)
    .eq('quote_status', 'Sent');

  // Status log
  await (db as any).from('service_request_status_logs').insert({
    request_id:  id,
    changed_by:  actor.userId,
    from_status: 'Quote Sent',
    to_status:   newStatus,
    note:        comment || (action === 'approve' ? 'Client approved the quote' : undefined),
  });

  // Add client comment if provided
  if (comment?.trim()) {
    await (db as any).from('service_request_messages').insert({
      request_id:  id,
      author_id:   actor.userId,
      content:     comment.trim(),
      is_internal: false,
    });
  }

  // Notify assigned admin (or all admins if unassigned)
  try {
    const targetIds: string[] = [];
    if (request.assigned_to) {
      targetIds.push(request.assigned_to);
    } else {
      const { data: admins } = await (db as any)
        .from('profiles').select('id').in('role', ['admin', 'manager']);
      admins?.forEach((a: { id: string }) => targetIds.push(a.id));
    }
    if (targetIds.length) {
      await (db as any).from('notifications').insert(
        targetIds.map((pid) => ({
          profile_id: pid,
          type:       'system',
          message:    `Service request ${action === 'approve' ? 'approved' : 'rejected'} by client`,
          read:       false,
          metadata:   { request_id: id, action: `client_${action}d` },
        }))
      );
    }
  } catch { /* non-fatal */ }

  // ── Client approved quote → create finance invoice task ──────────────────
  if (action === 'approve') {
    try {
      // Find a finance executive to assign
      const { data: finExec } = await db
        .from('profiles')
        .select('id')
        .eq('role', 'finance_executive')
        .eq('is_banned', false)
        .limit(1)
        .maybeSingle();

      // Fetch quote amount for task description
      const { data: quote } = await (db as any)
        .from('service_request_quotes')
        .select('total_amount')
        .eq('request_id', id)
        .eq('quote_status', 'Approved')
        .maybeSingle();

      const amountStr = quote?.total_amount
        ? ` (₹${Number(quote.total_amount).toLocaleString('en-IN')})`
        : '';

      await (db as any).from('portal_tasks').insert({
        title:               `Create & send invoice — Service request approved${amountStr}`,
        description:         `The client has approved the service request quote${amountStr}. Please create and send an invoice. Service Request ID: ${id}.`,
        task_type:           'finance_invoice_service',
        status:              'pending',
        priority:            'high',
        assigned_to:         (finExec as any)?.id ?? null,
        client_id:           request.client_id,
        related_entity_type: 'service_request',
        related_entity_id:   id,
        due_at:              new Date(Date.now() + 2 * 86400_000).toISOString(),
        tat_minutes:         2880,
        created_by:          actor.userId,
      });
    } catch { /* non-fatal — don't block the approval response */ }
  }

  return NextResponse.json({ status: newStatus });
}
