/**
 * PATCH  /api/recycler-portal/suppliers/[supplierId]  — update supplier
 * DELETE /api/recycler-portal/suppliers/[supplierId]  — soft-delete (is_active=false)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ supplierId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { supplierId } = await params;
  const b = await req.json().catch(() => ({}));
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_suppliers').select('id').eq('id', supplierId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

  const allowed: Record<string, any> = {};
  for (const k of ['name', 'supplier_type', 'contact_person', 'phone', 'email', 'gstin', 'address', 'city', 'state', 'notes']) {
    if (b[k] !== undefined) allowed[k] = b[k]?.trim?.() || null;
  }
  if (b.waste_categories !== undefined) allowed.waste_categories = Array.isArray(b.waste_categories) ? b.waste_categories : [];
  if (b.avg_monthly_supply_mt !== undefined) allowed.avg_monthly_supply_mt = b.avg_monthly_supply_mt ? Number(b.avg_monthly_supply_mt) : null;
  if (b.rating !== undefined) allowed.rating = b.rating ? Number(b.rating) : null;
  if (b.is_active !== undefined) allowed.is_active = !!b.is_active;

  const { data, error } = await (db as any)
    .from('recycler_suppliers').update(allowed).eq('id', supplierId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ supplier: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { supplierId } = await params;
  const db = adminClient();

  const { data: existing } = await (db as any)
    .from('recycler_suppliers').select('id').eq('id', supplierId).eq('recycler_id', actor.recyclerId).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

  const { error } = await (db as any).from('recycler_suppliers').update({ is_active: false }).eq('id', supplierId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
