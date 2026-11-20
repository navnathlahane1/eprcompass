/**
 * PATCH  /api/recycler-portal/cpcb-returns/[returnId]  — update / file / acknowledge
 * DELETE /api/recycler-portal/cpcb-returns/[returnId]  — delete
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ returnId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { returnId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_cpcb_returns').select('id').eq('id', returnId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

  const allowed: Record<string, any> = {};
  if (b.status !== undefined && ['NOT_STARTED', 'IN_PROGRESS', 'FILED', 'ACKNOWLEDGED', 'LATE'].includes(b.status)) {
    allowed.status = b.status;
    if (b.status === 'FILED' && !b.filed_date) allowed.filed_date = new Date().toISOString().slice(0, 10);
  }
  for (const k of ['acknowledgment_no', 'acknowledgment_url', 'filing_notes', 'return_label', 'fiscal_year', 'waste_category']) {
    if (b[k] !== undefined) allowed[k] = b[k]?.trim?.() || null;
  }
  for (const k of ['period_start', 'period_end', 'due_date', 'filed_date']) {
    if (b[k] !== undefined) allowed[k] = b[k] || null;
  }
  if (b.processed_qty_mt !== undefined) allowed.processed_qty_mt = b.processed_qty_mt ? Number(b.processed_qty_mt) : null;
  if (b.credits_claimed_mt !== undefined) allowed.credits_claimed_mt = b.credits_claimed_mt ? Number(b.credits_claimed_mt) : null;

  const { data, error } = await (db as any)
    .from('recycler_cpcb_returns').update(allowed).eq('id', returnId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ return: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { returnId } = await params;
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_cpcb_returns').select('id').eq('id', returnId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

  const { error } = await (db as any).from('recycler_cpcb_returns').delete().eq('id', returnId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
