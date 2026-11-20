/**
 * GET  /api/telecalling/proposals  — list proposals (mine or all for admin)
 * POST /api/telecalling/proposals  — create proposal draft
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const leadId = searchParams.get('lead_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 30;
  const offset = (page - 1) * limit;

  let query = actor.db
    .from('tc_proposals')
    .select(
      `*, lead:leads(company_name, name, email, phone, tc_assigned_agent),
       creator:profiles!tc_proposals_created_by_fkey(full_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!['admin', 'manager'].includes(actor.role)) {
    query = query.eq('created_by', actor.id);
  }
  if (status && status !== 'all') query = query.eq('status', status);
  if (leadId) query = query.eq('lead_id', leadId);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposals: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { lead_id, title, content_html, amount_inr, valid_until } = body as Record<string, string>;
  if (!lead_id) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const { data, error } = await actor.db.from('tc_proposals').insert({
    lead_id,
    title: title.trim(),
    content_html: content_html || null,
    amount_inr: amount_inr ? parseFloat(amount_inr) : null,
    valid_until: valid_until || null,
    status: 'draft',
    created_by: actor.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: data }, { status: 201 });
}
