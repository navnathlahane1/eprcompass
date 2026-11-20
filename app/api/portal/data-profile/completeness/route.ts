import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/portal/data-profile/completeness
 *  Returns completeness scores overall and per category.
 *  Used by the dashboard to show the data profile progress ring.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const db = adminClient();

  const { data: profile } = await (db as any)
    .from('profiles')
    .select('client_id')
    .eq('id', actor.userId)
    .maybeSingle();

  const clientId = actor.isAdmin
    ? (searchParams.get('client_id') || null)
    : profile?.client_id;

  if (!clientId) return NextResponse.json({ error: 'No client found' }, { status: 404 });

  // Load all field categories
  const { data: categories } = await (db as any)
    .from('global_field_categories')
    .select('id, code, name, icon, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  // Load field definitions with category
  const { data: fieldDefs } = await (db as any)
    .from('global_field_definitions')
    .select('id, field_key, category_id, is_required, data_type, account_column')
    .eq('is_active', true)
    .eq('automation_enabled', true);

  // Load all client values (non-file)
  const { data: clientData } = await (db as any)
    .from('client_global_data')
    .select('field_id, value_text, value_number, value_date, value_boolean, value_json, file_url, is_verified')
    .eq('client_id', clientId);

  // Load account row for auto-mapped columns
  const { data: client } = await (db as any)
    .from('clients')
    .select('account_id')
    .eq('id', clientId)
    .single();

  let accountRow: Record<string, unknown> = {};
  if (client?.account_id) {
    const { data: acct } = await (db as any)
      .from('accounts')
      .select('company_name,legal_name,gstin,pan,cin,billing_address_line1,billing_city,billing_state,billing_country,billing_postal_code,annual_plastic_qty_mt')
      .eq('id', client.account_id)
      .single();
    if (acct) accountRow = acct;
  }

  const filledFieldIds = new Set<string>();
  const verifiedFieldIds = new Set<string>();

  for (const row of (clientData || [])) {
    const hasValue = (
      row.value_text != null ||
      row.value_number != null ||
      row.value_date != null ||
      row.value_boolean != null ||
      row.value_json != null ||
      row.file_url != null
    );
    if (hasValue) filledFieldIds.add(row.field_id);
    if (row.is_verified) verifiedFieldIds.add(row.field_id);
  }

  // Count per category
  const byCategory = (categories || []).map((cat: Record<string, unknown>) => {
    const catFields = (fieldDefs || []).filter((f: { category_id: string }) => f.category_id === cat.id);
    let filled = 0;
    let verified = 0;

    for (const f of catFields) {
      const inStore = filledFieldIds.has(f.id);
      const inAccount = f.account_column && accountRow[f.account_column] != null;
      if (inStore || inAccount) filled++;
      if (verifiedFieldIds.has(f.id)) verified++;
    }

    return {
      category: cat,
      total: catFields.length,
      filled,
      verified,
      percentage: catFields.length ? Math.round((filled / catFields.length) * 100) : 0,
    };
  });

  const totalFields = (fieldDefs || []).length;
  let totalFilled = 0;
  let totalVerified = 0;

  for (const f of (fieldDefs || [])) {
    const inStore = filledFieldIds.has(f.id);
    const inAccount = f.account_column && accountRow[f.account_column] != null;
    if (inStore || inAccount) totalFilled++;
    if (verifiedFieldIds.has(f.id)) totalVerified++;
  }

  return NextResponse.json({
    overall: {
      total: totalFields,
      filled: totalFilled,
      verified: totalVerified,
      percentage: totalFields ? Math.round((totalFilled / totalFields) * 100) : 0,
    },
    by_category: byCategory,
    client_id: clientId,
  });
}
