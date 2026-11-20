import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { upsertLead } from '@/lib/airtable';

export const runtime = 'nodejs';

const PLANS: Record<string, { name: string; amountInr: number }> = {
  'cepc-associate':     { name: 'CEPC Associate Certification',                         amountInr: 15000 },
  'cepc-professional':  { name: 'CEPC Professional Certification',                      amountInr: 35000 },
  'cepc-expert':        { name: 'CEPC Expert Certification',                            amountInr: 60000 },
  'women-empowerment':  { name: 'Women Empowerment — Environmental Consultant Program', amountInr: 4999  },
  'students':           { name: 'Student — Environmental Consultant Program',           amountInr: 4999  },
  'freelancer-network': { name: 'EPR Freelancer Network — Onboarding Fee',              amountInr: 999   },
  // CEPC professional pages — all sell the same 3 tiers, but track source
  'cepc-for-ca-firms':                 { name: 'CEPC Certification (CA Firms)',               amountInr: 15000 },
  'cepc-for-company-secretaries':      { name: 'CEPC Certification (Company Secretaries)',    amountInr: 15000 },
  'cepc-for-corporate-lawyers':        { name: 'CEPC Certification (Corporate Lawyers)',      amountInr: 15000 },
  'cepc-for-environmental-lawyers':    { name: 'CEPC Certification (Environmental Lawyers)',  amountInr: 15000 },
  'cepc-for-ehs-consultants':          { name: 'CEPC Certification (EHS Consultants)',        amountInr: 15000 },
  'cepc-for-esg-consultants':          { name: 'CEPC Certification (ESG Consultants)',        amountInr: 15000 },
  'cepc-for-fmcg-consultants':         { name: 'CEPC Certification (FMCG Consultants)',       amountInr: 15000 },
  'cepc-for-hr-and-ld':                { name: 'CEPC Certification (HR & L&D)',               amountInr: 15000 },
  'cepc-for-import-consultants':       { name: 'CEPC Certification (Import Consultants)',     amountInr: 15000 },
  'cepc-for-iso-auditors':             { name: 'CEPC Certification (ISO Auditors)',           amountInr: 15000 },
  'cepc-for-pharma-consultants':       { name: 'CEPC Certification (Pharma Consultants)',     amountInr: 15000 },
  'cepc-for-supply-chain-consultants': { name: 'CEPC Certification (Supply Chain)',           amountInr: 15000 },
  'cepc-for-startup-incubators':       { name: 'CEPC Certification (Startup Incubators)',     amountInr: 15000 },
  'cepc-for-trade-associations':       { name: 'CEPC Certification (Trade Associations)',     amountInr: 15000 },
  'cepc-for-waste-management':         { name: 'CEPC Certification (Waste Management)',       amountInr: 15000 },
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
    const { planId, name, email, phone, sourcePage } = body as {
      planId: string;
      name: string;
      email: string;
      phone?: string;
      sourcePage?: string;
    };

    if (!planId || !name || !email) {
      return NextResponse.json({ success: false, message: 'planId, name and email are required' }, { status: 400 });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ success: false, message: 'Invalid plan' }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount:   plan.amountInr * 100,
      currency: 'INR',
      receipt:  `cepc_${planId}_${Date.now()}`,
      notes: {
        plan:          plan.name,
        planId,
        customerName:  name,
        customerEmail: email,
        customerPhone: phone || '',
      },
    });

    const db = getServiceClient();
    const { error: persistError } = await db.from('payments').insert({
      source_page:       sourcePage || planId,
      plan_id:           planId,
      plan_name:         plan.name,
      amount_inr:        plan.amountInr,
      customer_name:     name,
      customer_email:    email,
      customer_phone:    phone ?? null,
      razorpay_order_id: order.id,
      status:            'created',
    });
    if (persistError) throw persistError;

    // Sync to Airtable (fire-and-forget — never blocks payment flow)
    upsertLead({
      name:       name,
      phone:      phone,
      email:      email,
      sourcePage: sourcePage || planId,
      planName:   plan.name,
    }, { paymentStatus: 'Pending', razorpayOrderId: order.id }).catch(e =>
      console.error('[airtable] cepc-order sync failed:', e)
    );

    return NextResponse.json({
      success:  true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId,
      planName: plan.name,
    });
  } catch (err) {
    console.error('[payment/cepc-order]', err);
    return NextResponse.json({ success: false, message: 'Failed to create payment order' }, { status: 500 });
  }
}
