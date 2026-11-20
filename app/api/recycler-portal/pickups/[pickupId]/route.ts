/**
 * PATCH /api/recycler-portal/pickups/[pickupId] — advance status / record actuals / manifest
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ pickupId: string }> };

const VALID_STATUS = ['SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];

function manifestNo(): string {
  return `MAN-${Date.now().toString(36).toUpperCase()}`;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { pickupId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_pickups').select('id, manifest_no, status').eq('id', pickupId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 });

  const allowed: Record<string, any> = {};
  if (b.status !== undefined) {
    if (!VALID_STATUS.includes(b.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    allowed.status = b.status;
    // Auto-generate manifest on transit if not present
    if (b.status === 'IN_TRANSIT' && !existing.manifest_no) allowed.manifest_no = manifestNo();
  }
  for (const k of ['vehicle_number', 'driver_name', 'driver_phone', 'manifest_url', 'pickup_address', 'notes']) {
    if (b[k] !== undefined) allowed[k] = b[k]?.trim?.() || null;
  }
  if (b.actual_qty_mt !== undefined) allowed.actual_qty_mt = b.actual_qty_mt ? Number(b.actual_qty_mt) : null;
  if (b.est_qty_mt !== undefined) allowed.est_qty_mt = b.est_qty_mt ? Number(b.est_qty_mt) : null;

  const { data, error } = await (db as any)
    .from('recycler_pickups').update(allowed).eq('id', pickupId).select('*, supplier:supplier_id(name)').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pickup: { ...data, supplier_name: data.supplier?.name ?? null } });
}
