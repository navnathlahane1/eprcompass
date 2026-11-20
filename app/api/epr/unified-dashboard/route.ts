/**
 * GET /api/epr/unified-dashboard
 *
 * Returns a unified compliance view for one client + financial year:
 *   { categories, liabilityVsFulfillment, stateWise, productWise, complianceScore }
 *
 * Query params:
 *   clientId  – UUID (admin only; omit to use own session)
 *   year      – financial year, e.g. "2024-25" (required)
 *
 * @openapi
 * /api/epr/unified-dashboard:
 *   get:
 *     summary: Multi-EPR Unified Dashboard
 *     tags: [EPR Dashboard]
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: string, example: "2024-25" }
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Unified dashboard payload }
 *       401: { description: Unauthorized }
 *       400: { description: Missing year parameter }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import {
  computeTypeSummaries,
  computeAggregateSummary,
  computeStateObligations,
  computeProductBreakdown,
  computeComplianceScore,
} from '@/lib/epr/eprDashboardService';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function resolveActor(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdmin =
    ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return { userId: user.id, isAdmin, role: profile?.role ?? 'client' };
}

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveActor(req);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const year = sp.get('year');
    if (!year) return NextResponse.json({ error: 'year is required' }, { status: 400 });

    // Multi-tenancy: clients see only own data; admins may specify clientId
    const clientId = actor.isAdmin
      ? (sp.get('clientId') ?? actor.userId)
      : actor.userId;

    const db = adminClient();

    const [{ data: liabilities }, { data: fulfillments }, { data: weights }, { data: trends }] =
      await Promise.all([
        (db as any)
          .from('epr_liabilities')
          .select('epr_type, financial_year, state, product_type, liability_qty, unit')
          .eq('client_id', clientId)
          .eq('financial_year', year),
        (db as any)
          .from('epr_fulfillments')
          .select('epr_type, financial_year, state, product_type, fulfilled_qty, source, unit')
          .eq('client_id', clientId)
          .eq('financial_year', year),
        (db as any)
          .from('epr_client_weights')
          .select('epr_type, weight')
          .eq('client_id', clientId),
        // Last 6 months of cached composite scores for trend line
        (db as any)
          .from('epr_compliance_scores')
          .select('financial_year, score, computed_at')
          .eq('client_id', clientId)
          .is('epr_type', null)   // composite score rows have null epr_type
          .order('computed_at', { ascending: false })
          .limit(6),
      ]);

    const liab = liabilities ?? [];
    const fulfill = fulfillments ?? [];
    const wts = weights ?? [];

    const typeSummaries = computeTypeSummaries(liab, fulfill);
    const aggregate = computeAggregateSummary(typeSummaries);
    const stateWise = computeStateObligations(liab, fulfill);
    const productWise = computeProductBreakdown(liab, fulfill);
    const scoreResult = computeComplianceScore(
      typeSummaries,
      wts,
      !FEATURE_FLAGS.TYRE_EPR_ENABLED
    );

    // Persist/refresh cached score (fire-and-forget; errors are non-fatal)
    void (async () => {
      try {
        await (db as any).from('epr_compliance_scores').upsert(
          {
            client_id: clientId,
            epr_type: null,
            financial_year: year,
            score: scoreResult.composite,
            computed_at: new Date().toISOString(),
          },
          { onConflict: 'client_id,epr_type,financial_year' }
        );
      } catch { /* ignore */ }
    })();

    return NextResponse.json({
      financial_year: year,
      categories: typeSummaries.map((s) => s.epr_type),
      liabilityVsFulfillment: {
        byType: typeSummaries,
        aggregate,
      },
      stateWise,
      productWise,
      complianceScore: {
        ...scoreResult,
        trend: (trends ?? []).map((t: any) => ({
          financial_year: t.financial_year,
          score: t.score,
          computed_at: t.computed_at,
        })),
      },
      meta: {
        tyre_enabled: FEATURE_FLAGS.TYRE_EPR_ENABLED,
        export_enabled: FEATURE_FLAGS.EPR_DASHBOARD_EXPORT_ENABLED,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
