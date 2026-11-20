import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/compliance-knowledge/frameworks
 *  Returns all compliance frameworks with joined country/type/authority.
 *  Optional filters: country_id, compliance_type_id, is_active
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const countryId = searchParams.get('country_id') || '';
  const typeId    = searchParams.get('compliance_type_id') || '';
  const active    = searchParams.get('is_active');

  const db = adminClient();
  let query = (db as any)
    .from('compliance_frameworks')
    .select(`
      *,
      compliance_countries ( id, name, iso2, flag_emoji ),
      compliance_types ( id, name, code, category, region ),
      regulatory_authorities ( id, name, acronym )
    `)
    .order('created_at', { ascending: false });

  if (countryId) query = query.eq('country_id', countryId);
  if (typeId)    query = query.eq('compliance_type_id', typeId);
  if (active !== null) query = query.eq('is_active', active === 'true');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ frameworks: data });
}

/** POST /api/admin/compliance-knowledge/frameworks
 *  Creates a new compliance framework.
 */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const {
    country_id, compliance_type_id, authority_id,
    name, short_name, description, legal_reference, portal_url,
    applicability_criteria, registration_parameters, filing_notes,
    internal_notes, effective_from, effective_to, is_active, metadata
  } = body;

  if (!country_id || !compliance_type_id || !name) {
    return NextResponse.json({ error: 'country_id, compliance_type_id, and name are required' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('compliance_frameworks')
    .insert({
      country_id, compliance_type_id, authority_id: authority_id || null,
      name, short_name: short_name || null,
      description: description || null,
      legal_reference: legal_reference || null,
      portal_url: portal_url || null,
      applicability_criteria: applicability_criteria || null,
      registration_parameters: registration_parameters || [],
      filing_notes: filing_notes || null,
      internal_notes: internal_notes || null,
      effective_from: effective_from || null,
      effective_to: effective_to || null,
      is_active: is_active !== false,
      metadata: metadata || {},
      created_by: actor.userId,
    })
    .select(`
      *,
      compliance_countries ( id, name, iso2, flag_emoji ),
      compliance_types ( id, name, code, category ),
      regulatory_authorities ( id, name, acronym )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ framework: data }, { status: 201 });
}
