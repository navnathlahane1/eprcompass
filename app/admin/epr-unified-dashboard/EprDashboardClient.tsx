'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import EprDashboardSkeleton from '@/components/epr-dashboard/EprDashboardSkeleton';
import TyreEprComingSoonCard from '@/components/epr-dashboard/TyreEprComingSoonCard';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import type { EprType, ComplianceScoreResult } from '@/lib/epr/eprDashboardService';
import type { ComponentType } from 'react';

interface TrendPoint { financial_year: string; score: number; computed_at: string }

// Lazy-load heavy chart components
const LiabilityFulfillmentCard = dynamic(
  () => import('@/components/epr-dashboard/LiabilityFulfillmentCard'),
  { loading: () => <div className="h-64 rounded-xl bg-slate-900 animate-pulse" />, ssr: false }
);
const ComplianceScoreCard = dynamic(
  () => import('@/components/epr-dashboard/ComplianceScoreCard'),
  { loading: () => <div className="h-64 rounded-xl bg-slate-900 animate-pulse" />, ssr: false }
) as ComponentType<{ score: ComplianceScoreResult & { trend?: TrendPoint[] } }>;
// eslint-disable-next-line
const ComplianceScoreCardAny = ComplianceScoreCard as any;
const StateObligationsTable = dynamic(
  () => import('@/components/epr-dashboard/StateObligationsTable'),
  { ssr: false }
);
const ProductBreakdownTable = dynamic(
  () => import('@/components/epr-dashboard/ProductBreakdownTable'),
  { ssr: false }
);

/** Available financial years (current + previous 4) */
function getFinancialYears(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const y = current - i;
    return `${y}-${String(y + 1).slice(-2)}`;
  });
}

interface Props {
  clientId?: string;
  isAdmin?: boolean;
  role?: string;
}

export default function EprDashboardClient({ clientId, isAdmin = false, role }: Props) {
  const years = useMemo(getFinancialYears, []);
  const [year, setYear] = useState(years[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mainData, setMainData] = useState<any>(null);
  const [stateData, setStateData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);

  const base = useMemo(() => (clientId ? `?year=${year}&clientId=${clientId}` : `?year=${year}`), [year, clientId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [main, states, products] = await Promise.all([
        fetch(`/api/epr/unified-dashboard${base}`).then((r) => r.json()),
        fetch(`/api/epr/state-obligations${base}`).then((r) => r.json()),
        fetch(`/api/epr/product-breakdown${base}`).then((r) => r.json()),
      ]);
      if (main.error) throw new Error(main.error);
      setMainData(main);
      setStateData(states.state_obligations ?? []);
      setProductData(products.product_breakdown ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load EPR data');
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const canExport = role !== 'viewer';

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-md border border-slate-800 px-3 py-2 text-sm"
          aria-label="Select financial year"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {error && (
          <span className="rounded-md bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
            {error}
            <button onClick={load} className="ml-2 underline">Retry</button>
          </span>
        )}
      </div>

      {loading ? (
        <EprDashboardSkeleton />
      ) : !mainData || (!mainData.summaries?.length) ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 py-16 text-center">
          <p className="text-sm font-medium text-slate-400">No EPR data found for {year}</p>
          <p className="mt-1 text-xs text-slate-500">Upload your EPR liability and fulfillment data to see the unified dashboard.</p>
        </div>
      ) : (
        <>
          {/* Score + Liability row */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ComplianceScoreCardAny
              score={{
                composite: mainData.compliance_score?.composite ?? 0,
                badge: mainData.compliance_score?.badge ?? 'Non-Compliant',
                byType: mainData.compliance_score?.byType ?? ({} as Record<EprType, number>),
                trend: mainData.score_trend ?? [],
              }}
            />
            <LiabilityFulfillmentCard
              summaries={mainData.summaries ?? []}
              aggregate={mainData.aggregate ?? { total_liability: 0, total_fulfilled: 0, gap: 0, pct_fulfilled: 0 }}
            />
          </div>

          {/* State + Product row */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <StateObligationsTable rows={stateData} />
            <ProductBreakdownTable rows={productData} canExport={canExport} />
          </div>

          {/* Tyre EPR feature flag */}
          {!FEATURE_FLAGS.TYRE_EPR_ENABLED && <TyreEprComingSoonCard />}
        </>
      )}
    </div>
  );
}
