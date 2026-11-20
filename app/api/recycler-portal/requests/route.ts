/**
 * GET  /api/recycler-portal/requests   — incoming corporate requests for this recycler
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status');
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(50, Number(sp.get('limit') ?? 20));
  const offset = (page - 1) * limit;

  let q = (db as any)
    .from('corporate_requests')
    .select(
      'id, request_number, epr_type, required_qty, unit, states_covered, urgency, ' +
      'status, expires_at, created_at, budget_range, budget_hidden, message, max_rounds'
    )
    .or(`target_type.eq.OPEN_TO_NETWORK,target_recycler_ids.cs.{${actor.recyclerId}}`)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status) q = q.eq('status', status);
  else q = q.not('status', 'in', '("WITHDRAWN","EXPIRED")');

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch my response status for each request
  const requestIds = (data ?? []).map((r: any) => r.id);
  const { data: myResponses } = requestIds.length > 0
    ? await (db as any)
        .from('request_responses')
        .select('request_id, status, round_number')
        .eq('recycler_id', actor.recyclerId)
        .in('request_id', requestIds)
        .order('round_number', { ascending: false })
    : { data: [] };

  const responseMap = new Map((myResponses ?? []).map((r: any) => [r.request_id, r]));

  const enriched = (data ?? []).map((req: any) => ({
    ...req,
    myResponse: responseMap.get(req.id) ?? null,
  }));

  return NextResponse.json({ requests: enriched, page, limit });
}
