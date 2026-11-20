/**
 * GET /api/epr/state-obligations
 *
 * Returns state-wise EPR obligation detail for one client + year.
 * Supports optional category filter.
 *
 * @openapi
 * /api/epr/state-obligations:
 *   get:
 *     summary: State-wise EPR obligations
 *     tags: [EPR Dashboard]
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [PLASTIC, EWASTE, BATTERY, USED_OIL, TYRE] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { computeStateObligations } from '@/lib/epr/eprDashboardService';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await (supabase as any)
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    const isAdmin = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);

    const sp = req.nextUrl.searchParams;
    const year = sp.get('year');
    if (!year) return NextResponse.json({ error: 'year is required' }, { status: 400 });

    const clientId = isAdmin ? (sp.get('clientId') ?? user.id) : user.id;
    const category = sp.get('category') ?? undefined;

    const db = adminClient();

    let liabQ = (db as any)
      .from('epr_liabilities')
      .select('epr_type, state, product_type, liability_qty, unit, financial_year')
      .eq('client_id', clientId)
      .eq('financial_year', year)
      .not('state', 'is', null);

    let fulfillQ = (db as any)
      .from('epr_fulfillments')
      .select('epr_type, state, product_type, fulfilled_qty, source, unit, financial_year')
      .eq('client_id', clientId)
      .eq('financial_year', year)
      .not('state', 'is', null);

    if (category) {
      liabQ = liabQ.eq('epr_type', category);
      fulfillQ = fulfillQ.eq('epr_type', category);
    }

    const [{ data: liabilities }, { data: fulfillments }] = await Promise.all([liabQ, fulfillQ]);

    const rows = computeStateObligations(liabilities ?? [], fulfillments ?? []);

    return NextResponse.json({ financial_year: year, state_obligations: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
