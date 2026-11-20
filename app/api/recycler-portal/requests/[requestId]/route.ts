/**
 * GET  /api/recycler-portal/requests/[requestId]  — request detail + thread
 * POST /api/recycler-portal/requests/[requestId]  — respond / counter-offer
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { canStartNewRound, isRequestExpired } from '@/lib/recyclerPortal/alertRequestService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [requestRes, messagesRes, responsesRes] = await Promise.all([
    (db as any).from('corporate_requests').select('*').eq('id', requestId).maybeSingle(),
    (db as any)
      .from('negotiation_messages')
      .select('id, sender_type, message, sent_at, attachments')
      .eq('request_id', requestId)
      .eq('recycler_id', actor.recyclerId)
      .order('sent_at', { ascending: true }),
    (db as any)
      .from('request_responses')
      .select('*')
      .eq('request_id', requestId)
      .eq('recycler_id', actor.recyclerId)
      .order('round_number', { ascending: true }),
  ]);

  if (!requestRes.data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  // Mark as VIEWED if it was SENT
  if (requestRes.data.status === 'SENT') {
    await (db as any)
      .from('corporate_requests')
      .update({ status: 'VIEWED', updated_at: new Date().toISOString() })
      .eq('id', requestId);
  }

  return NextResponse.json({
    request: requestRes.data,
    messages: messagesRes.data ?? [],
    responses: responsesRes.data ?? [],
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const { data: request } = await (db as any)
    .from('corporate_requests')
    .select('id, status, expires_at, max_rounds, corporate_id')
    .eq('id', requestId)
    .maybeSingle();

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  if (isRequestExpired(request.expires_at)) {
    return NextResponse.json({ error: 'This request has expired.' }, { status: 422 });
  }

  // Count existing rounds for this recycler
  const { data: existingRounds } = await (db as any)
    .from('request_responses')
    .select('round_number')
    .eq('request_id', requestId)
    .eq('recycler_id', actor.recyclerId)
    .order('round_number', { ascending: false })
    .limit(1);

  const currentRound = existingRounds?.[0]?.round_number ?? 0;
  const roundCheck = canStartNewRound(currentRound, request.max_rounds, request.status === 'SENT' ? 'RESPONDED' : request.status);

  // Allow initial response if status is SENT or VIEWED
  const isInitialResponse = ['SENT', 'VIEWED'].includes(request.status);
  if (!isInitialResponse && !roundCheck.allowed) {
    return NextResponse.json({ error: roundCheck.reason }, { status: 422 });
  }

  const body = await req.json().catch(() => ({}));
  const nextRound = currentRound + 1;

  const { data: response, error: respErr } = await (db as any)
    .from('request_responses')
    .insert({
      request_id: requestId,
      recycler_id: actor.recyclerId,
      can_fulfill: body.canFulfill ?? true,
      offered_qty: body.offeredQty,
      offered_unit: body.offeredUnit ?? 'MT',
      proposed_rate: body.proposedRate,
      currency: body.currency ?? 'INR',
      proposed_start_date: body.proposedStartDate,
      proposed_end_date: body.proposedEndDate,
      coverage_states: body.coverageStates ?? [],
      message: body.message,
      counter_offer: body.counterOffer ?? false,
      round_number: nextRound,
      decline_reason: body.declineReason,
    })
    .select('id, round_number, status, responded_at')
    .single();

  if (respErr) return NextResponse.json({ error: respErr.message }, { status: 500 });

  // Add negotiation message if provided
  if (body.message) {
    await (db as any).from('negotiation_messages').insert({
      request_id: requestId,
      recycler_id: actor.recyclerId,
      sender_id: actor.userId,
      sender_type: 'RECYCLER',
      message: body.message,
      attachments: body.attachments ?? [],
    });
  }

  // Update request status
  const newStatus = body.canFulfill === false ? 'DECLINED' : (body.counterOffer ? 'NEGOTIATING' : 'RESPONDED');
  await (db as any)
    .from('corporate_requests')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  // Notify corporate
  try {
    await (db as any).from('epr_notification_queue').insert({
      recipient_id: request.corporate_id,
      type: body.counterOffer ? 'REQUEST_COUNTER_OFFERED' : 'REQUEST_RESPONDED',
      payload: {
        requestId,
        requestNumber: request.request_number,
        recyclerName: actor.name,
        round: nextRound,
      },
    });
  } catch { /* notification failure is non-fatal */ }

  return NextResponse.json({ ok: true, response }, { status: 201 });
}
