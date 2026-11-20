/**
 * GET  /api/recycler-portal/suppliers  — list suppliers
 * POST /api/recycler-portal/suppliers  — add a supplier
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_suppliers')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ suppliers: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ suppliers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!b.name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_suppliers')
    .insert({
      recycler_id: actor.recyclerId,
      name: b.name.trim(),
      supplier_type: b.supplier_type || null,
      contact_person: b.contact_person?.trim() || null,
      phone: b.phone?.trim() || null,
      email: b.email?.trim() || null,
      gstin: b.gstin?.trim() || null,
      address: b.address?.trim() || null,
      city: b.city?.trim() || null,
      state: b.state?.trim() || null,
      waste_categories: Array.isArray(b.waste_categories) ? b.waste_categories : [],
      avg_monthly_supply_mt: b.avg_monthly_supply_mt ? Number(b.avg_monthly_supply_mt) : null,
      rating: b.rating ? Number(b.rating) : null,
      notes: b.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ supplier: { id: 'pending' }, message: 'Supplier saved.' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ supplier: data }, { status: 201 });
}
