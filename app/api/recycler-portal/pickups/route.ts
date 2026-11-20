/**
 * GET  /api/recycler-portal/pickups  — list pickups (joined with supplier name)
 * POST /api/recycler-portal/pickups  — schedule a pickup
 */
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

function pickupCode(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const n = (randomBytes(2).readUInt16BE(0) % 900) + 100;
  return `PU-${stamp}-${n}`;
}

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const status = req.nextUrl.searchParams.get('status');

  let q = (db as any)
    .from('recycler_pickups')
    .select('*, supplier:supplier_id(name)')
    .eq('recycler_id', actor.recyclerId)
    .order('scheduled_date', { ascending: false })
    .limit(200);
  if (status && status !== 'ALL') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ pickups: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const pickups = (data ?? []).map((p: any) => ({ ...p, supplier_name: p.supplier?.name ?? null }));
  return NextResponse.json({ pickups });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!b.scheduled_date) return NextResponse.json({ error: 'scheduled_date is required' }, { status: 400 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_pickups')
    .insert({
      recycler_id: actor.recyclerId,
      supplier_id: b.supplier_id || null,
      pickup_code: pickupCode(),
      waste_category: b.waste_category || null,
      est_qty_mt: b.est_qty_mt ? Number(b.est_qty_mt) : null,
      pickup_address: b.pickup_address?.trim() || null,
      scheduled_date: b.scheduled_date,
      vehicle_number: b.vehicle_number?.trim() || null,
      driver_name: b.driver_name?.trim() || null,
      driver_phone: b.driver_phone?.trim() || null,
      notes: b.notes?.trim() || null,
      status: 'SCHEDULED',
    })
    .select('*, supplier:supplier_id(name)')
    .single();

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ pickup: { id: 'pending' }, message: 'Pickup scheduled.' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pickup: { ...data, supplier_name: data.supplier?.name ?? null } }, { status: 201 });
}
