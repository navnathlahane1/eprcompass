/**
 * POST /api/recycler-portal/buyer-requests/[reqId]/express-interest
 * Recycler expresses interest in a PIBO credit requirement with an offer.
 * PATCH — update private CRM fields (follow-up date, notes) on an existing interest.
 * DELETE — withdraw interest.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ reqId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.verificationStatus !== 'VERIFIED') {
    return NextResponse.json({ error: 'Only verified recyclers can express interest.' }, { status: 403 });
  }

  const { reqId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: requirement } = await (db as any)
    .from('pibo_credit_requirements').select('id, status').eq('id', reqId).maybeSingle();
  if (!requirement) return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
  if (requirement.status !== 'OPEN') return NextResponse.json({ error: 'This requirement is no longer open' }, { status: 400 });

  const { error } = await (db as any)
    .from('pibo_match_interests')
    .upsert(
      {
        requirement_id: reqId,
        recycler_id: actor.recyclerId,
        offered_qty_mt: b.offered_qty_mt ? Number(b.offered_qty_mt) : null,
        offered_price_inr: b.offered_price_inr ? Number(b.offered_price_inr) : null,
        message: b.message?.trim() || null,
        status: 'PENDING',
      },
      { onConflict: 'requirement_id,recycler_id' }
    );

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ ok: true, message: 'Interest registered.' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: 'Interest submitted. The buyer and our team will review your offer.' });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reqId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const update: Record<string, any> = {};
  if ('follow_up_at' in b) update.follow_up_at = b.follow_up_at || null;
  if ('crm_notes' in b) update.crm_notes = (b.crm_notes ?? '').toString().slice(0, 2000) || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await (db as any)
    .from('pibo_match_interests')
    .update(update)
    .eq('requirement_id', reqId)
    .eq('recycler_id', actor.recyclerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reqId } = await params;
  const db = adminClient();

  await (db as any)
    .from('pibo_match_interests')
    .update({ status: 'WITHDRAWN' })
    .eq('requirement_id', reqId)
    .eq('recycler_id', actor.recyclerId);

  return NextResponse.json({ ok: true });
}
