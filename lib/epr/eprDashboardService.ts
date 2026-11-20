/**
 * eprDashboardService.ts
 * Pure service-layer functions for the Multi-EPR Unified Dashboard.
 * Handles compliance score computation, liability vs fulfillment
 * aggregation, and state-wise/product-wise breakdowns.
 *
 * All functions are side-effect-free (no DB calls) — they operate on
 * pre-fetched row arrays. This makes unit-testing trivial.
 */

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type EprType = 'PLASTIC' | 'EWASTE' | 'BATTERY' | 'USED_OIL' | 'TYRE';

export interface LiabilityRow {
  epr_type: EprType;
  financial_year: string;
  state: string | null;
  product_type: string | null;
  liability_qty: number;
  unit: string;
}

export interface FulfillmentRow {
  epr_type: EprType;
  financial_year: string;
  state: string | null;
  product_type: string | null;
  fulfilled_qty: number;
  source: 'SELF' | 'PRO' | 'RECYCLER';
  unit: string;
}

export interface WeightRow {
  epr_type: EprType;
  weight: number;
}

/** Aggregated liability vs fulfillment for a single EPR type. */
export interface EprTypeSummary {
  epr_type: EprType;
  label: string;
  unit: string;
  total_liability: number;
  total_fulfilled: number;
  gap: number;
  pct_fulfilled: number;   // 0–100
  sources: { SELF: number; PRO: number; RECYCLER: number };
}

/** Single state row in the state-wise obligations panel. */
export interface StateObligation {
  state: string;
  epr_type: EprType;
  liability: number;
  fulfilled: number;
  gap: number;
  pct_fulfilled: number;
  critical: boolean;  // gap > 20% of liability
}

/** Single product-type row for the product breakdown panel. */
export interface ProductBreakdown {
  epr_type: EprType;
  product_type: string;
  liability: number;
  fulfilled: number;
  gap: number;
  pct_fulfilled: number;
  unit: string;
}

