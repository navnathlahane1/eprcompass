import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function GET() {
  const db: SupabaseClient = await createServerComponentClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { data, error } = await db.rpc('list_my_workspace_accounts');
  if (error) return NextResponse.json({ error: 'Workspace accounts are temporarily unavailable' }, { status: 503 });
  const [subscriptions, entitlements, plans] = await Promise.all([
    db.from('workspace_subscriptions').select('workspace_id,plan_name,status,current_period_end,cancel_at_period_end'),
    db.from('workspace_entitlements').select('workspace_id,resource,limit_value,used_value,usage_period_start'),
    db.from('saas_plans').select('code,name,monthly_paise,annual_paise,currency,limits,monthly_provider_plan_id,annual_provider_plan_id').order('sort_order'),
  ]);
  if (subscriptions.error || entitlements.error || plans.error) return NextResponse.json({ error: 'Billing data is temporarily unavailable' }, { status: 503 });
  const month = new Date().toISOString().slice(0,7) + '-01';
  return NextResponse.json({ workspaces: data, subscriptions: subscriptions.data, entitlements: entitlements.data.map(e => ({
    ...e, used_value: ['ai_requests','exports'].includes(e.resource) && e.usage_period_start < month ? 0 : e.used_value,
  })),
    plans: plans.data.map(({ monthly_provider_plan_id, annual_provider_plan_id, ...plan }) => ({
      ...plan, monthly_available: !!monthly_provider_plan_id, annual_available: !!annual_provider_plan_id,
    })),
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function PATCH(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  const db: SupabaseClient = await createServerComponentClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)
    || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 160
    || typeof body.billing_email !== 'string' || body.billing_email.length > 254
    || (body.billing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.billing_email))) {
    return NextResponse.json({ error: 'Enter a workspace name and valid billing email' }, { status: 400 });
  }
  const { data, error } = await db.from('workspace_accounts').update({
    name: body.name.trim(), billing_email: body.billing_email.trim() || null,
  }).eq('id', body.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to update workspace' }, { status: 403 });
  if (!data) return NextResponse.json({ error: 'Workspace owner access required' }, { status: 403 });
  return NextResponse.json({ success: true });
}
