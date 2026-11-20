/**
 * GET /api/recycler-portal/bookings — this recycler's upcoming (and recent) bookings
 */
import { NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_bookings')
    .select('id, booked_by_name, booked_by_email, booked_by_phone, booked_by_org, start_at, end_at, status, notes, requirement:requirement_id(pibo_name)')
    .eq('recycler_id', actor.recyclerId)
    .order('start_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data ?? [] });
}
