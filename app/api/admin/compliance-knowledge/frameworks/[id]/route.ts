import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/compliance-knowledge/frameworks/[id]
 *  Returns a single framework with all related data (cycles, deadlines, doc requirements).
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = adminClient();

  const [frameworkRes, cyclesRes, deadlinesRes, docReqsRes] = await Promise.all([
    (db as any)
      .from('compliance_frameworks')
      .select(`
        *,
        compliance_countries ( id, name, iso2, flag_emoji ),
        compliance_types ( id, name, code, category, region ),
        regulatory_authorities ( id, name, acronym, website_url, portal_url )
      `)
      .eq('id', id)
      .single(),

    (db as any)
      .from('compliance_filing_cycles')
      .select('*')
      .eq('framework_id', id)
      .order('sort_order', { ascending: true }),

    (db as any)
      .from('compliance_deadlines')
      .select(`
        *,
        compliance_filing_cycles ( id, cycle_code, cycle_label ),
        financial_year_structures ( id, label, short_label )
      `)
      .eq('framework_id', id)
      .order('due_date', { ascending: true }),

    (db as any)
      .from('compliance_document_requirements')
      .select('*')
      .eq('framework_id', id)
      .order('display_order', { ascending: true }),
  ]);

  if (frameworkRes.error) {
    if (frameworkRes.error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: frameworkRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    framework: frameworkRes.data,
    cycles: cyclesRes.data ?? [],
    deadlines: deadlinesRes.data ?? [],
    document_requirements: docReqsRes.data ?? [],
  });
}

/** PATCH /api/admin/compliance-knowledge/frameworks/[id]
 *  Updates a framework's fields.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const allowedFields = [
    'name','short_name','description','legal_reference','portal_url',
    'applicability_criteria','registration_parameters','filing_notes',
    'internal_notes','effective_from','effective_to','is_active',
    'authority_id','metadata',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('compliance_frameworks')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      compliance_countries ( id, name, iso2, flag_emoji ),
      compliance_types ( id, name, code, category ),
      regulatory_authorities ( id, name, acronym )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ framework: data });
}

/** DELETE /api/admin/compliance-knowledge/frameworks/[id]
 *  Soft-deactivates (sets is_active = false) a framework.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = adminClient();
  const { error } = await (db as any)
    .from('compliance_frameworks')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
