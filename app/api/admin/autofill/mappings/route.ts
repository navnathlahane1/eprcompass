import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/autofill/mappings?portal_id=&page_context=&field_id=&low_confidence=true */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const portalId = searchParams.get('portal_id') || '';
  const pageContext = searchParams.get('page_context') || '';
  const fieldId = searchParams.get('field_id') || '';
  const lowConfidence = searchParams.get('low_confidence') === 'true';
  const activeOnly = searchParams.get('active') !== 'false';

  const db = adminClient();
  let query = (db as any)
    .from('portal_field_mappings')
    .select(`
      *,
      compliance_portals ( id, name, short_name, base_url ),
      global_field_definitions ( id, field_key, display_name, data_type, category_id,
        global_field_categories ( id, code, name, icon )
      )
    `)
    .order('confidence_score', { ascending: false });

  if (activeOnly) query = query.eq('is_active', true);
  if (portalId) query = query.eq('portal_id', portalId);
  if (pageContext) query = query.eq('page_context', pageContext);
  if (fieldId) query = query.eq('global_field_id', fieldId);
  if (lowConfidence) query = query.lt('confidence_score', 70);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ mappings: data });
}

/** POST /api/admin/autofill/mappings — Create or bulk-import mappings
 *  Body: single mapping object OR { bulk: true, mappings: [...] }
 */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const db = adminClient();

  if (body.bulk && Array.isArray(body.mappings)) {
    const rows = body.mappings.map((m: Record<string, unknown>) => ({
      ...m,
      created_by: actor.userId,
    }));
    const { data, error } = await (db as any)
      .from('portal_field_mappings')
      .upsert(rows, { onConflict: 'portal_id,global_field_id,page_context' })
      .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ mappings: data, count: data?.length }, { status: 201 });
  }

  const {
    portal_id, global_field_id, page_context,
    selector_type, selector_value, fill_action,
    fallback_selectors, value_transform, pre_fill_script, post_fill_script,
    required_on_portal, portal_validation_hint,
    confidence_score, notes, metadata,
  } = body;

  if (!portal_id || !global_field_id || !selector_value) {
    return NextResponse.json({ error: 'portal_id, global_field_id, selector_value are required' }, { status: 400 });
  }

  const { data, error } = await (db as any)
    .from('portal_field_mappings')
    .upsert({
      portal_id, global_field_id, page_context: page_context || null,
      selector_type: selector_type || 'css',
      selector_value,
      fill_action: fill_action || 'clear_type',
      fallback_selectors: fallback_selectors || [],
      value_transform: value_transform || null,
      pre_fill_script: pre_fill_script || null,
      post_fill_script: post_fill_script || null,
      required_on_portal: !!required_on_portal,
      portal_validation_hint: portal_validation_hint || null,
      confidence_score: confidence_score ?? 80,
      notes: notes || null,
      metadata: metadata || {},
      created_by: actor.userId,
    }, { onConflict: 'portal_id,global_field_id,page_context' })
    .select(`
      *,
      global_field_definitions ( id, field_key, display_name )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mapping: data }, { status: 201 });
}

/** PATCH /api/admin/autofill/mappings — Update mapping (id in body)
 *  Also used to mark a mapping as verified.
 */
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, verify, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (verify) {
    updates.last_verified_at = new Date().toISOString();
    updates.last_verified_by = actor.userId;
    updates.confidence_score = 100;
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('portal_field_mappings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mapping: data });
}

/** DELETE /api/admin/autofill/mappings?id=... — Soft deactivate */
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = adminClient();
  const { error } = await (db as any)
    .from('portal_field_mappings')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
