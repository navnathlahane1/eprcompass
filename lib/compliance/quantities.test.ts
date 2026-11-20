import { describe, expect, it, vi } from 'vitest';
import { sumMassTonnes, assertNonOverlappingLiabilities } from './quantities';
vi.mock('@/lib/supabase/createServerComponentClient', () => ({ createServerComponentClient: vi.fn() }));
import { calculateObligation } from './index';

describe('recorded mass quantities', () => {
  it('converts kilograms to tonnes without treating records as mass', () => {
    expect(sumMassTonnes([{ quantity: 500, unit: 'KG' }, { quantity: '2', unit: 'MT' }])).toBe(2.5);
  });
  it.each(['KL', 'UNITS', ''])('rejects unsupported mass conversion from %s', unit => {
    expect(() => sumMassTonnes([{ quantity: 5, unit }])).toThrow();
  });
  it.each([-1, NaN, Infinity])('rejects invalid quantity %s', quantity => {
    expect(() => sumMassTonnes([{ quantity, unit: 'MT' }])).toThrow();
  });
  it('rejects national totals mixed with state detail', () => {
    expect(() => assertNonOverlappingLiabilities([{ quantity: 5, unit: 'MT' }, { quantity: 2, unit: 'MT', state: 'MH' }])).toThrow();
  });
  it('allows disjoint state and product detail', () => {
    expect(() => assertNonOverlappingLiabilities([
      { quantity: 5, unit: 'MT', state: 'MH', product_type: 'Rigid' },
      { quantity: 2, unit: 'MT', state: 'MH', product_type: 'Flexible' },
    ])).not.toThrow();
  });
});

function database(liabilities: object[], fulfillments: object[], error: object | null = null) {
  const queries: Record<string, any> = {};
  const from = vi.fn((table: string) => {
    const result = table === 'clients' ? { data: { profile_id: 'owner-profile' }, error: null }
      : { data: table === 'epr_liabilities' ? liabilities : fulfillments, error };
    const q: any = { select: vi.fn(() => q), eq: vi.fn(() => q), maybeSingle: vi.fn(async () => result), then: (resolve: any) => Promise.resolve(result).then(resolve) };
    queries[table] = q;
    return q;
  });
  return { from, queries };
}

describe('obligation data contract', () => {
  it('uses the owner profile and category/year scope; does not infer certificate holdings', async () => {
    const db = database([{ liability_qty: 3000, unit: 'KG' }], [{ fulfilled_qty: 1, unit: 'MT' }]);
    const result = await calculateObligation('client-row', 'Plastic', '2026-27', db as any);
    expect(result).toMatchObject({ obligated_mt: 3, fulfilled_mt: 1, gap_mt: 2, credits_held: null, credits_required: null });
    expect(db.queries.epr_liabilities.eq).toHaveBeenCalledWith('client_id', 'owner-profile');
    expect(db.queries.epr_liabilities.eq).toHaveBeenCalledWith('epr_type', 'PLASTIC');
    expect(db.queries.epr_liabilities.eq).toHaveBeenCalledWith('financial_year', '2026-27');
    expect(db.from).not.toHaveBeenCalledWith('services');
    expect(db.from).not.toHaveBeenCalledWith('obligations');
  });
  it('does not present absent baseline as zero obligation', async () => {
    await expect(calculateObligation('client', 'Plastic', '2026-27', database([], []) as any)).rejects.toThrow('baseline');
  });
  it('reports query failures', async () => {
    await expect(calculateObligation('client', 'Plastic', '2026-27', database([], [], { message: 'offline' }) as any)).rejects.toThrow('unavailable');
  });
  it.each(['2026-30', 'invalid', '2026-2025'])('rejects malformed financial year %s', async fy => {
    await expect(calculateObligation('client', 'Plastic', fy, database([], []) as any)).rejects.toThrow();
  });
});
