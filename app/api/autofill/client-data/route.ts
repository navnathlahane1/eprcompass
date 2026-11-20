import { NextRequest, NextResponse } from 'next/server';
import { resolveExtensionActor, requireScope } from '@/lib/autofill/extensionAuth';
import { adminClient } from '@/lib/recyclerNetwork/networkAuth';

/**
 * GET /api/autofill/client-data?field_keys=GLOBAL_GST_NUMBER,GLOBAL_PAN
 * Returns current values for the specified fields for the token's client.
 * Auth: Bearer <extension_token> with scope read_profile
 */
export async function GET(req: NextRequest) {
  const actor = await resolveExtensionActor(req.headers.get('authorization'));
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.clientId) return NextResponse.json({ error: 'Token not scoped to a client' }, { status: 403 });
  if (!requireScope(actor, 'read_profile')) return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const fieldKeysParam = searchParams.get('field_keys') || '';
  const fieldKeys = fieldKeysParam ? fieldKeysParam.split(',').map(k => k.trim()).filter(Boolean) : [];

  const db = adminClient();

  let fieldsQuery = (db as any)
    .from('global_field_definitions')
    .select('id, field_key, display_name, data_type, is_sensitive')
    .eq('is_active', true);

  if (fieldKeys.length) fieldsQuery = fieldsQuery.in('field_key', fieldKeys);

  const { data: fieldDefs, error: fErr } = await fieldsQuery;
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  const fieldIds = (fieldDefs || []).map((f: { id: string }) => f.id);

  const { data: clientData } = await (db as any)
    .from('client_global_data')
    .select('field_id, value_text, value_number, value_date, value_boolean, value_json, file_url, file_name, is_verified, source')
    .eq('client_id', actor.clientId)
    .in('field_id', fieldIds);

  const dataByFieldId: Record<string, Record<string, unknown>> = {};
  for (const row of (clientData || [])) {
    dataByFieldId[row.field_id] = row;
  }

  const result = (fieldDefs || []).map((fd: Record<string, unknown>) => {
    const row = dataByFieldId[fd.id as string];
    return {
      field_key: fd.field_key,
      display_name: fd.display_name,
      data_type: fd.data_type,
      is_sensitive: fd.is_sensitive, // client-side can decide not to cache sensitive fields
      value: row ? (
        fd.is_sensitive ? '[encrypted]' : (
          row.value_text ?? row.value_number ?? row.value_date ?? row.value_boolean ?? row.value_json ?? row.file_url ?? null
        )
      ) : null,
      is_verified: row?.is_verified ?? false,
      source: row?.source ?? null,
    };
  });

  return NextResponse.json({ fields: result });
}

/**
 * PUT /api/autofill/client-data
 * Chrome Extension saves a field value it observed/confirmed on a portal.
 * Body: { field_key, value, source? }
 * Auth: Bearer <extension_token> with scope autofill
 */
export async function PUT(req: NextRequest) {
  const actor = await resolveExtensionActor(req.headers.get('authorization'));
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.clientId) return NextResponse.json({ error: 'Token not scoped to a client' }, { status: 403 });
  if (!requireScope(actor, 'autofill')) return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 });

  const body = await req.json();
  const { field_key, value, source = 'api' } = body;

  if (!field_key || value === undefined || value === null) {
    return NextResponse.json({ error: 'field_key and value are required' }, { status: 400 });
  }

  const db = adminClient();

  const { data: fieldDef } = await (db as any)
    .from('global_field_definitions')
    .select('id, data_type, is_sensitive')
    .eq('field_key', field_key)
    .eq('is_active', true)
    .single();

  if (!fieldDef) return NextResponse.json({ error: 'Unknown field_key' }, { status: 404 });

  // Build typed value columns
  const valuePayload: Record<string, unknown> = { value_text: null, value_number: null, value_date: null, value_boolean: null, value_json: null };
  const dt: string = fieldDef.data_type;
  if (dt === 'number') {
    valuePayload.value_number = parseFloat(String(value));
  } else if (dt === 'date') {
    valuePayload.value_date = String(value);
  } else if (dt === 'boolean') {
    valuePayload.value_boolean = Boolean(value);
  } else if (dt === 'json' || dt === 'multiselect') {
    valuePayload.value_json = typeof value === 'string' ? JSON.parse(value) : value;
  } else {
    valuePayload.value_text = String(value);
  }

  const { data, error } = await (db as any)
    .from('client_global_data')
    .upsert({
      client_id: actor.clientId,
      field_id: fieldDef.id,
      ...valuePayload,
      source,
      created_by: actor.profileId,
    }, { onConflict: 'client_id,field_id' })
    .select('id, field_id, source, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true, record: data });
}
