/**
 * GET /api/recycler-portal/tenders/[tenderId]  — single tender detail + my response
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenderId: string }> }
) {
  const { tenderId } = await params;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [tenderRes, responseRes] = await Promise.all([
    (db as any)
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .eq('status', 'PUBLISHED')
      .maybeSingle(),
    (db as any)
      .from('tender_responses')
      .select('*')
      .eq('tender_id', tenderId)
      .eq('recycler_id', actor.recyclerId)
      .maybeSingle(),
  ]);

  if (!tenderRes.data) {
    return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
  }

  return NextResponse.json({ tender: tenderRes.data, myResponse: responseRes.data ?? null });
}
