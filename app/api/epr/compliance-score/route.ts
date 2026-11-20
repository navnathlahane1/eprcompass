/**
 * GET /api/epr/compliance-score
 *
 * Returns the live compliance score + last-6-months trend for one client.
 *
 * @openapi
 * /api/epr/compliance-score:
 *   get:
 *     summary: EPR compliance score + trend
 *     tags: [EPR Dashboard]
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import {
  computeTypeSummaries,
  computeComplianceScore,
} from '@/lib/epr/eprDashboardService';

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
    const db = adminClient();

    const [{ data: liabilities }, { data: fulfillments }, { data: weights }, { data: cached }] =
      await Promise.all([
        (db as any)
          .from('epr_liabilities')
          .select('epr_type, financial_year, state, product_type, liability_qty, unit')
          .eq('client_id', clientId)
          .eq('financial_year', year)
          .is('state', null),
        (db as any)
          .from('epr_fulfillments')
          .select('epr_type, financial_year, state, product_type, fulfilled_qty, source, unit')
          .eq('client_id', clientId)
          .eq('financial_year', year)
          .is('state', null),
        (db as any)
          .from('epr_client_weights')
          .select('epr_type, weight')
          .eq('client_id', clientId),
        // Historical scores for trend (last 6 FY entries)
        (db as any)
          .from('epr_compliance_scores')
          .select('financial_year, epr_type, score, computed_at')
          .eq('client_id', clientId)
          .is('epr_type', null)
          .order('computed_at', { ascending: false })
          .limit(6),
      ]);

    const summaries = computeTypeSummaries(liabilities ?? [], fulfillments ?? []);
    const result = computeComplianceScore(
      summaries,
      weights ?? [],
      !FEATURE_FLAGS.TYRE_EPR_ENABLED
    );

    return NextResponse.json({
      financial_year: year,
      composite: result.composite,
      badge: result.badge,
      byType: result.byType,
      trend: (cached ?? []).map((t: any) => ({
        financial_year: t.financial_year,
        score: Number(t.score),
        computed_at: t.computed_at,
      })).reverse(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
