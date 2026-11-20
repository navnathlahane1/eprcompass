/**
 * GET  /api/recycler-portal/tenders  — list tenders matched to this recycler
 * POST /api/recycler-portal/tenders  — recycler submits a response (bid/EOI)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { matchRecyclerToTender } from '@/lib/recyclerPortal/tenderService';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status') ?? 'PUBLISHED';
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(50, Number(sp.get('limit') ?? 20));
  const offset = (page - 1) * limit;

  // Fetch published tenders with status filter
  const { data: tenders, error } = await (db as any)
    .from('tenders')
    .select(
      'id, tender_number, title, epr_type, required_qty, unit, states_covered, ' +
      'submission_deadline, tender_type, status, eligibility_criteria, ' +
      'published_at, start_date, end_date'
    )
    .eq('status', status)
    .range(offset, offset + limit - 1)
    .order('published_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch full recycler profile for matching
  const { data: recycler } = await (db as any)
    .from('recyclers')
    .select('epr_categories, authorized_states, verification_status, certifications, capacity')
    .eq('id', actor.recyclerId)
    .maybeSingle();

  // Also fetch existing responses from this recycler
  const tenderIds = (tenders ?? []).map((t: any) => t.id);
  const { data: myResponses } = tenderIds.length > 0
    ? await (db as any)
        .from('tender_responses')
        .select('tender_id, status, submitted_at')
        .eq('recycler_id', actor.recyclerId)
        .in('tender_id', tenderIds)
    : { data: [] };

  const responseMap = new Map((myResponses ?? []).map((r: any) => [r.tender_id, r]));

  // Compute match scores
  const enriched = (tenders ?? []).map((t: any) => {
    const match = recycler
      ? matchRecyclerToTender(
          {
            eprCategories: recycler.epr_categories ?? [],
            authorizedStates: recycler.authorized_states ?? [],
            verificationStatus: recycler.verification_status,
            certifications: recycler.certifications ?? [],
            capacityPerMonth: recycler.capacity?.monthly_mt,
          },
          {
            eprType: t.epr_type,
            statesCovered: t.states_covered ?? [],
            requiredQty: t.required_qty,
            eligibilityCriteria: t.eligibility_criteria ?? {},
          }
        )
      : { matched: false, score: 0, reasons: [], disqualifiers: [] };

    return {
      ...t,
      matchScore: match.score,
      matched: match.matched,
      matchReasons: match.reasons,
      disqualifiers: match.disqualifiers,
      myResponse: responseMap.get(t.id) ?? null,
    };
  });

  // Sort: matched first, then by score desc
  enriched.sort((a: any, b: any) => {
    if (a.matched !== b.matched) return a.matched ? -1 : 1;
    return b.matchScore - a.matchScore;
  });

  return NextResponse.json({ tenders: enriched, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (actor.verificationStatus !== 'VERIFIED') {
    return NextResponse.json(
      { error: 'Only VERIFIED recyclers can submit tender responses.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const tenderId = body.tenderId;
  if (!tenderId) return NextResponse.json({ error: 'tenderId is required' }, { status: 400 });

  const db = adminClient();

  // Confirm tender is PUBLISHED and not expired
  const { data: tender } = await (db as any)
    .from('tenders')
    .select('id, status, submission_deadline')
    .eq('id', tenderId)
    .maybeSingle();

  if (!tender || tender.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Tender not found or not open for responses.' }, { status: 404 });
  }

  if (tender.submission_deadline && new Date(tender.submission_deadline) < new Date()) {
    return NextResponse.json({ error: 'Submission deadline has passed.' }, { status: 422 });
  }

  const { data, error } = await (db as any)
    .from('tender_responses')
    .upsert(
      {
        tender_id: tenderId,
        recycler_id: actor.recyclerId,
        offered_qty: body.offeredQty,
        offered_unit: body.offeredUnit ?? 'MT',
        rate_per_unit: body.ratePerUnit,
        currency: body.currency ?? 'INR',
        proposed_start_date: body.proposedStartDate,
        proposed_end_date: body.proposedEndDate,
        coverage_states: body.coverageStates ?? [],
        technical_proposal: body.technicalProposal,
        attachments: body.attachments ?? [],
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'tender_id,recycler_id' }
    )
    .select('id, status, submitted_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, response: data }, { status: 201 });
}
