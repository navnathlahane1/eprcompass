import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { upsertLead } from '@/lib/airtable';

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
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: 'Razorpay credentials not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, phone, city, experience, expertise, occupation, linkedin, sourcePage } = body as {
      name: string;
      email: string;
      phone?: string;
      city?: string;
      experience?: string;
      expertise?: string;
      occupation?: string;
      linkedin?: string;
      sourcePage?: string;
    };

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'name and email are required' }, { status: 400 });
    }

    const amountInr = 999;

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount:   amountInr * 100,
      currency: 'INR',
      receipt:  `freelancer_${Date.now()}`,
      notes: {
        product:       'EPR Freelancer Network — Onboarding Fee',
        planId:        'freelancer-network',
        customerName:  name,
        customerEmail: email,
        customerPhone: phone || '',
      },
    });

    const db = getServiceClient();
    const { error: persistError } = await db.from('payments').insert({
      source_page:       sourcePage || 'freelancer-network',
      plan_id:           'freelancer-network',
      plan_name:         'EPR Freelancer Network — Onboarding Fee',
      amount_inr:        amountInr,
      customer_name:     name,
      customer_email:    email,
      customer_phone:    phone ?? null,
      razorpay_order_id: order.id,
      status:            'created',
      extra_data: {
        city:       city       ?? null,
        experience: experience ?? null,
        expertise:  expertise  ?? null,
        occupation: occupation ?? null,
        linkedin:   linkedin   ?? null,
      },
    });
    if (persistError) throw persistError;

    // Sync to Airtable (fire-and-forget)
    upsertLead({
      name:        name,
      phone:       phone,
      email:       email,
      sourcePage:  sourcePage || 'freelancer-network',
      planName:    'EPR Freelancer Network — Onboarding Fee',
      profession:  occupation,
      remarks:     [city, experience, expertise, linkedin].filter(Boolean).join(' | '),
    }, { paymentStatus: 'Pending', razorpayOrderId: order.id }).catch(e =>
      console.error('[airtable] freelancer-order sync failed:', e)
    );

    return NextResponse.json({
      success:  true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error('[payment/freelancer-order]', err);
    return NextResponse.json({ success: false, message: 'Failed to create payment order' }, { status: 500 });
  }
}
