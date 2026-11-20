/**
 * GET    /api/telecalling/proposals/[id]  — proposal detail
 * PATCH  /api/telecalling/proposals/[id]  — edit content / mark sent
 * DELETE /api/telecalling/proposals/[id]  — delete draft
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await actor.db
    .from('tc_proposals')
    .select(`*, lead:leads(company_name, name, email, phone, city, description),
             creator:profiles!tc_proposals_created_by_fkey(full_name)`)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ proposal: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (body.title !== undefined)        patch.title = body.title;
  if (body.content_html !== undefined) patch.content_html = body.content_html;
  if (body.amount_inr !== undefined)   patch.amount_inr = body.amount_inr;
  if (body.valid_until !== undefined)  patch.valid_until = body.valid_until;
  if (body.status !== undefined) {
    patch.status = body.status;
    if (body.status === 'sent' && !body.sent_at) patch.sent_at = now;
  }
  if (body.sent_at !== undefined) patch.sent_at = body.sent_at;

  if (body.status === 'sent' && body.lead_id) {
    await actor.db
      .from('leads')
      .update({ tc_status: 'Proposal Sent', updated_at: now })
      .eq('id', body.lead_id);
  }

  const { data, error } = await actor.db
    .from('tc_proposals')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only allow deleting own drafts (admin can delete any)
  const filter = actor.db.from('tc_proposals').delete().eq('id', id).eq('status', 'draft');
  if (!['admin', 'manager'].includes(actor.role)) {
    filter.eq('created_by', actor.id);
  }
  const { error } = await filter;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
