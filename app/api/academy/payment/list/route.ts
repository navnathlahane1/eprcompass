import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, resolveAcademyActor } from '../../_shared';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url    = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const limit  = Math.min(Number(url.searchParams.get('limit') ?? 200), 500);

  const db = getServiceClient();

  let query = db
    .from('academy_payments')
    .select(
      'id, razorpay_order_id, razorpay_payment_id, participant_name, participant_email, organization, program_title, subtotal_inr, gst_amount_inr, total_inr, discount_inr, promo_code, partner_code, status, created_at, paid_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    console.error('[academy/payment/list]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch payments' }, { status: 500 });
  }

  return NextResponse.json({ success: true, payments: data ?? [] });
}
