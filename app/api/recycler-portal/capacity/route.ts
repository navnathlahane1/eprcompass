import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(_req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const db = adminClient();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const fromDate = twelveMonthsAgo.toISOString().slice(0, 7); // YYYY-MM

  const { data: logs, error: logsErr } = await (db as any)
    .from('recycler_capacity_log')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .gte('month', fromDate)
    .order('month', { ascending: false });

  if (logsErr) return NextResponse.json({ error: logsErr.message }, { status: 500 });

  const { data: recycler } = await (db as any)
    .from('recyclers')
    .select('capacity')
    .eq('id', actor.recyclerId)
    .maybeSingle();

  return NextResponse.json({
    logs: logs ?? [],
    currentCapacity: recycler?.capacity ?? null,
  });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const body = await req.json();
  const { month, capacity_mt, utilized_mt } = body;

  if (!month || capacity_mt == null || utilized_mt == null) {
    return NextResponse.json({ error: 'month, capacity_mt, and utilized_mt are required.' }, { status: 400 });
  }

  const db = adminClient();

  const { data, error } = await (db as any)
    .from('recycler_capacity_log')
    .upsert(
      { recycler_id: actor.recyclerId, month, capacity_mt, utilized_mt },
      { onConflict: 'recycler_id,month' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ log: data });
}
