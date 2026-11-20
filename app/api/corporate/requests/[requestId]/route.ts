/**
 * GET   /api/corporate/requests/[requestId]         — request detail + responses + thread
 * PATCH /api/corporate/requests/[requestId]/accept  — accept a recycler response
 * PATCH /api/corporate/requests/[requestId]/decline — decline all responses
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';

async function resolveOwner(requestId: string) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();
  const { data: req } = await (db as any)
    .from('corporate_requests')
    .select('id, corporate_id, status, max_rounds')
    .eq('id', requestId)
    .maybeSingle();

  if (!req || req.corporate_id !== user.id) return null;
  return { userId: user.id, request: req };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [requestRes, responsesRes, messagesRes] = await Promise.all([
    (db as any)
      .from('corporate_requests')
      .select('*')
      .eq('id', requestId)
      .eq('corporate_id', user.id)
      .maybeSingle(),
    (db as any)
      .from('request_responses')
      .select('*, recyclers(name, recycler_code, verification_status)')
      .eq('request_id', requestId)
      .order('responded_at', { ascending: false }),
    (db as any)
      .from('negotiation_messages')
      .select('id, sender_type, message, sent_at, attachments')
      .eq('request_id', requestId)
      .order('sent_at', { ascending: true }),
  ]);

  if (!requestRes.data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  return NextResponse.json({
    request: requestRes.data,
    responses: responsesRes.data ?? [],
    messages: messagesRes.data ?? [],
  });
}

// POST to send a negotiation message from corporate side
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const owner = await resolveOwner(requestId);
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.message) return NextResponse.json({ error: 'message is required' }, { status: 400 });
  if (!body.recyclerId) return NextResponse.json({ error: 'recyclerId is required' }, { status: 400 });

  const db = adminClient();

  const { data: msg, error } = await (db as any)
    .from('negotiation_messages')
    .insert({
      request_id: requestId,
      recycler_id: body.recyclerId,
      sender_id: owner.userId,
      sender_type: 'CORPORATE',
      message: body.message,
      attachments: body.attachments ?? [],
    })
    .select('id, sent_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify recycler
  try {
    const { data: recycler } = await (db as any)
      .from('recyclers')
      .select('user_id')
      .eq('id', body.recyclerId)
      .maybeSingle();

    if (recycler?.user_id) {
      await (db as any).from('epr_notification_queue').insert({
        recipient_id: recycler.user_id,
        type: 'REQUEST_RESPONDED',
        payload: { requestId, message: body.message.substring(0, 100) },
      });
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, message: msg }, { status: 201 });
}
