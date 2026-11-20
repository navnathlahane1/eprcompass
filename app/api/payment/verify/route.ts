import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { syncPaymentToAirtable } from '@/lib/airtable';
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
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keySecret || !keyId) {
      return NextResponse.json({ success: false, message: 'Razorpay credentials not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(v => typeof v === 'string' && v.length > 0)) {
      return NextResponse.json({ success: false, message: 'Missing payment fields' }, { status: 400 });
    }

    // Verify HMAC signature
    if (!validSignature(`${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature, keySecret)) {
      return NextResponse.json({ success: false, message: 'Payment signature verification failed' }, { status: 400 });
    }

    const db = getServiceClient();
    const now = new Date().toISOString();

    const { data: row, error: readError } = await db
      .from('payments')
      .select('id, plan_name, customer_name, customer_email, customer_phone, amount_inr')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const provider = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await provider.payments.fetch(razorpay_payment_id);
    if (!isCapturedPayment(payment) || payment.order_id !== razorpay_order_id || payment.id !== razorpay_payment_id) {
      return NextResponse.json({ success: false, message: 'Payment capture is pending or does not match the order' }, { status: 409 });
    }
    await recordCapture(db, `verify:${payment.id}`, payment);

    if (row) {
      // Sync payment completion to Airtable (fire-and-forget)
      syncPaymentToAirtable(row.customer_phone ?? undefined, row.customer_email, {
        paymentStatus:     'Paid',
        paymentAmount:     row.amount_inr,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId:   razorpay_order_id,
        paymentDate:       now,
      }).catch(e => console.error('[airtable] verify sync failed:', e));

      return NextResponse.json({
        success: true,
        payment: {
          name:      row.customer_name,
          email:     row.customer_email,
          plan:      row.plan_name,
          amountInr: row.amount_inr,
        },
      });
    }

  } catch (err) {
    console.error('[payment/verify]', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
