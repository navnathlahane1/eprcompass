import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/autofill/portals?active=true */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const activeOnly = searchParams.get('active') !== 'false';

  const db = adminClient();

  if (id) {
    // Detail: single portal with detection rules, form structures summary
    const { data: portal, error } = await (db as any)
      .from('compliance_portals')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: detectionRules } = await (db as any)
      .from('portal_detection_rules')
      .select('*')
      .eq('portal_id', id)
      .order('priority');

    const { data: mappingCount } = await (db as any)
      .from('portal_field_mappings')
      .select('id', { count: 'exact', head: true })
      .eq('portal_id', id)
      .eq('is_active', true);

    const { data: formSteps } = await (db as any)
      .from('portal_form_structures')
      .select('id, filing_type, step_number, step_name, estimated_time_secs')
      .eq('portal_id', id)
      .eq('is_active', true)
      .order('filing_type')
      .order('step_number');

    return NextResponse.json({ portal, detectionRules, mappingCount, formSteps });
  }

  let query = (db as any)
    .from('compliance_portals')
    .select('*')
    .order('sort_order');

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ portals: data });
}

/** POST /api/admin/autofill/portals — Create portal + optional detection rules */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { detection_rules, ...portalFields } = body;

  if (!portalFields.name || !portalFields.base_url) {
    return NextResponse.json({ error: 'name and base_url are required' }, { status: 400 });
  }

  const db = adminClient();
  const { data: portal, error } = await (db as any)
    .from('compliance_portals')
    .insert(portalFields)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (detection_rules?.length) {
    await (db as any)
      .from('portal_detection_rules')
      .insert(detection_rules.map((r: Record<string, unknown>) => ({ ...r, portal_id: portal.id })));
  }

  return NextResponse.json({ portal }, { status: 201 });
}

/** PATCH /api/admin/autofill/portals — Update portal (id in body) */
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('compliance_portals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ portal: data });
}

/** DELETE /api/admin/autofill/portals?id=... — Soft deactivate */
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = adminClient();
  const { error } = await (db as any)
    .from('compliance_portals')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
