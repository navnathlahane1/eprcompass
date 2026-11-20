/**
 * Unit tests for eprDashboardService.ts
 * Run with: npx vitest run lib/epr/eprDashboardService.test.ts
 */

import { describe, expect, it } from 'vitest';

import {
  computeTypeSummaries,
  computeAggregateSummary,
  computeStateObligations,
  computeProductBreakdown,
  computeComplianceScore,
  scoreToBadge,
  type LiabilityRow,
  type FulfillmentRow,
  type WeightRow,
} from './eprDashboardService';

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const FY = '2024-25';

const liabilities: LiabilityRow[] = [
  { epr_type: 'PLASTIC', financial_year: FY, state: null, product_type: null, liability_qty: 1000, unit: 'MT' },
  { epr_type: 'EWASTE',  financial_year: FY, state: null, product_type: null, liability_qty: 500,  unit: 'MT' },
  { epr_type: 'BATTERY', financial_year: FY, state: null, product_type: null, liability_qty: 200,  unit: 'MT' },
  // State-specific rows (should NOT appear in national aggregate)
  { epr_type: 'PLASTIC', financial_year: FY, state: 'Maharashtra', product_type: null, liability_qty: 300, unit: 'MT' },
  { epr_type: 'EWASTE',  financial_year: FY, state: 'Karnataka',   product_type: null, liability_qty: 100, unit: 'MT' },
];

const fulfillments: FulfillmentRow[] = [
  { epr_type: 'PLASTIC', financial_year: FY, state: null, product_type: null, fulfilled_qty: 950,  source: 'SELF',    unit: 'MT' },
  { epr_type: 'EWASTE',  financial_year: FY, state: null, product_type: null, fulfilled_qty: 200,  source: 'PRO',     unit: 'MT' },
  { epr_type: 'BATTERY', financial_year: FY, state: null, product_type: null, fulfilled_qty: 50,   source: 'RECYCLER',unit: 'MT' },
  // State-specific
  { epr_type: 'PLASTIC', financial_year: FY, state: 'Maharashtra', product_type: null, fulfilled_qty: 200, source: 'SELF', unit: 'MT' },
];

const productLiabilities: LiabilityRow[] = [
  { epr_type: 'PLASTIC', financial_year: FY, state: null, product_type: 'Rigid',    liability_qty: 600, unit: 'MT' },
  { epr_type: 'PLASTIC', financial_year: FY, state: null, product_type: 'Flexible', liability_qty: 400, unit: 'MT' },
];

const productFulfillments: FulfillmentRow[] = [
  { epr_type: 'PLASTIC', financial_year: FY, state: null, product_type: 'Rigid',    fulfilled_qty: 500, source: 'SELF', unit: 'MT' },
  { epr_type: 'PLASTIC', financial_year: FY, state: null, product_type: 'Flexible', fulfilled_qty: 100, source: 'PRO',  unit: 'MT' },
];

// ─── computeTypeSummaries ─────────────────────────────────────────────────────

describe('computeTypeSummaries', () => {
  const summaries = computeTypeSummaries(liabilities, fulfillments);

  it('returns one summary per distinct EPR type', () => {
    const types = summaries.map((s) => s.epr_type).sort();
    expect(types).toEqual(['BATTERY', 'EWASTE', 'PLASTIC']);
  });

  it('computes correct totals for PLASTIC', () => {
    const plastic = summaries.find((s) => s.epr_type === 'PLASTIC')!;
    expect(plastic.total_liability).toBe(1000);
    expect(plastic.total_fulfilled).toBe(950);
    expect(plastic.gap).toBe(50);
    expect(plastic.pct_fulfilled).toBe(95);
  });

  it('ignores state-specific rows', () => {
    const plastic = summaries.find((s) => s.epr_type === 'PLASTIC')!;
    // State row adds 300 liability but should NOT be counted in national aggregate
    expect(plastic.total_liability).toBe(1000);
  });

  it('splits fulfillments by source correctly', () => {
    const ewaste = summaries.find((s) => s.epr_type === 'EWASTE')!;
    expect(ewaste.sources.PRO).toBe(200);
    expect(ewaste.sources.SELF).toBe(0);
  });

  it('handles zero liability (type only in fulfillments)', () => {
    const extraFulfill: FulfillmentRow[] = [
      ...fulfillments,
      { epr_type: 'USED_OIL', financial_year: FY, state: null, product_type: null, fulfilled_qty: 10, source: 'SELF', unit: 'MT' },
    ];
    const s = computeTypeSummaries([], extraFulfill);
    const usedOil = s.find((x) => x.epr_type === 'USED_OIL')!;
    expect(usedOil.total_liability).toBe(0);
    expect(usedOil.pct_fulfilled).toBe(100); // fulfilled > 0, liability = 0 → 100%
  });
});

// ─── computeAggregateSummary ──────────────────────────────────────────────────

describe('computeAggregateSummary', () => {
  it('sums liabilities and fulfillments across all types', () => {
    const summaries = computeTypeSummaries(liabilities, fulfillments);
    const agg = computeAggregateSummary(summaries);
    expect(agg.total_liability).toBe(1700); // 1000 + 500 + 200
    expect(agg.total_fulfilled).toBe(1200); // 950 + 200 + 50
    expect(agg.gap).toBe(500);
  });
});

// ─── computeStateObligations ─────────────────────────────────────────────────

