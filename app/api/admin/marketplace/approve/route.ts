import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { checkPriceAlerts } from '@/lib/marketplace/price-alerts';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function isAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return ['admin', 'manager'].includes(profile?.role || '');
}

export async function POST(request: Request) {
  if (!(await isAdminManager())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const transactionId = String(body?.transactionId || '').trim();

  if (!transactionId) {
    return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { error: approveError } = await (supabase as any)
      .rpc('approve_credit_transaction', {
        p_transaction_id: transactionId,
        p_cpcb_transfer_ref: null,
        p_notes: 'Approved from marketplace approval API'
      });

    if (approveError) {
      return NextResponse.json({ error: approveError.message || 'Failed to approve transaction' }, { status: 400 });
    }

    const { data: tx } = await (supabase as any)
      .from('credit_transactions')
      .select('id, waste_category, agreed_rate_per_kg_inr, agreed_rate_inr, status')
      .eq('id', transactionId)
      .maybeSingle();

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found after approval' }, { status: 404 });
    }

    const ratePerKg = Number(tx.agreed_rate_per_kg_inr || 0) || (Number(tx.agreed_rate_inr || 0) / 1000);
    const alerts = await checkPriceAlerts(String(tx.waste_category), ratePerKg);

    return NextResponse.json({
      ok: true,
      transactionId,
      status: tx.status,
      alertsTriggered: alerts.triggered
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
