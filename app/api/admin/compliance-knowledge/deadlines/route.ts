import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/compliance-knowledge/deadlines
 *  Returns deadlines — optional filters: framework_id, financial_year_id, filing_type, upcoming (days).
 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const frameworkId = searchParams.get('framework_id') || '';
  const fyId        = searchParams.get('financial_year_id') || '';
  const filingType  = searchParams.get('filing_type') || '';
  const upcoming    = parseInt(searchParams.get('upcoming') || '0', 10); // days ahead

  const db = adminClient();
  let query = (db as any)
    .from('compliance_deadlines')
    .select(`
      *,
      compliance_frameworks (
        id, name, short_name,
        compliance_countries ( id, name, iso2, flag_emoji ),
        compliance_types ( id, name, code )
      ),
      compliance_filing_cycles ( id, cycle_code, cycle_label, cycle_type ),
      financial_year_structures ( id, label, short_label )
    `)
    .eq('is_active', true)
    .order('due_date', { ascending: true });

  if (frameworkId) query = query.eq('framework_id', frameworkId);
  if (fyId)        query = query.eq('financial_year_id', fyId);
  if (filingType)  query = query.eq('filing_type', filingType);
  if (upcoming > 0) {
    const until = new Date();
    until.setDate(until.getDate() + upcoming);
    query = query.lte('due_date', until.toISOString().split('T')[0]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deadlines: data });
}

/** POST /api/admin/compliance-knowledge/deadlines
 *  Creates a new deadline (and optionally its cycle if cycle_id not provided).
 */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const {
    framework_id, cycle_id, financial_year_id,
    filing_type, title, description, due_date,
    submission_open_date, grace_period_days, penalty_info,
    applicable_entity_types, reminder_days_before, metadata
  } = body;

  if (!framework_id || !filing_type || !title || !due_date) {
    return NextResponse.json(
      { error: 'framework_id, filing_type, title, and due_date are required' },
      { status: 400 }
    );
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('compliance_deadlines')
    .insert({
      framework_id,
      cycle_id: cycle_id || null,
      financial_year_id: financial_year_id || null,
      filing_type, title,
      description: description || null,
      due_date,
      submission_open_date: submission_open_date || null,
      grace_period_days: grace_period_days ?? 0,
      penalty_info: penalty_info || null,
      applicable_entity_types: applicable_entity_types || [],
      reminder_days_before: reminder_days_before || [30, 15, 7, 1],
      metadata: metadata || {},
      is_active: true,
      created_by: actor.userId,
    })
    .select(`
      *,
      compliance_frameworks ( id, name, short_name ),
      compliance_filing_cycles ( id, cycle_code, cycle_label ),
      financial_year_structures ( id, label, short_label )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deadline: data }, { status: 201 });
}

/** PATCH /api/admin/compliance-knowledge/deadlines/[id] inline — for bulk updates */
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const allowed = [
    'title','description','due_date','submission_open_date',
    'grace_period_days','penalty_info','applicable_entity_types',
    'reminder_days_before','is_active','cycle_id','financial_year_id','metadata'
  ];
  const payload: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in updates) payload[k] = updates[k];
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('compliance_deadlines')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deadline: data });
}
