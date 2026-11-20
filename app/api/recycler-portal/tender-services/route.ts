/**
 * GET /api/recycler-portal/tender-services
 * Returns available plans + this recycler's current subscription status.
 *
 * POST /api/recycler-portal/tender-services
 * Recycler requests a subscription (creates a pending record for manager to activate,
 * or auto-activates trial).
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveRecyclerActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();

    const [plansRes, subRes, filingCountRes] = await Promise.all([
      (db as any)
        .from('recycler_tender_service_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),

      (db as any)
        .from('recycler_tender_subscriptions')
        .select('*')
        .eq('recycler_id', actor.recyclerId)
        .eq('status', 'active')
        .maybeSingle(),

      (db as any)
        .from('recycler_filing_requests')
        .select('id', { count: 'exact', head: true })
        .eq('recycler_id', actor.recyclerId)
        .in('status', ['pending', 'in_progress']),
    ]);

    const plans = plansRes.data ?? [];
    const activeSubscription = subRes.data ?? null;
    const pendingFilings = filingCountRes.count ?? 0;

    // Check if subscription is expired (end_date in past)
    let effectiveSubscription = activeSubscription;
    if (activeSubscription && new Date(activeSubscription.end_date) < new Date()) {
      effectiveSubscription = null;
    }

    return NextResponse.json({
      plans,
      subscription: effectiveSubscription,
      pendingFilings,
      hasActiveSubscription: !!effectiveSubscription,
      canUseFiling:
        effectiveSubscription?.plan_code === 'premium' ||
        (effectiveSubscription?.plan_code && pendingFilings === 0),
    });
  } catch (err: any) {
    console.error('[recycler-portal/tender-services] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to load service data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveRecyclerActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { plan_code, billing_cycle, interest_note } = body;

    if (!plan_code) return NextResponse.json({ error: 'plan_code is required' }, { status: 400 });

    const db = adminClient();

    // Check plan exists
    const { data: plan } = await (db as any)
      .from('recycler_tender_service_plans')
      .select('plan_code, plan_name, price_inr_monthly')
      .eq('plan_code', plan_code)
      .eq('is_active', true)
      .maybeSingle();

    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    // Check for existing active subscription
    const { data: existing } = await (db as any)
      .from('recycler_tender_subscriptions')
      .select('id, plan_code, status')
      .eq('recycler_id', actor.recyclerId)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Contact support to upgrade.' },
        { status: 409 }
      );
    }

    // Create a trial subscription (manager will activate/convert after payment)
    const startDate = new Date();
    const endDate   = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // 7-day trial

    const { data, error } = await (db as any)
      .from('recycler_tender_subscriptions')
      .insert({
        recycler_id:     actor.recyclerId,
        plan_code,
        status:          'trial',
        billing_cycle:   billing_cycle ?? 'monthly',
        start_date:      startDate.toISOString().split('T')[0],
        end_date:        endDate.toISOString().split('T')[0],
        notes:           interest_note ?? `Recycler ${actor.recyclerCode} requested ${plan_code} plan`,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      subscription: data,
      message: 'Your subscription request has been received. Our team will activate it within 24 hours.',
    }, { status: 201 });
  } catch (err: any) {
    console.error('[recycler-portal/tender-services] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
