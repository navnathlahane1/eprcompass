/**
 * GET  /api/telecalling/deals  — deal pipeline
 * POST /api/telecalling/deals  — create deal from lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

const STAGE_PROBABILITY: Record<string, number> = {
  'Qualification': 20,
  'Proposal Sent': 40,
  'Negotiation': 65,
  'Closed Won': 100,
  'Closed Lost': 0,
};

export async function GET(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 30;
  const offset = (page - 1) * limit;

  let query = actor.db
    .from('tc_deals')
    .select(
      `*, lead:leads(company_name, name, email, phone, rating, industry),
       assignee:profiles!tc_deals_assigned_to_fkey(full_name),
       creator:profiles!tc_deals_created_by_fkey(full_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!['admin', 'manager'].includes(actor.role)) {
    query = query.or(`created_by.eq.${actor.id},assigned_to.eq.${actor.id}`);
  }
  if (stage && stage !== 'all') query = query.eq('stage', stage);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allDeals = data ?? [];

  // Build per-stage { count, value } map — matches what DealsClient expects
  const pipeline = Object.fromEntries(
    Object.keys(STAGE_PROBABILITY).map(stageKey => {
      const stageDeals = allDeals.filter((d: { stage: string }) => d.stage === stageKey);
      return [stageKey, {
        count: stageDeals.length,
        value: stageDeals.reduce((s: number, d: { amount_inr?: number }) => s + (d.amount_inr || 0), 0),
      }];
    })
  );

  return NextResponse.json({ deals: allDeals, total: count ?? 0, page, limit, pipeline });
}

export async function POST(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { lead_id, title, stage, amount_inr, expected_close_date, notes } = body as Record<string, string>;
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const dealStage = stage || 'Qualification';
  const { data, error } = await actor.db.from('tc_deals').insert({
    lead_id: lead_id || null,
    title: title.trim(),
    stage: dealStage,
    amount_inr: amount_inr ? parseFloat(amount_inr) : null,
    expected_close_date: expected_close_date || null,
    probability: STAGE_PROBABILITY[dealStage] ?? 20,
    notes: notes?.trim() || null,
    assigned_to: actor.id,
    created_by: actor.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (lead_id) {
    await actor.db.from('leads').update({ stage: 'Interested', updated_at: new Date().toISOString() }).eq('id', lead_id);
  }

  return NextResponse.json({ deal: data }, { status: 201 });
}
