import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** POST /api/admin/service-requests/[id]/quote — create or overwrite quote, optionally send */
export async function POST(
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

  const {
    service_fee = 0, govt_fee = 0, tax_amount = 0,
    notes, estimated_timeline, send = false,
  } = body as {
    service_fee?: number; govt_fee?: number; tax_amount?: number;
    notes?: string; estimated_timeline?: string; send?: boolean;
  };

  const total_amount =
    Number(service_fee) + Number(govt_fee) + Number(tax_amount);

  const db = adminClient();

  // Verify request exists
  const { data: request } = await (db as any)
    .from('service_requests')
    .select('id, status, profile_id')
    .eq('id', id)
    .maybeSingle();

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const validSendStates = ['Awaiting Pricing', 'Quote Sent', 'Under Review', 'Submitted'];
  if (send && !validSendStates.includes(request.status))
    return NextResponse.json({ error: `Cannot send quote when status is "${request.status}"` }, { status: 409 });

  const now = new Date().toISOString();
  const quoteStatus = send ? 'Sent' : 'Draft';

  // Upsert: delete existing + insert fresh (keeps history clean)
  await (db as any).from('service_request_quotes').delete().eq('request_id', id);

  const { data: quote, error: quoteErr } = await (db as any)
    .from('service_request_quotes')
    .insert({
      request_id:         id,
      service_fee:        Number(service_fee),
      govt_fee:           Number(govt_fee),
      tax_amount:         Number(tax_amount),
      total_amount,
      notes:              notes?.trim() || null,
      estimated_timeline: estimated_timeline?.trim() || null,
      quote_status:       quoteStatus,
      sent_at:            send ? now : null,
      created_by:         actor.userId,
    })
    .select()
    .single();

  if (quoteErr) return NextResponse.json({ error: quoteErr.message }, { status: 500 });

  if (send) {
    // Advance request status to "Quote Sent"
    await (db as any)
      .from('service_requests')
      .update({ status: 'Quote Sent' })
      .eq('id', id);

    await (db as any).from('service_request_status_logs').insert({
      request_id:  id,
      changed_by:  actor.userId,
      from_status: request.status,
      to_status:   'Quote Sent',
      note:        `Quote sent. Total: ₹${total_amount.toLocaleString('en-IN')}`,
    });

    // Notify client
    try {
      await (db as any).from('notifications').insert({
        profile_id: request.profile_id,
        type:       'system',
        message:    `A quotation has been sent for your service request`,
        read:       false,
        metadata:   { request_id: id, action: 'quote_sent', total_amount },
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ quote, status: send ? 'Quote Sent' : request.status }, { status: 201 });
}