/** Final composite compliance score payload. */
export interface ComplianceScoreResult {
  composite: number;           // 0–100
  byType: Record<EprType, number>;
  trend: null;                 // populated separately from cached scores
  badge: 'Compliant' | 'At Risk' | 'Non-Compliant';
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const EPR_TYPE_LABELS: Record<EprType, string> = {
  PLASTIC:  'Plastic EPR',
  EWASTE:   'E-Waste EPR',
  BATTERY:  'Battery EPR',
  USED_OIL: 'Used Oil EPR',
  TYRE:     'Tyre EPR',
};

/** Product sub-types for each EPR category (display use). */
export const EPR_PRODUCT_TYPES: Record<EprType, string[]> = {
  PLASTIC:  ['Rigid', 'Flexible', 'Multi-layer', 'PET', 'Other'],
  EWASTE:   ['IT Equipment', 'Consumer Electronics', 'Telecom', 'Electrical', 'Other'],
  BATTERY:  ['Portable', 'Industrial', 'EV', 'Automotive', 'Other'],
  USED_OIL: ['Lubricating Oil', 'Industrial Oil', 'Transformer Oil', 'Other'],
  TYRE:     ['Passenger Car', 'Truck/Bus', 'Two-Wheeler', 'OTR', 'Other'],
};

const DEFAULT_WEIGHT = 1.0;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function pct(fulfilled: number, liability: number): number {
  if (!liability) return fulfilled > 0 ? 100 : 0;
  return Math.min(100, Math.round((fulfilled / liability) * 10000) / 100);
}

/** Determine compliance badge from composite score. */
export function scoreToBadge(
  score: number
): 'Compliant' | 'At Risk' | 'Non-Compliant' {
  if (score >= 90) return 'Compliant';
  if (score >= 60) return 'At Risk';
  return 'Non-Compliant';
}

// ─── 1. LIABILITY VS FULFILLMENT ─────────────────────────────────────────────

/**
 * Aggregates raw liability and fulfillment rows into per-EPR-type summaries.
 * State and product_type are ignored (national aggregate).
 */
export function computeTypeSummaries(
  liabilities: LiabilityRow[],
  fulfillments: FulfillmentRow[]
): EprTypeSummary[] {
  // Sum liabilities per type (national: state = null)
  const liabMap = new Map<EprType, { qty: number; unit: string }>();
  for (const row of liabilities) {
    if (row.state !== null) continue; // national rows only here
    const cur = liabMap.get(row.epr_type) ?? { qty: 0, unit: row.unit };
    cur.qty += Number(row.liability_qty);
    liabMap.set(row.epr_type, cur);
  }

  // Sum fulfillments per type × source
  const fulfillMap = new Map<
    EprType,
    { total: number; SELF: number; PRO: number; RECYCLER: number }
  >();
  for (const row of fulfillments) {
    if (row.state !== null) continue;
    const cur = fulfillMap.get(row.epr_type) ?? { total: 0, SELF: 0, PRO: 0, RECYCLER: 0 };
    cur.total += Number(row.fulfilled_qty);
    cur[row.source] = (cur[row.source] ?? 0) + Number(row.fulfilled_qty);
    fulfillMap.set(row.epr_type, cur);
  }

  const types = Array.from(new Set([
    ...Array.from(liabMap.keys()),
    ...Array.from(fulfillMap.keys()),
  ])) as EprType[];

  return types.map((epr_type) => {
    const liabEntry = liabMap.get(epr_type) ?? { qty: 0, unit: 'MT' };
    const fulfillEntry = fulfillMap.get(epr_type) ?? { total: 0, SELF: 0, PRO: 0, RECYCLER: 0 };
    const total_liability = liabEntry.qty;
    const total_fulfilled = fulfillEntry.total;
    const gap = Math.max(0, total_liability - total_fulfilled);
    return {
      epr_type,
      label: EPR_TYPE_LABELS[epr_type] ?? epr_type,
      unit: liabEntry.unit,
      total_liability,
      total_fulfilled,
      gap,
      pct_fulfilled: pct(total_fulfilled, total_liability),
      sources: {
        SELF: fulfillEntry.SELF,
        PRO: fulfillEntry.PRO,
        RECYCLER: fulfillEntry.RECYCLER,
      },
    };
  });
}

/** Aggregate row (sum across all types, heterogeneous units shown as count). */
export function computeAggregateSummary(
  summaries: EprTypeSummary[]
): { total_liability: number; total_fulfilled: number; gap: number; pct_fulfilled: number } {
  const tl = summaries.reduce((a, s) => a + s.total_liability, 0);
  const tf = summaries.reduce((a, s) => a + s.total_fulfilled, 0);
  return {
    total_liability: tl,
    total_fulfilled: tf,
    gap: Math.max(0, tl - tf),
    pct_fulfilled: pct(tf, tl),
  };
}

// ─── 2. STATE-WISE OBLIGATIONS ───────────────────────────────────────────────

export function computeStateObligations(
  liabilities: LiabilityRow[],
  fulfillments: FulfillmentRow[]
): StateObligation[] {
  // Group by (state, epr_type) — exclude national (null) rows
  const key = (state: string, type: EprType) => `${state}||${type}`;

  const liabMap = new Map<string, number>();
  for (const row of liabilities) {
    if (!row.state) continue;
    const k = key(row.state, row.epr_type);
    liabMap.set(k, (liabMap.get(k) ?? 0) + Number(row.liability_qty));
  }

  const fulfillMap = new Map<string, number>();
  for (const row of fulfillments) {
    if (!row.state) continue;
    const k = key(row.state, row.epr_type);
    fulfillMap.set(k, (fulfillMap.get(k) ?? 0) + Number(row.fulfilled_qty));
  }

  const results: StateObligation[] = [];
  for (const [k, liability] of Array.from(liabMap.entries())) {
    const [state, epr_type] = k.split('||') as [string, EprType];
    const fulfilled = fulfillMap.get(k) ?? 0;
    const gap = Math.max(0, liability - fulfilled);
    const pctFulfilled = pct(fulfilled, liability);
    results.push({
      state,
      epr_type,
      liability,
      fulfilled,
      gap,
      pct_fulfilled: pctFulfilled,
      critical: liability > 0 && gap / liability > 0.2,
    });
  }

  return results;
}

// ─── 3. PRODUCT-WISE BREAKDOWN ────────────────────────────────────────────────

export function computeProductBreakdown(
  liabilities: LiabilityRow[],
  fulfillments: FulfillmentRow[],
  filterType?: EprType
): ProductBreakdown[] {
  const liabMap = new Map<string, { qty: number; unit: string }>();
  for (const row of liabilities) {
    if (!row.product_type) continue;
    if (filterType && row.epr_type !== filterType) continue;
    const k = `${row.epr_type}||${row.product_type}`;
    const cur = liabMap.get(k) ?? { qty: 0, unit: row.unit };
    cur.qty += Number(row.liability_qty);
    liabMap.set(k, cur);
  }

  const fulfillMap = new Map<string, number>();
  for (const row of fulfillments) {
    if (!row.product_type) continue;
    if (filterType && row.epr_type !== filterType) continue;
    const k = `${row.epr_type}||${row.product_type}`;
    fulfillMap.set(k, (fulfillMap.get(k) ?? 0) + Number(row.fulfilled_qty));
  }

  const results: ProductBreakdown[] = [];
  for (const [k, liabEntry] of Array.from(liabMap.entries())) {
    const [epr_type, product_type] = k.split('||') as [EprType, string];
    const liability = liabEntry.qty;
    const fulfilled = fulfillMap.get(k) ?? 0;
    const gap = Math.max(0, liability - fulfilled);
    results.push({
      epr_type,
      product_type,
      liability,
      fulfilled,
      gap,
      pct_fulfilled: pct(fulfilled, liability),
      unit: liabEntry.unit,
    });
  }

  return results.sort((a, b) => b.gap - a.gap);
}

// ─── 4. COMPLIANCE SCORE ─────────────────────────────────────────────────────

/**
 * Computes weighted composite compliance score (0–100).
 *
 * @param summaries   - Per-type summaries (from computeTypeSummaries)
 * @param weights     - Optional per-type weights from epr_client_weights table
 * @param excludeTyre - Skip TYRE when feature flag is disabled
 */
export function computeComplianceScore(
  summaries: EprTypeSummary[],
  weights: WeightRow[] = [],
  excludeTyre = true
): ComplianceScoreResult {
  const weightMap = new Map<EprType, number>(
    weights.map((w) => [w.epr_type, Number(w.weight)])
  );

  const active = summaries.filter(
    (s) => !(excludeTyre && s.epr_type === 'TYRE')
  );

  let weightedSum = 0;
  let totalWeight = 0;
  const byType: Record<string, number> = {};

  for (const s of active) {
    const w = weightMap.get(s.epr_type) ?? DEFAULT_WEIGHT;
    const typeScore = pct(s.total_fulfilled, s.total_liability);
    byType[s.epr_type] = typeScore;
    weightedSum += typeScore * w;
    totalWeight += w;
  }

  const composite = totalWeight === 0
    ? 0
    : Math.round((weightedSum / totalWeight) * 100) / 100;

  return {
    composite,
    byType: byType as Record<EprType, number>,
    trend: null,
    badge: scoreToBadge(composite),
  };
}
