import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractPhone(payload: any) {
  return (
    payload?.data?.fullPhoneNumber ||
    payload?.fullPhoneNumber ||
    payload?.message?.from ||
    payload?.from ||
    payload?.phone ||
    null
  );
}

function extractInboundContent(payload: any) {
  return (
    payload?.data?.message ||
    payload?.message?.text ||
    payload?.text ||
    payload?.content ||
    ''
  );
}

function extractWaMessageId(payload: any) {
  return payload?.data?.id || payload?.id || payload?.messageId || payload?.wa_message_id || null;
}

function parseMessageType(payload: any): 'text' | 'template' | 'document' | 'image' {
  const raw = String(payload?.type || payload?.messageType || payload?.data?.type || 'text').toLowerCase();
  if (raw.includes('template')) return 'template';
  if (raw.includes('document')) return 'document';
  if (raw.includes('image')) return 'image';
  return 'text';
}

function extractStatus(payload: any): 'sent' | 'delivered' | 'read' | 'failed' | null {
  const raw = String(payload?.status || payload?.event || payload?.data?.status || '').toLowerCase();
  if (raw === 'delivered') return 'delivered';
  if (raw === 'read') return 'read';
  if (raw === 'failed') return 'failed';
  if (raw === 'sent') return 'sent';
  return null;
}

function extractGstin(text: string) {
  const match = text.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]/i);
  return match ? match[0].toUpperCase() : null;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET || '';
    const signature = request.headers.get('X-Hub-Signature-256');

    if (!secret || !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ ok: true });
    }

    const payload = JSON.parse(rawBody || '{}');
    const supabase = getSupabaseAdmin();

    const phone = extractPhone(payload);
    const statusUpdate = extractStatus(payload);

    if (!phone) {
      return NextResponse.json({ ok: true });
    }

    if (statusUpdate) {
      const waMessageId = extractWaMessageId(payload);
      if (waMessageId) {
        await (supabase as any)
          .from('whatsapp_messages')
          .update({ status: statusUpdate })
          .eq('wa_message_id', waMessageId);
      }

      return NextResponse.json({ ok: true });
    }

    const inboundContent = String(extractInboundContent(payload));
    const waMessageId = extractWaMessageId(payload);
    const waContactName = payload?.data?.name || payload?.name || null;

    const { data: existingConversation } = await (supabase as any)
      .from('whatsapp_conversations')
      .select('id, entity_type')
      .eq('phone_no', phone)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversationId = existingConversation?.id as string | undefined;

    if (!conversationId) {
      const { data: created } = await (supabase as any)
        .from('whatsapp_conversations')
        .insert({
          phone_no: phone,
          wa_contact_name: waContactName,
          entity_type: 'unknown',
          status: 'Open',
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();
      conversationId = created?.id;
    } else {
      await (supabase as any)
        .from('whatsapp_conversations')
        .update({
          wa_contact_name: waContactName,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }

    if (!conversationId) {
      return NextResponse.json({ ok: true });
    }

    const { error: messageInsertError } = await (supabase as any).from('whatsapp_messages').insert({
      conversation_id: conversationId,
      direction: 'inbound',
      wa_message_id: waMessageId,
      message_type: parseMessageType(payload),
      content: inboundContent,
      status: 'read',
      sent_at: new Date().toISOString()
    });
    if (messageInsertError?.code === '23505') {
      return NextResponse.json({ ok: true, replay: true });
    }
    if (messageInsertError) throw messageInsertError;

    const entityType = existingConversation?.entity_type || 'unknown';
    if (entityType === 'unknown') {
      const { data: existingCapture } = await (supabase as any)
        .from('wa_lead_captures')
        .select('id, service_interest')
        .eq('phone_no', phone)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingCapture) {
        await (supabase as any).from('wa_lead_captures').insert({
          conversation_id: conversationId,
          phone_no: phone,
          name: waContactName,
          source: 'Direct',
          service_interest: []
        });
      }
    }

    const gstin = extractGstin(inboundContent);
    if (gstin) {
      const { data: capture } = await (supabase as any)
        .from('wa_lead_captures')
        .select('id')
        .eq('phone_no', phone)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (capture?.id) {
        await (supabase as any)
          .from('wa_lead_captures')
          .update({ gstin })
          .eq('id', capture.id);
      }
    }

    const edgeFnUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-wa-message`
      : null;

    if (edgeFnUrl) {
      void fetch(edgeFnUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
          'x-idempotency-key': `wa-message:${waMessageId}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: waMessageId,
          content: inboundContent
        })
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('whatsapp webhook error', error);
    return NextResponse.json({ ok: true });
  }
}
