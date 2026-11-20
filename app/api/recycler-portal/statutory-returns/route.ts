/**
 * GET  /api/recycler-portal/statutory-returns  — list statutory returns
 * POST /api/recycler-portal/statutory-returns  — add a return entry
 * PATCH /api/recycler-portal/statutory-returns — update status / filing details
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

const RETURN_META: Record<string, { label: string; regulation: string; frequency: string; defaultDueMonth: string }> = {
  FORM_IV:       { label: 'Form IV – Annual Report',              regulation: 'Bio-Medical Waste Management Rules, 2016',                                       frequency: 'Annual',      defaultDueMonth: '30 June' },
  FORM_4:        { label: 'Form 4 – Annual Return',               regulation: 'Hazardous & Other Wastes (Management & Transboundary Movement) Rules, 2016',     frequency: 'Annual',      defaultDueMonth: '30 June' },
  FORM_V:        { label: 'Form V – Environmental Statement',     regulation: 'Environment (Protection) Rules, 1986',                                            frequency: 'Annual',      defaultDueMonth: '30 September' },
  HALF_YEARLY_EC:{ label: 'Half-Yearly EC Compliance Report',     regulation: 'Environment Clearance (EC) Conditions (Where Applicable)',                        frequency: 'Half-Yearly', defaultDueMonth: 'APR–SEP & OCT–MAR' },
  CTO_COMPLIANCE:{ label: 'CTO Compliance Report',                regulation: 'Consent to Operate (CTO) Conditions',                                             frequency: 'As per CTO Order', defaultDueMonth: 'Quarterly / Half-Yearly / Annual' },
};

function emptySummary() { return { total: 0, pending: 0, submitted: 0, overdue: 0 }; }

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_statutory_returns')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ returns: [], summary: emptySummary(), meta: RETURN_META });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const returns = (data ?? []).map((r: any) => {
    let status = r.status;
    if (!['SUBMITTED', 'ACKNOWLEDGED'].includes(status) && r.due_date && new Date(r.due_date).getTime() < now) {
      status = 'OVERDUE';
    }
    const daysLeft = r.due_date ? Math.ceil((new Date(r.due_date).getTime() - now) / 86_400_000) : null;
    return { ...r, status, daysLeft, meta: RETURN_META[r.return_type] ?? null };
  });

  const summary = {
    total: returns.length,
    pending: returns.filter((r: any) => ['PENDING', 'IN_PROGRESS'].includes(r.status)).length,
    submitted: returns.filter((r: any) => ['SUBMITTED', 'ACKNOWLEDGED'].includes(r.status)).length,
    overdue: returns.filter((r: any) => r.status === 'OVERDUE').length,
  };

  return NextResponse.json({ returns, summary, meta: RETURN_META });
}

const VALID_TYPES = ['FORM_IV', 'FORM_4', 'FORM_V', 'HALF_YEARLY_EC', 'CTO_COMPLIANCE'];

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!VALID_TYPES.includes(b.return_type)) return NextResponse.json({ error: 'Invalid return_type' }, { status: 400 });
  if (!b.fiscal_year?.trim()) return NextResponse.json({ error: 'fiscal_year is required' }, { status: 400 });
  if (!b.period_label?.trim()) return NextResponse.json({ error: 'period_label is required' }, { status: 400 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_statutory_returns')
    .insert({
      recycler_id:      actor.recyclerId,
      return_type:      b.return_type,
      fiscal_year:      b.fiscal_year.trim(),
      period_label:     b.period_label.trim(),
      due_date:         b.due_date || null,
      status:           'PENDING',
      notes:            b.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ return: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const allowed = ['status', 'filed_date', 'acknowledgment_no', 'document_url', 'notes'];
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const k of allowed) { if (b[k] !== undefined) patch[k] = b[k] || null; }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_statutory_returns')
    .update(patch)
    .eq('id', b.id)
    .eq('recycler_id', actor.recyclerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ return: data });
}
