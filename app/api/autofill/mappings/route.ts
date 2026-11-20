import { NextRequest, NextResponse } from 'next/server';
import { resolveExtensionActor } from '@/lib/autofill/extensionAuth';
import { adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { applyTransform } from '@/lib/autofill/validationEngine';

/**
 * GET /api/autofill/mappings?portal_id=&page_context=
 * Returns field mappings pre-filled with the client's actual data values.
 * Auth: Bearer <extension_token>
 */
export async function GET(req: NextRequest) {
  const actor = await resolveExtensionActor(req.headers.get('authorization'));
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.clientId) return NextResponse.json({ error: 'Token not scoped to a client' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const portalId = searchParams.get('portal_id');
  const pageContext = searchParams.get('page_context') || null;

  if (!portalId) return NextResponse.json({ error: 'portal_id is required' }, { status: 400 });

  const db = adminClient();

  // Load portal
  const { data: portal, error: pErr } = await (db as any)
    .from('compliance_portals')
    .select('*')
    .eq('id', portalId)
    .eq('is_active', true)
    .single();

  if (pErr || !portal) return NextResponse.json({ error: 'Portal not found' }, { status: 404 });

  // Load active field mappings for this portal + page context
  let mQuery = (db as any)
    .from('portal_field_mappings')
    .select(`
      *,
      global_field_definitions (
        id, field_key, display_name, data_type,
        account_column, contact_column, profile_column,
        is_sensitive
      )
    `)
    .eq('portal_id', portalId)
    .eq('is_active', true)
    .order('confidence_score', { ascending: false });

  if (pageContext) {
    mQuery = mQuery.or(`page_context.eq.${pageContext},page_context.is.null`);
  }

  const { data: mappings, error: mErr } = await mQuery;
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  if (!mappings?.length) {
    return NextResponse.json({ portal, page_context: pageContext, fields: [], steps: [] });
  }

  // Collect all field IDs we need values for
  const fieldIds = [...new Set(mappings.map((m: { global_field_id: string }) => m.global_field_id))];

  // 1. Fetch client_global_data for this client + fields
  const { data: clientData } = await (db as any)
    .from('client_global_data')
    .select('field_id, value_text, value_number, value_date, value_boolean, value_json, file_url, file_name')
    .eq('client_id', actor.clientId)
    .in('field_id', fieldIds);

  const dataByFieldId: Record<string, Record<string, unknown>> = {};
  for (const row of (clientData || [])) {
    dataByFieldId[row.field_id] = row;
  }

  // 2. Fetch account row for direct-mapped columns (account_column)
  const accountCols = mappings
    .map((m: { global_field_definitions?: { account_column?: string } }) => m.global_field_definitions?.account_column)
    .filter(Boolean);

  let accountRow: Record<string, unknown> = {};
  if (accountCols.length) {
    const { data: client } = await (db as any)
      .from('clients')
      .select('account_id')
      .eq('id', actor.clientId)
      .single();
    if (client?.account_id) {
      const { data: acct } = await (db as any)
        .from('accounts')
        .select(accountCols.join(','))
        .eq('id', client.account_id)
        .single();
      if (acct) accountRow = acct;
    }
  }

  // Build the filled fields payload
  const fields = mappings.map((m: Record<string, unknown> & {
    global_field_definitions?: Record<string, unknown>
  }) => {
    const gfd = m.global_field_definitions as Record<string, unknown> | undefined;
    const fieldId = m.global_field_id as string;
    const stored = dataByFieldId[fieldId];

    // Priority: client_global_data → accounts column → null
    let rawValue: string | null = null;
    if (stored) {
      rawValue = (
        stored.value_text as string |null ??
        stored.value_number?.toString() ??
        stored.value_date as string | null ??
        (stored.value_boolean !== null ? String(stored.value_boolean) : null) ??
        (stored.value_json ? JSON.stringify(stored.value_json) : null) ??
        stored.file_url as string | null
      );
    } else if (gfd?.account_column && accountRow[gfd.account_column as string]) {
      rawValue = String(accountRow[gfd.account_column as string]);
    }

    // Apply value transform
    const displayValue = rawValue ? applyTransform(m.value_transform as string | null, rawValue) : null;

    return {
      field_key: gfd?.field_key,
      global_field_id: fieldId,
      mapping_id: m.id,
      display_name: gfd?.display_name,
      is_sensitive: gfd?.is_sensitive ?? false,
      display_value: displayValue,
      selector_value: m.selector_value,
      selector_type: m.selector_type,
      fill_action: m.fill_action,
      value_transform: m.value_transform,
      pre_fill_script: m.pre_fill_script,
      post_fill_script: m.post_fill_script,
      fallback_selectors: m.fallback_selectors,
      confidence_score: m.confidence_score,
      required_on_portal: m.required_on_portal,
      has_value: rawValue !== null,
    };
  });

  // Load form structure steps for this portal + page context
  let stepsQuery = (db as any)
    .from('portal_form_structures')
    .select('*')
    .eq('portal_id', portalId)
    .eq('is_active', true)
    .order('step_number');

  if (pageContext) stepsQuery = stepsQuery.eq('filing_type', pageContext);

  const { data: steps } = await stepsQuery;

  return NextResponse.json({
    portal,
    page_context: pageContext,
    fields,
    steps: steps || [],
    stats: {
      total: fields.length,
      with_value: fields.filter((f: { has_value: boolean }) => f.has_value).length,
      required: fields.filter((f: { required_on_portal: boolean }) => f.required_on_portal).length,
    },
  });
}
