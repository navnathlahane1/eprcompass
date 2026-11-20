/**
 * @openapi
 * /api/admin/clients/{clientId}/features:
 *   get:   { summary: Get all feature flags for a client, tags: [Admin] }
 *   patch: { summary: Toggle a feature flag for a client (super-admin), tags: [Admin] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('client_feature_flags')
    .select('feature, enabled, updated_at, updated_by')
    .eq('client_id', clientId)
    .order('feature');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ flags: data ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isSuperAdminUser && !actor.isAdmin) {
    return NextResponse.json({ error: 'Super-admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.feature?.trim()) return NextResponse.json({ error: 'feature required' }, { status: 400 });
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });
  }

  const db = adminClient();
  const { error } = await (db as any)
    .from('client_feature_flags')
    .upsert({
      client_id: clientId,
      feature: String(body.feature).trim(),
      enabled: body.enabled,
      updated_by: actor.userId,
    }, { onConflict: 'client_id,feature' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, feature: body.feature, enabled: body.enabled });
}