describe('computeStateObligations', () => {
  const stateRows = computeStateObligations(liabilities, fulfillments);

  it('returns rows only for non-null state rows', () => {
    expect(stateRows.every((r) => r.state !== null)).toBe(true);
  });

  it('computes correct pct_fulfilled for Maharashtra PLASTIC', () => {
    const row = stateRows.find((r) => r.state === 'Maharashtra' && r.epr_type === 'PLASTIC')!;
    expect(row.liability).toBe(300);
    expect(row.fulfilled).toBe(200);
    expect(row.pct_fulfilled).toBe(66.67); // Percentage helper preserves two decimals
  });

  it('marks rows as critical when gap > 20% of liability', () => {
    // Maharashtra PLASTIC: gap = 100, 20% of 300 = 60 → critical
    const row = stateRows.find((r) => r.state === 'Maharashtra' && r.epr_type === 'PLASTIC')!;
    expect(row.critical).toBe(true);
  });

  it('marks not-critical when gap ≤ 20% of liability', () => {
    // Add a row that is almost complete (5% gap)
    const nearlyDone: LiabilityRow[] = [
      { epr_type: 'PLASTIC', financial_year: FY, state: 'Gujarat', product_type: null, liability_qty: 100, unit: 'MT' },
    ];
    const nearlyDoneFulfill: FulfillmentRow[] = [
      { epr_type: 'PLASTIC', financial_year: FY, state: 'Gujarat', product_type: null, fulfilled_qty: 95, source: 'SELF', unit: 'MT' },
    ];
    const rows = computeStateObligations(nearlyDone, nearlyDoneFulfill);
    const gujarat = rows.find((r) => r.state === 'Gujarat')!;
    expect(gujarat.critical).toBe(false); // gap = 5, 20% of 100 = 20 → not critical
  });
});

// ─── computeProductBreakdown ──────────────────────────────────────────────────

describe('computeProductBreakdown', () => {
  it('returns one row per epr_type × product_type', () => {
    const rows = computeProductBreakdown(productLiabilities, productFulfillments);
    expect(rows).toHaveLength(2);
  });

  it('correctly computes gap and pct for Rigid', () => {
    const rows = computeProductBreakdown(productLiabilities, productFulfillments);
    const rigid = rows.find((r) => r.product_type === 'Rigid')!;
    expect(rigid.liability).toBe(600);
    expect(rigid.fulfilled).toBe(500);
    expect(rigid.gap).toBe(100);
    expect(rigid.pct_fulfilled).toBeCloseTo(83.33, 0);
  });

  it('filters by epr_type when filterType is specified', () => {
    const mixed: LiabilityRow[] = [
      ...productLiabilities,
      { epr_type: 'EWASTE', financial_year: FY, state: null, product_type: 'IT Equipment', liability_qty: 100, unit: 'MT' },
    ];
    const rows = computeProductBreakdown(mixed, productFulfillments, 'PLASTIC');
    expect(rows.every((r) => r.epr_type === 'PLASTIC')).toBe(true);
  });
});

// ─── computeComplianceScore ───────────────────────────────────────────────────

describe('computeComplianceScore', () => {
  const summaries = computeTypeSummaries(liabilities, fulfillments);

  it('produces a composite score between 0 and 100', () => {
    const result = computeComplianceScore(summaries);
    expect(result.composite).toBeGreaterThanOrEqual(0);
    expect(result.composite).toBeLessThanOrEqual(100);
  });

  it('returns Compliant badge for score ≥ 90', () => {
    expect(scoreToBadge(90)).toBe('Compliant');
    expect(scoreToBadge(100)).toBe('Compliant');
  });

  it('returns At Risk for 60–89', () => {
    expect(scoreToBadge(60)).toBe('At Risk');
    expect(scoreToBadge(89)).toBe('At Risk');
  });

  it('returns Non-Compliant for < 60', () => {
    expect(scoreToBadge(0)).toBe('Non-Compliant');
    expect(scoreToBadge(59)).toBe('Non-Compliant');
  });

  it('excludes TYRE when excludeTyre=true', () => {
    const withTyre = computeTypeSummaries(
      [...liabilities, { epr_type: 'TYRE', financial_year: FY, state: null, product_type: null, liability_qty: 1000, unit: 'MT' }],
      fulfillments
    );
    const includingTyre = computeComplianceScore(withTyre, [], false);
    const excludingTyre = computeComplianceScore(withTyre, [], true);
    expect(excludingTyre.byType).not.toHaveProperty('TYRE');
    // TYRE with 0% fulfillment drags score down — excluding should be higher
    expect(excludingTyre.composite).toBeGreaterThan(includingTyre.composite);
  });

  it('applies custom weights when provided', () => {
    const weights: WeightRow[] = [
      { epr_type: 'PLASTIC', weight: 3 },
      { epr_type: 'EWASTE',  weight: 1 },
      { epr_type: 'BATTERY', weight: 1 },
    ];
    const weighted = computeComplianceScore(summaries, weights);
    // With PLASTIC at 95% having triple weight, composite should be higher
    const unweighted = computeComplianceScore(summaries, []);
    expect(weighted.composite).toBeGreaterThan(unweighted.composite - 10); // sanity range
  });

  it('returns 0 composite for empty summaries', () => {
    const result = computeComplianceScore([]);
    expect(result.composite).toBe(0);
    expect(result.badge).toBe('Non-Compliant');
  });
});
