import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { workspaceAdmin, workspaceOwner } from '@/lib/saas/server';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  const body = await req.json().catch(() => null);
  if (typeof body?.workspaceId !== 'string') return NextResponse.json({ error: 'Workspace required' }, { status: 400 });
  if (!await workspaceOwner(body.workspaceId)) return NextResponse.json({ error: 'Workspace owner access required' }, { status: 403 });
  try {
    const db = workspaceAdmin();
    const { data: subscription, error } = await db.from('workspace_subscriptions').select('status,provider_subscription_id,cancel_at_period_end').eq('workspace_id', body.workspaceId).maybeSingle();
    if (error) throw error;
    if (!subscription?.provider_subscription_id || subscription.status !== 'active') return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 409 });
    if (!subscription.cancel_at_period_end) {
      const provider = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
      await provider.subscriptions.cancel(subscription.provider_subscription_id, true);
      const { error: updateError } = await db.from('workspace_subscriptions').update({ cancel_at_period_end: true }).eq('workspace_id', body.workspaceId);
      if (updateError) throw updateError;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[workspace/cancel]', error);
    return NextResponse.json({ error: 'Unable to confirm cancellation. Please retry or contact support.' }, { status: 503 });
  }
}
