import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(_req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const db = adminClient();

  const { data: contracts, error } = await (db as any)
    .from('recycler_contracts')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = contracts ?? [];
  const summary = {
    active: list.filter((c: any) => c.status === 'ACTIVE').length,
    completed: list.filter((c: any) => c.status === 'COMPLETED').length,
    total_value: list.reduce((s: number, c: any) => s + (c.total_value_inr ?? 0), 0),
  };

  return NextResponse.json({ contracts: list, summary });
}
