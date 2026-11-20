import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET(_req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const db = adminClient();

  const { data: invoices, error } = await (db as any)
    .from('recycler_invoices')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invoices: invoices ?? [] });
}
