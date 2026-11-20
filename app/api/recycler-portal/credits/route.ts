import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const db = adminClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);

  let query = (db as any)
    .from('epr_credits')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'All') {
    query = query.eq('status', status);
  }

  const { data: credits, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allCredits = credits ?? [];

  const summary = {
    total_issued: allCredits.filter((c: any) => c.status === 'Issued').length,
    total_transferred: allCredits.filter((c: any) => c.status === 'Transferred').length,
    total_value_inr: allCredits.reduce((sum: number, c: any) => sum + (c.total_value_inr ?? 0), 0),
    by_category: allCredits.reduce((acc: Record<string, number>, c: any) => {
      acc[c.waste_category] = (acc[c.waste_category] ?? 0) + (c.quantity_mt ?? 0);
      return acc;
    }, {}),
  };

  return NextResponse.json({ credits: allCredits, summary });
}
