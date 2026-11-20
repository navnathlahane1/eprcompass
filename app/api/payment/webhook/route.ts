import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isCapturedPayment, recordCapture, validSignature } from '@/lib/payments/capture';

export const runtime = 'nodejs';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set');
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';

    if (!validSignature(rawBody, signature, webhookSecret)) {
      console.warn('[webhook] signature mismatch');
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event?.event !== 'payment.captured') {
      return NextResponse.json({ success: true, message: 'ignored' });
    }

    const payment = event?.payload?.payment?.entity;
    if (!isCapturedPayment(payment)) {
      return NextResponse.json({ success: false, message: 'No payment entity' }, { status: 400 });
    }

    const db = getServiceClient();
    const eventId = req.headers.get('x-razorpay-event-id') || `capture:${payment.id}`;
    await recordCapture(db, eventId, payment);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[webhook]', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
