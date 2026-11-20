import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { cpcbCertBlockReason } from '@/lib/recyclers/certGate';
import { normalizeCreditType } from '@/lib/marketplace/creditTaxonomy';

export async function POST(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'manager', 'recycler'].includes(actor.role) && !actor.isAdmin) {
    return NextResponse.json({ error: 'Only recyclers or admins can list credits.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const recyclerId = String(body.recycler_id || '').trim();
  if (!recyclerId) {
    return NextResponse.json({ error: 'recycler_id is required' }, { status: 400 });
  }

  const db = adminClient();
  const { data: recycler } = await db
    .from('recyclers')
    .select('id, cpcb_cert_no, cpcb_cert_expiry, profile_id')
    .eq('id', recyclerId)
    .maybeSingle();

  if (!recycler) {
    return NextResponse.json({ error: 'Recycler not found' }, { status: 404 });
  }

  if (!actor.isAdmin && recycler.profile_id !== actor.userId) {
    return NextResponse.json({ error: 'You can only list credits for your own recycler profile.' }, { status: 403 });
  }

  const blocked = cpcbCertBlockReason(recycler.cpcb_cert_no, recycler.cpcb_cert_expiry);
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 409 });
  }

  const wasteCategory = String(body.waste_category || 'Plastic');
  const creditType = normalizeCreditType(wasteCategory, String(body.credit_type || 'CAT1'));
  const qtyKg = Number(body.quantity_available_kg || 0);

  const { data, error } = await db
    .from('credit_listings')
    .insert({
      recycler_id: recyclerId,
      waste_category: wasteCategory,
      credit_type: creditType,
      quantity_available_kg: qtyKg,
      quantity_available_mt: qtyKg / 1000,
      rate_per_kg_inr: Number(body.rate_per_kg_inr || 0),
      rate_per_mt_inr: Number(body.rate_per_kg_inr || 0) * 1000,
      min_order_kg: Number(body.min_order_kg || 1),
      min_order_mt: Number(body.min_order_kg || 1) / 1000,
      validity_date: body.validity_date || null,
      cpcb_cert_ref: body.cpcb_cert_ref || recycler.cpcb_cert_no,
      status: body.status || 'Active',
    })
    .select(
      'id, recycler_id, waste_category, credit_type, quantity_available_kg, quantity_available_mt, rate_per_kg_inr, rate_per_mt_inr, min_order_kg, min_order_mt, validity_date, cpcb_cert_ref, status, listed_at, expires_at'
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: data }, { status: 201 });
}
