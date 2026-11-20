import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/portal/data-profile?category=COMPANY
 *  Returns all global fields with the client's current values.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryCode = searchParams.get('category') || '';

  const db = adminClient();

  // Resolve client_id from profile
  const { data: profile } = await (db as any)
    .from('profiles')
    .select('client_id')
    .eq('id', actor.userId)
    .maybeSingle();

  const clientId = actor.isAdmin
    ? (searchParams.get('client_id') || null)
    : profile?.client_id;

  if (!clientId) return NextResponse.json({ error: 'No client found' }, { status: 404 });

  // Load all active field categories
  const { data: categories } = await (db as any)
    .from('global_field_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  // Load field definitions
  let fieldsQuery = (db as any)
    .from('global_field_definitions')
    .select('*, global_field_categories(id,code,name,icon)')
    .eq('is_active', true)
    .order('sort_order');

  if (categoryCode) {
    const cat = (categories || []).find((c: { code: string }) => c.code === categoryCode);
    if (cat) fieldsQuery = fieldsQuery.eq('category_id', cat.id);
  }

  const { data: fieldDefs, error: fErr } = await fieldsQuery;
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  const fieldIds = (fieldDefs || []).map((f: { id: string }) => f.id);

  // Load client's data values
  const { data: clientData } = await (db as any)
    .from('client_global_data')
    .select('field_id, value_text, value_number, value_date, value_boolean, value_json, file_url, file_name, file_size_bytes, validity_expires, is_verified, source, notes, updated_at')
    .eq('client_id', clientId)
    .in('field_id', fieldIds);

  const dataByFieldId: Record<string, Record<string, unknown>> = {};
  for (const row of (clientData || [])) dataByFieldId[row.field_id] = row;

  // Load account row for direct-mapped columns
  const { data: client } = await (db as any)
    .from('clients')
    .select('account_id')
    .eq('id', clientId)
    .single();

  let accountRow: Record<string, unknown> = {};
  if (client?.account_id) {
    const { data: acct } = await (db as any)
      .from('accounts')
      .select('company_name,legal_name,gstin,pan,cin,billing_address_line1,billing_address_line2,billing_city,billing_state,billing_country,billing_postal_code,annual_plastic_qty_mt')
      .eq('id', client.account_id)
      .single();
    if (acct) accountRow = acct;
  }

  // Build enriched fields
  const fields = (fieldDefs || []).map((fd: Record<string, unknown>) => {
    const stored = dataByFieldId[fd.id as string];
    const acctValue = fd.account_column ? accountRow[fd.account_column as string] : undefined;

    const value = stored
      ? (stored.value_text ?? stored.value_number ?? stored.value_date ?? stored.value_boolean ?? stored.value_json ?? stored.file_url ?? null)
      : (acctValue ?? null);

    const source = stored?.source ?? (acctValue !== undefined ? 'auto_mapped' : null);

    return {
      ...fd,
      stored_value: value,
      file_url: stored?.file_url ?? null,
      file_name: stored?.file_name ?? null,
      file_size_bytes: stored?.file_size_bytes ?? null,
      validity_expires: stored?.validity_expires ?? null,
      is_verified: stored?.is_verified ?? false,
      source,
      notes: stored?.notes ?? null,
      last_updated: stored?.updated_at ?? null,
      is_complete: value !== null && value !== '',
    };
  });

  return NextResponse.json({ fields, categories, client_id: clientId });
}

/** PUT /api/portal/data-profile
 *  Upsert a single field value for the authenticated client.
 *  Body: { field_key, value_text?, value_number?, value_date?, value_boolean?, value_json?, notes? }
 */
export async function PUT(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { field_key, notes, ...values } = body;
  if (!field_key) return NextResponse.json({ error: 'field_key is required' }, { status: 400 });

  const db = adminClient();

  const { data: profile } = await (db as any)
    .from('profiles')
    .select('client_id')
    .eq('id', actor.userId)
    .maybeSingle();

  const clientId = actor.isAdmin ? (body.client_id || null) : profile?.client_id;
  if (!clientId) return NextResponse.json({ error: 'No client found' }, { status: 404 });

  const { data: fieldDef } = await (db as any)
    .from('global_field_definitions')
    .select('id, is_sensitive')
    .eq('field_key', field_key)
    .eq('is_active', true)
    .single();

  if (!fieldDef) return NextResponse.json({ error: 'Unknown field_key' }, { status: 404 });

  const { data, error } = await (db as any)
    .from('client_global_data')
    .upsert({
      client_id: clientId,
      field_id: fieldDef.id,
      value_text: values.value_text ?? null,
      value_number: values.value_number ?? null,
      value_date: values.value_date ?? null,
      value_boolean: values.value_boolean ?? null,
      value_json: values.value_json ?? null,
      notes: notes ?? null,
      source: 'manual',
      created_by: actor.userId,
    }, { onConflict: 'client_id,field_id' })
    .select('id, field_id, source, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true, record: data });
}
