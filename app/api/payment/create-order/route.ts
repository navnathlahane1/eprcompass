import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

type Product = { name: string; subtotalInr: number; gstPercent: number };

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// ── Static catalog ────────────────────────────────────────────────────────────
// Products with env-var overrides or unique pricing that doesn't follow a pattern.

const STATIC_CATALOG: Record<string, Product> = {
  // Legacy / generic
  'epr-course': {
    name: 'EPR Compliance Master Program',
    subtotalInr: toPositiveInt(process.env.EPR_COURSE_SUBTOTAL_INR, 9999),
    gstPercent: toPositiveInt(process.env.EPR_COURSE_GST_PERCENT, 18),
  },
  'epr-webinar-paid': {
    name: 'EPR Premium Live Webinar',
    subtotalInr: toPositiveInt(process.env.EPR_WEBINAR_SUBTOTAL_INR, 499),
    gstPercent: toPositiveInt(process.env.EPR_WEBINAR_GST_PERCENT, 18),
  },
  // CEPC agency pages — displayed price is already all-inclusive (0% GST added)
  'cepc-associate': {
    name: 'CEPC Associate Certification',
    subtotalInr: toPositiveInt(process.env.CEPC_ASSOCIATE_SUBTOTAL_INR, 15000),
    gstPercent: 0,
  },
  'cepc-professional': {
    name: 'CEPC Professional Certification',
    subtotalInr: toPositiveInt(process.env.CEPC_PROFESSIONAL_SUBTOTAL_INR, 35000),
    gstPercent: 0,
  },
  'cepc-expert': {
    name: 'CEPC Expert Certification',
    subtotalInr: toPositiveInt(process.env.CEPC_EXPERT_SUBTOTAL_INR, 60000),
    gstPercent: 0,
  },
  // Freelancer network
  'freelancer-network': {
    name: 'EPR Freelancer Network — Onboarding Fee',
    subtotalInr: toPositiveInt(process.env.FREELANCER_NETWORK_FEE_INR, 999),
    gstPercent: 0,
  },
};

// ── Career programmes ─────────────────────────────────────────────────────────
// Each has a unique price; product ID = "career-{programme-id}"

const CAREER_PRICES: Record<string, { name: string; price: number }> = {
  'career-ehs-to-epr':                { name: 'EHS to EPR Career Transition Programme',    price: 9999  },
  'career-start-epr-career':          { name: 'Start Your EPR Career Programme',            price: 7999  },
  'career-epr-consultant-accelerator':{ name: 'EPR Consultant Accelerator Programme',       price: 12999 },
  'career-corporate-epr-manager':     { name: 'Corporate EPR Manager Programme',            price: 5999  },
  'career-epr-agency-launch':         { name: 'EPR Agency Launch Programme',                price: 24999 },
  'career-legal-cs-epr':              { name: 'Legal & CS EPR Specialisation Programme',    price: 6999  },
};

// ── Pattern-based lookup ──────────────────────────────────────────────────────
// EPR compliance courses: "{category}-epr-certification" (₹2,999) / "{category}-epr-consulting" (₹15,000)
// Recycler courses:       "{category}-certification" (₹4,999)     / "{category}-mastery" (₹14,999)
// All training courses carry 18% GST on top of the displayed base price.

const VALID_CATEGORIES = new Set([
  'plastic', 'ewaste', 'battery', 'tyre', 'elv', 'usedoil', 'cdwaste', 'nonferrous',
]);

function resolveProduct(productId: string): Product | null {
  // 1. Static catalog
  if (productId in STATIC_CATALOG) return STATIC_CATALOG[productId];

  // 2. Career programmes
  if (productId in CAREER_PRICES) {
    const c = CAREER_PRICES[productId];
    return { name: c.name, subtotalInr: c.price, gstPercent: 18 };
  }

  // 3. EPR compliance courses  (plastic-epr-certification / plastic-epr-consulting)
  if (productId.endsWith('-epr-certification')) {
    const cat = productId.slice(0, -'-epr-certification'.length);
    if (VALID_CATEGORIES.has(cat))
      return { name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} EPR — Certification Course`, subtotalInr: 2999, gstPercent: 18 };
  }
  if (productId.endsWith('-epr-consulting')) {
    const cat = productId.slice(0, -'-epr-consulting'.length);
    if (VALID_CATEGORIES.has(cat))
      return { name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} EPR — Mastery Course`, subtotalInr: 15000, gstPercent: 18 };
  }

  // 4. Recycler courses  (plastic-certification / plastic-mastery)
  if (productId.endsWith('-certification')) {
    const cat = productId.slice(0, -'-certification'.length);
    if (VALID_CATEGORIES.has(cat))
      return { name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Recycler — Certification Course`, subtotalInr: 4999, gstPercent: 18 };
  }
  if (productId.endsWith('-mastery')) {
    const cat = productId.slice(0, -'-mastery'.length);
    if (VALID_CATEGORIES.has(cat))
      return { name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Recycler — Mastery Course`, subtotalInr: 14999, gstPercent: 18 };
  }

  return null;
}

const ADDONS_CATALOG: Record<string, { name: string; priceInr: number }> = {
  'consultation-1on1': { name: '1:1 Expert Consultation (30 min)', priceInr: 2999 },
  'workshop-bundle': { name: 'Live Workshop Access (3 sessions)', priceInr: 1999 },
  'priority-support': { name: 'Priority Email Support (90 days)', priceInr: 999 },
};

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, message: 'Razorpay credentials are missing on server' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const productId: string = body?.product || 'epr-course';
    const product = resolveProduct(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Invalid product' },
        { status: 400 }
      );
    }

    const subtotalInr = product.subtotalInr;
    const gstPercent = product.gstPercent;
    const gstAmountInr = Math.round((subtotalInr * gstPercent) / 100);

    const selectedAddons: Array<{ id: string; name: string; priceInr: number }> = [];
    let addonsTotal = 0;
    if (Array.isArray(body?.addons)) {
      for (const addonId of body.addons as string[]) {
        const addon = ADDONS_CATALOG[addonId];
        if (addon) {
          selectedAddons.push({ id: addonId, ...addon });
          addonsTotal += addon.priceInr;
        }
      }
    }
    const addonsGst = Math.round((addonsTotal * gstPercent) / 100);
    const totalInr = subtotalInr + gstAmountInr + addonsTotal + addonsGst;

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: totalInr * 100,
      currency: 'INR',
      receipt: `${productId}_${Date.now()}`,
      notes: {
        product: product.name,
        productId,
        couponCode: body?.couponCode || 'none',
        addons: selectedAddons.map((a) => a.id).join(',') || 'none',
      },
    });

    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: persistError } = await db.from('payments').insert({
      source_page: productId, plan_id: productId, plan_name: product.name,
      amount_inr: totalInr, amount_paise: totalInr * 100, currency: 'INR',
      customer_name: typeof body.name === 'string' ? body.name : '',
      customer_email: typeof body.email === 'string' ? body.email : '',
      razorpay_order_id: order.id, status: 'created',
    });
    if (persistError) throw persistError;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      pricing: { subtotalInr, gstPercent, gstAmountInr, addonsTotal, addonsGst, totalInr },
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initialize payment order' },
      { status: 500 }
    );
  }
}
