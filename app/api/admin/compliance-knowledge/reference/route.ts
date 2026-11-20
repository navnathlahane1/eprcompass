import { NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/compliance-knowledge/reference
 *  Returns compliance_countries, compliance_types, and regulatory_authorities
 *  for populating dropdowns in admin forms.
 */
export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [countriesRes, typesRes, authoritiesRes, fyRes] = await Promise.all([
    (db as any)
      .from('compliance_countries')
      .select('id, name, iso2, flag_emoji')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    (db as any)
      .from('compliance_types')
      .select('id, name, code, category, region')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    (db as any)
      .from('regulatory_authorities')
      .select('id, name, acronym, country_id, jurisdiction')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    (db as any)
      .from('financial_year_structures')
      .select('id, country_id, label, short_label, start_date, end_date, is_current')
      .order('start_date', { ascending: false }),
  ]);

  return NextResponse.json({
    countries:   countriesRes.data ?? [],
    types:       typesRes.data ?? [],
    authorities: authoritiesRes.data ?? [],
    financial_years: fyRes.data ?? [],
  });
}
