import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, message: 'Razorpay credentials not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Missing payment fields' }, { status: 400 });
    }

    // Verify HMAC signature
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Payment signature verification failed' }, { status: 400 });
    }

    const db = getServiceClient();

    // Mark payment as paid
    const { data: payment, error } = await db
      .from('academy_payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status:  'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select('id, registration_id, participant_name, participant_email, program_title, total_inr')
      .single();

    if (error || !payment) {
      console.error('[academy/payment/verify] DB update failed:', error);
      return NextResponse.json({ success: false, message: 'Failed to record payment' }, { status: 500 });
    }

    // Auto-confirm the linked registration if it exists
    if (payment.registration_id) {
      await db
        .from('academy_registrations')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', payment.registration_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id:               payment.id,
        participantName:  payment.participant_name,
        participantEmail: payment.participant_email,
        programTitle:     payment.program_title,
        totalInr:         payment.total_inr,
      },
    });
  } catch (err) {
    console.error('[academy/payment/verify]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
