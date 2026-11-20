/**
 * PATCH /api/telecalling/deals/[id] — update stage / amount / notes
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

const STAGE_PROBABILITY: Record<string, number> = {
  'Qualification': 20, 'Proposal Sent': 40, 'Negotiation': 65, 'Closed Won': 100, 'Closed Lost': 0,
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (body.title !== undefined)               patch.title = body.title;
  if (body.notes !== undefined)               patch.notes = body.notes;
  if (body.amount_inr !== undefined)          patch.amount_inr = body.amount_inr;
  if (body.expected_close_date !== undefined) patch.expected_close_date = body.expected_close_date;
  if (body.assigned_to !== undefined)         patch.assigned_to = body.assigned_to;
  if (body.stage !== undefined) {
    patch.stage = body.stage;
    patch.probability = STAGE_PROBABILITY[body.stage as string] ?? 20;
    if (body.stage === 'Closed Won' || body.stage === 'Closed Lost') patch.closed_at = now;
  }
  if (body.probability !== undefined) patch.probability = body.probability;

  const { data, error } = await actor.db.from('tc_deals').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deal: data });
}
