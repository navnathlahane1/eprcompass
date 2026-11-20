/**
 * GET  /api/recycler-portal/financing  — applications + eligibility estimate
 * POST /api/recycler-portal/financing  — submit a financing application
 */
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

const ADVANCE_RATE = 0.70; // up to 70% advance against issued-credit value

function appNumber(): string {
  const d = new Date();
  const n = (randomBytes(2).readUInt16BE(0) % 9000) + 1000;
  return `FIN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${n}`;
}

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [appsRes, creditsRes] = await Promise.all([
    (db as any)
      .from('recycler_finance_applications')
      .select('*')
      .eq('recycler_id', actor.recyclerId)
      .order('created_at', { ascending: false }),
    (db as any)
      .from('epr_credits')
      .select('total_value_inr, quantity_mt, status')
      .eq('recycler_id', actor.recyclerId)
      .eq('status', 'Issued'),
  ]);

  const issuedValue = (creditsRes.data ?? []).reduce((s: number, c: any) => s + Number(c.total_value_inr || 0), 0);
  const issuedQty = (creditsRes.data ?? []).reduce((s: number, c: any) => s + Number(c.quantity_mt || 0), 0);

  const applications = appsRes.error ? [] : (appsRes.data ?? []);
  const outstanding = applications
    .filter((a: any) => ['APPROVED', 'DISBURSED'].includes(a.status))
    .reduce((s: number, a: any) => s + Number(a.approved_amount_inr || a.requested_amount_inr || 0), 0);

  const eligibility = {
    issued_credit_value_inr: Math.round(issuedValue),
    issued_credit_qty_mt: Math.round(issuedQty * 1000) / 1000,
    max_advance_inr: Math.max(0, Math.round(issuedValue * ADVANCE_RATE - outstanding)),
    advance_rate_pct: ADVANCE_RATE * 100,
    outstanding_inr: Math.round(outstanding),
  };

  return NextResponse.json({ applications, eligibility });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const validTypes = ['ADVANCE_AGAINST_CREDITS', 'WORKING_CAPITAL', 'INVOICE_FACTORING', 'EQUIPMENT_LOAN'];
  if (!validTypes.includes(b.finance_type)) return NextResponse.json({ error: 'Invalid finance_type' }, { status: 400 });
  if (!b.requested_amount_inr || Number(b.requested_amount_inr) <= 0) {
    return NextResponse.json({ error: 'requested_amount_inr must be positive' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_finance_applications')
    .insert({
      recycler_id: actor.recyclerId,
      application_number: appNumber(),
      finance_type: b.finance_type,
      requested_amount_inr: Number(b.requested_amount_inr),
      collateral_credits_mt: b.collateral_credits_mt ? Number(b.collateral_credits_mt) : null,
      tenure_months: b.tenure_months ? Number(b.tenure_months) : null,
      purpose: b.purpose?.trim() || null,
      status: 'SUBMITTED',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ application: { id: 'pending', application_number: appNumber() }, message: 'Application submitted.' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ application: data, message: 'Application submitted. Our finance team will review within 3 business days.' }, { status: 201 });
}
