/**
 * Corporate tender management routes.
 *
 * GET  /api/corporate/tenders           — list my tenders
 * POST /api/corporate/tenders           — create a new tender
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';

async function resolveCorporateActor() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();
  const { data: profile } = await (db as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? '';
  if (!['client', 'admin', 'manager'].includes(role)) return null;

  return { userId: user.id, role };
}

export async function GET(req: NextRequest) {
  const actor = await resolveCorporateActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status');
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(50, Number(sp.get('limit') ?? 20));
  const offset = (page - 1) * limit;

  let q = (db as any)
    .from('tenders')
    .select(
      'id, tender_number, title, epr_type, status, required_qty, unit, ' +
      'submission_deadline, created_at, published_at, awarded_to',
      { count: 'exact' }
    )
    .eq('posted_by', actor.userId)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status) q = q.eq('status', status);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tenders: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveCorporateActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Required fields
  if (!body.title || !body.eprType) {
    return NextResponse.json({ error: 'title and eprType are required' }, { status: 400 });
  }

  const db = adminClient();

  const { data, error } = await (db as any)
    .from('tenders')
    .insert({
      posted_by: actor.userId,
      title: body.title,
      description: body.description,
      epr_type: body.eprType,
      category_code: body.categoryCode,
      sub_category: body.subCategory,
      required_qty: body.requiredQty,
      unit: body.unit ?? 'MT',
      states_covered: body.statesCovered ?? [],
      financial_year: body.financialYear,
      submission_deadline: body.submissionDeadline,
      start_date: body.startDate,
      end_date: body.endDate,
      tender_type: body.tenderType ?? 'OPEN',
      status: 'DRAFT',
      eligibility_criteria: body.eligibilityCriteria ?? {},
      visibility: body.visibility ?? 'ALL_RECYCLERS',
      invited_recycler_ids: body.invitedRecyclerIds ?? [],
      attachments: body.attachments ?? [],
    })
    .select('id, tender_number, status, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, tender: data }, { status: 201 });
}
