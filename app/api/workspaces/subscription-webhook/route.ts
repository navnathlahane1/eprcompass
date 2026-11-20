import { NextRequest, NextResponse } from 'next/server';
import { validSignature } from '@/lib/payments/capture';
import { workspaceAdmin } from '@/lib/saas/server';

const states: Record<string,string> = { created: 'pending', authenticated: 'pending', active: 'active', pending: 'past_due', halted: 'past_due', paused: 'past_due', cancelled: 'canceled', completed: 'expired', expired: 'expired' };
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_SUBSCRIPTION_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-razorpay-signature') ?? '', secret)) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    if (typeof event.event !== 'string' || !event.event.startsWith('subscription.')) return NextResponse.json({ ignored: true });
    const subscription = event.payload?.subscription?.entity;
    const eventId = req.headers.get('x-razorpay-event-id');
    if (!eventId || !subscription?.id || !states[subscription.status] || !Number.isFinite(event.created_at)) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    const timestamp = (value: unknown) => typeof value === 'number' && value > 0 ? new Date(value * 1000).toISOString() : null;
    const { error } = await workspaceAdmin().rpc('apply_workspace_subscription_event', {
      p_subscription_id: subscription.id, p_event_id: eventId, p_occurred_at: new Date(event.created_at * 1000).toISOString(),
      p_status: states[subscription.status], p_period_start: timestamp(subscription.current_start),
      p_period_end: timestamp(subscription.current_end), p_provider_plan_id: subscription.plan_id,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[workspace/subscription-webhook]', error);
    return NextResponse.json({ error: 'Subscription event was not committed' }, { status: 500 });
  }
}
