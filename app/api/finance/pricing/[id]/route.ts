/**
 * PATCH  /api/finance/pricing/[id]  — update a service price (CFO only)
 * DELETE /api/finance/pricing/[id]  — delete a service price (CFO only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

async function guardCFO() {
  const actor = await resolveFinanceUser();
  if (!actor) return null;
  if (!actor.isCFO && actor.role !== 'admin') return null;
  return actor;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guardCFO();
  if (!actor) return NextResponse.json({ error: 'Only CFO can update pricing' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed = ['name', 'category', 'description', 'base_price_inr', 'gst_rate', 'unit', 'is_active', 'sort_order', 'notes'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await (db as any)
    .from('service_pricing')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await guardCFO();
  if (!actor) return NextResponse.json({ error: 'Only CFO can delete pricing' }, { status: 403 });

  const { id } = await params;
  const db = getServiceClient();
  const { error } = await (db as any)
    .from('service_pricing')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
