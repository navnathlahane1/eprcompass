/**
 * GET /api/recycler-portal/buyer-requests          — open PIBO requirements + match score + my interest
 * GET /api/recycler-portal/buyer-requests?view=mine — only requirements I've expressed interest in
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const view = req.nextUrl.searchParams.get('view');

  // My interests (with requirement joined)
  const { data: myInterests } = await (db as any)
    .from('pibo_match_interests')
    .select('id, requirement_id, offered_qty_mt, offered_price_inr, status, message, follow_up_at, crm_notes, created_at, requirement:requirement_id(*)')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: false })
    .then((r: any) => r, () => ({ data: [] }));

  if (view === 'mine') {
    const interests = (myInterests ?? []).map((i: any) => ({
      ...i,
      requirement: i.requirement ?? null,
    }));
    return NextResponse.json({ interests });
  }

  const interestMap: Record<string, any> = {};
  for (const i of myInterests ?? []) interestMap[i.requirement_id] = i;

  const { data: reqs, error } = await (db as any)
    .from('pibo_credit_requirements')
    .select('*')
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ requirements: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const myCats = (actor.eprCategories ?? []).map((c) => c.toLowerCase());
  const myStates = (actor.authorizedStates ?? []).map((s) => s.toLowerCase());

  const requirements = (reqs ?? []).map((r: any) => {
    const catMatch = myCats.some((c) => r.waste_category?.toLowerCase().includes(c) || c.includes(r.waste_category?.toLowerCase()));
    const stateMatch = (r.states ?? []).length === 0 || (r.states ?? []).some((s: string) => myStates.includes(s.toLowerCase()));
    let score = 0;
    if (catMatch) score += 60;
    if (stateMatch) score += 40;
    return {
      ...r,
      matchScore: score,
      matched: catMatch,
      myInterest: interestMap[r.id]
        ? { status: interestMap[r.id].status, offered_qty_mt: interestMap[r.id].offered_qty_mt }
        : null,
    };
  }).sort((a: any, b: any) => b.matchScore - a.matchScore);

  return NextResponse.json({ requirements });
}
