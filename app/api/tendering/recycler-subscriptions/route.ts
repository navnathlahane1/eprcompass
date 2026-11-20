import { NextRequest, NextResponse } from 'next/server';
import { resolveTenderingUser, getServiceClient } from '@/lib/tendering/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getServiceClient();
    const { searchParams } = new URL(req.url);
    const status   = searchParams.get('status') || '';
    const search   = searchParams.get('search') || '';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset   = (page - 1) * limit;

    let q = (db as any)
      .from('recycler_tender_subscriptions')
      .select(
        `*, recycler_tender_service_plans(plan_name, price_inr_monthly),
         recyclers(name, recycler_code)`,
        { count: 'exact' }
      );

    if (status) q = q.eq('status', status);

    q = q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: rows, count } = await q;

    // If search, filter in memory by recycler name/code
    let subs = ((rows ?? []) as any[]).map((s: any) => ({
      ...s,
      recycler_name:  s.recyclers?.name ?? 'Unknown',
      recycler_code:  s.recyclers?.recycler_code ?? '',
      plan_name:      s.recycler_tender_service_plans?.plan_name ?? s.plan_code,
      price_monthly:  s.recycler_tender_service_plans?.price_inr_monthly ?? null,
    }));

    if (search) {
      const q2 = search.toLowerCase();
      subs = subs.filter((s: any) =>
        s.recycler_name.toLowerCase().includes(q2) || s.recycler_code.toLowerCase().includes(q2)
      );
    }

    return NextResponse.json({ subscriptions: subs, total: count ?? 0, page, limit });
  } catch (err: any) {
    console.error('[tendering/recycler-subscriptions] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isTenderingManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { recycler_id, plan_code, billing_cycle, amount_paid_inr, payment_ref, notes, duration_months } = body;

    if (!recycler_id) return NextResponse.json({ error: 'recycler_id is required' }, { status: 400 });
    if (!plan_code)   return NextResponse.json({ error: 'plan_code is required' }, { status: 400 });

    const db = getServiceClient();

    // Expire any existing active subscription
    await (db as any)
      .from('recycler_tender_subscriptions')
      .update({ status: 'expired' })
      .eq('recycler_id', recycler_id)
      .eq('status', 'active');

    const months = duration_months ?? (billing_cycle === 'annual' ? 12 : 1);
    const startDate = new Date();
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const { data, error } = await (db as any)
      .from('recycler_tender_subscriptions')
      .insert({
        recycler_id,
        plan_code,
        status: 'active',
        billing_cycle: billing_cycle ?? 'monthly',
        start_date: startDate.toISOString().split('T')[0],
        end_date:   endDate.toISOString().split('T')[0],
        amount_paid_inr: amount_paid_inr ?? null,
        payment_ref: payment_ref ?? null,
        activated_by: actor.id,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ subscription: data }, { status: 201 });
  } catch (err: any) {
    console.error('[tendering/recycler-subscriptions] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
