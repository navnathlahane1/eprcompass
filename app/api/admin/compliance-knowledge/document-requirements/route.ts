import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/compliance-knowledge/document-requirements
 *  Returns document requirements — filter by framework_id.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const frameworkId = searchParams.get('framework_id') || '';

  const db = adminClient();
  let query = (db as any)
    .from('compliance_document_requirements')
    .select('*')
    .order('display_order', { ascending: true });

  if (frameworkId) query = query.eq('framework_id', frameworkId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requirements: data });
}

/** POST /api/admin/compliance-knowledge/document-requirements */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const {
    framework_id, document_name, document_code, description,
    is_mandatory, accepted_formats, max_file_size_mb,
    validity_period_months, renewal_reminder_days,
    sample_template_url, notes, applicable_filing_types, display_order
  } = body;

  if (!framework_id || !document_name) {
    return NextResponse.json({ error: 'framework_id and document_name are required' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('compliance_document_requirements')
    .insert({
      framework_id,
      document_name,
      document_code: document_code || null,
      description: description || null,
      is_mandatory: is_mandatory !== false,
      accepted_formats: accepted_formats || ['pdf'],
      max_file_size_mb: max_file_size_mb || 10,
      validity_period_months: validity_period_months || null,
      renewal_reminder_days: renewal_reminder_days ?? 30,
      sample_template_url: sample_template_url || null,
      notes: notes || null,
      applicable_filing_types: applicable_filing_types || [],
      display_order: display_order ?? 0,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requirement: data }, { status: 201 });
}

/** PATCH /api/admin/compliance-knowledge/document-requirements — update by id in body */
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const allowed = [
    'document_name','document_code','description','is_mandatory',
    'accepted_formats','max_file_size_mb','validity_period_months',
    'renewal_reminder_days','sample_template_url','notes',
    'applicable_filing_types','display_order','is_active'
  ];
  const payload: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in updates) payload[k] = updates[k];
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('compliance_document_requirements')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requirement: data });
}

/** DELETE /api/admin/compliance-knowledge/document-requirements?id=... */
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = adminClient();
  const { error } = await (db as any)
    .from('compliance_document_requirements')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
