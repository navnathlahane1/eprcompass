import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServiceClient } from '../../_shared';

export const runtime = 'nodejs';

// Tier pricing (INR, excl. GST)
const TIER_PRICING: Record<string, number> = {
  'Tier 1 — EPR Awareness Bootcamp': 4999,
  'Tier 2 — Certified EPR Consultant (CEPC)': 14999,
  'Tier 3 — EPR Agency Launch Program (EALP)': 29999,
  'Women Empowerment — Environmental Consultant Program': 4999,
  'Student — Environmental Consultant Program': 4999,
};
const DEFAULT_PRICE = 9999;
const GST_PERCENT = 18;

export async function POST(req: NextRequest) {
  try {
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: 'Razorpay credentials not configured' }, { status: 500 });
    }

    const body = await req.json();
    const {
      programTitle,
      programId,
      participantName,
      participantEmail,
      participantPhone,
      organization,
      promoCode,
      partnerCode,
      overridePrice, // admin override (number)
    } = body as {
      programTitle: string;
      programId?: string;
      participantName: string;
      participantEmail: string;
      participantPhone?: string;
      organization?: string;
      promoCode?: string;
      partnerCode?: string;
      overridePrice?: number;
    };

    if (!participantName || !participantEmail || !programTitle) {
      return NextResponse.json({ success: false, message: 'participantName, participantEmail and programTitle are required' }, { status: 400 });
    }

    const db = getServiceClient();

    // Resolve promo code discount
    let discountInr = 0;
    if (promoCode) {
      const { data: promo } = await db
        .from('academy_promo_codes')
        .select('discount_type, discount_value, active')
        .eq('code', promoCode.toUpperCase())
        .maybeSingle();

      if (promo?.active) {
        const basePrice = overridePrice ?? TIER_PRICING[programTitle] ?? DEFAULT_PRICE;
        discountInr = promo.discount_type === 'flat'
          ? promo.discount_value
          : Math.round((basePrice * promo.discount_value) / 100);
      }
    }

    const subtotalInr  = Math.max(0, (overridePrice ?? TIER_PRICING[programTitle] ?? DEFAULT_PRICE) - discountInr);
    const gstAmountInr = Math.round((subtotalInr * GST_PERCENT) / 100);
    const totalInr     = subtotalInr + gstAmountInr;

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: totalInr * 100, // paise
      currency: 'INR',
      receipt: `acad_${Date.now()}`,
      notes: {
        programTitle,
        participantEmail,
        partnerCode: partnerCode || '',
        promoCode: promoCode || '',
      },
    });

    // Persist order record
    const { data: payment, error } = await db
      .from('academy_payments')
      .insert({
        program_id:        programId ?? null,
        razorpay_order_id: order.id,
        participant_name:  participantName,
        participant_email: participantEmail,
        participant_phone: participantPhone ?? null,
        organization:      organization ?? null,
        program_title:     programTitle,
        subtotal_inr:      subtotalInr,
        gst_percent:       GST_PERCENT,
        gst_amount_inr:    gstAmountInr,
        total_inr:         totalInr,
        promo_code:        promoCode ?? null,
        discount_inr:      discountInr,
        partner_code:      partnerCode ?? null,
        status:            'created',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[academy/payment/create-order] DB insert failed:', error);
    }

    return NextResponse.json({
      success: true,
      orderId:   order.id,
      paymentId: payment?.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId,
      pricing: { subtotalInr, gstPercent: GST_PERCENT, gstAmountInr, totalInr, discountInr },
    });
  } catch (err) {
    console.error('[academy/payment/create-order]', err);
    return NextResponse.json({ success: false, message: 'Failed to create payment order' }, { status: 500 });
  }
}
