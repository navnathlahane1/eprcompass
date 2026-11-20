import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { workspaceAdmin, workspaceOwner } from '@/lib/saas/server';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.workspaceId !== 'string' || typeof body.planCode !== 'string'
    || !['monthly','annual'].includes(body.cycle) || typeof body.requestId !== 'string'
    || !/^[0-9a-f-]{36}$/i.test(body.requestId)) return NextResponse.json({ error: 'Invalid subscription request' }, { status: 400 });
  const owner = await workspaceOwner(body.workspaceId);
  if (!owner) return NextResponse.json({ error: 'Workspace owner access required' }, { status: 403 });
  try {
    const db = workspaceAdmin();
    const { data: plan, error: planError } = await db.from('saas_plans').select('*').eq('code', body.planCode).maybeSingle();
    if (planError) throw planError;
    const planId = body.cycle === 'annual' ? plan?.annual_provider_plan_id : plan?.monthly_provider_plan_id;
    const amount = body.cycle === 'annual' ? plan?.annual_paise : plan?.monthly_paise;
    if (!planId || !amount) return NextResponse.json({ error: 'This plan requires sales assistance' }, { status: 409 });
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Subscription checkout is not configured' }, { status: 503 });
    const provider = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const { data: subscription, error: readError } = await db.from('workspace_subscriptions').select('status,provider_subscription_id').eq('workspace_id', body.workspaceId).maybeSingle();
    if (readError) throw readError;
    if (subscription && subscription.status !== 'pending') return NextResponse.json({ error: 'Contact support to change or restart this subscription' }, { status: 409 });

    // Reject deterministic configuration errors before reserving a checkout.
    const remotePlan = await provider.plans.fetch(planId);
    if (Number(remotePlan.item.amount) !== Number(amount) || remotePlan.item.currency !== plan.currency
      || remotePlan.period !== (body.cycle === 'annual' ? 'yearly' : 'monthly') || remotePlan.interval !== 1) {
      throw new Error('Provider plan does not match the configured catalog');
    }
    const { error: reservationError } = await db.from('subscription_checkout_attempts').insert({
      workspace_id: body.workspaceId, request_id: body.requestId, plan_code: body.planCode, billing_cycle: body.cycle,
    });
    if (reservationError) {
      if (reservationError.code !== '23505') throw reservationError;
      const { data: attempt, error } = await db.from('subscription_checkout_attempts').select('*').eq('workspace_id', body.workspaceId).single();
      if (error) throw error;
      if (attempt.plan_code !== body.planCode || attempt.billing_cycle !== body.cycle || !attempt.provider_subscription_id) {
        return NextResponse.json({ error: 'A checkout is already in progress. Contact support if it does not complete.' }, { status: 409 });
      }
      return NextResponse.json({ subscriptionId: attempt.provider_subscription_id, keyId });
    }

    const created = await provider.subscriptions.create({
      plan_id: planId, total_count: body.cycle === 'annual' ? 10 : 120, quantity: 1,
      customer_notify: 0, expire_by: Math.floor(Date.now() / 1000) + 86400,
      notes: { workspace_id: body.workspaceId, checkout_request_id: body.requestId },
    });
    const { error: persistError } = await db.from('workspace_subscriptions').upsert({
      workspace_id: body.workspaceId, plan_code: plan.code, plan_name: plan.name,
      provider_subscription_id: created.id, provider_plan_id: planId,
      billing_cycle: body.cycle, status: 'pending', current_period_end: new Date().toISOString(),
    });
    if (persistError) {
      await provider.subscriptions.cancel(created.id);
      throw persistError;
    }
    const { error: attemptError } = await db.from('subscription_checkout_attempts').update({ provider_subscription_id: created.id }).eq('workspace_id', body.workspaceId);
    if (attemptError) throw attemptError;
    return NextResponse.json({ subscriptionId: created.id, keyId });
  } catch (error) {
    console.error('[workspace/subscribe]', error);
    return NextResponse.json({ error: 'Unable to start subscription checkout. No workspace access has been activated.' }, { status: 503 });
  }
}
