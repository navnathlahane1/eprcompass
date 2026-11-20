import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { upsertLead } from '@/lib/airtable';

export const runtime = 'nodejs';

const PROGRAM_PLANS: Record<string, { planId: string; amountInr: number; gstPercent: number }> = {
  'Women Empowerment — Environmental Consultant Program': {
    planId: 'women-empowerment', amountInr: 4234, gstPercent: 18,
  },
  'Student — Environmental Consultant Program': {
    planId: 'students', amountInr: 4234, gstPercent: 18,
  },
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: 'Razorpay credentials not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { programTitle, programId, participantName, participantEmail, participantPhone } = body as {
      programTitle: string;
      programId?: string;
      participantName: string;
      participantEmail: string;
      participantPhone?: string;
    };

    if (!programTitle || !participantName || !participantEmail) {
      return NextResponse.json({ success: false, message: 'programTitle, participantName and participantEmail are required' }, { status: 400 });
    }

    const programPlan = PROGRAM_PLANS[programTitle];
    const planId = programId || programPlan?.planId || 'program';
    const subtotalInr = programPlan?.amountInr ?? 4234;
    const gstPercent  = programPlan?.gstPercent ?? 18;
    const gstAmount   = Math.round(subtotalInr * gstPercent / 100);
    const totalInr    = subtotalInr + gstAmount;

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount:   totalInr * 100,
      currency: 'INR',
      receipt:  `prog_${planId}_${Date.now()}`,
      notes: {
        plan:          programTitle,
        planId,
        customerName:  participantName,
        customerEmail: participantEmail,
        customerPhone: participantPhone || '',
      },
    });

    const db = getServiceClient();
    const { error: persistError } = await db.from('payments').insert({
      source_page:       planId,
      plan_id:           planId,
      plan_name:         programTitle,
      amount_inr:        totalInr,
      customer_name:     participantName,
      customer_email:    participantEmail,
      customer_phone:    participantPhone ?? null,
      razorpay_order_id: order.id,
      status:            'created',
    });
    if (persistError) throw persistError;

    // Sync to Airtable (fire-and-forget)
    upsertLead({
      name:       participantName,
      phone:      participantPhone,
      email:      participantEmail,
      sourcePage: planId,
      planName:   programTitle,
    }, { paymentStatus: 'Pending', razorpayOrderId: order.id }).catch(e =>
      console.error('[airtable] program-order sync failed:', e)
    );

    return NextResponse.json({
      success:  true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId,
      pricing: {
        subtotalInr,
        gstPercent,
        gstAmountInr: gstAmount,
        totalInr,
        discountInr: 0,
      },
    });
  } catch (err) {
    console.error('[payment/program-order]', err);
    return NextResponse.json({ success: false, message: 'Failed to create payment order' }, { status: 500 });
  }
}
