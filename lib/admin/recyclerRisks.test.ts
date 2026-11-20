import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadRecyclerRisks, mapRecyclerRisks } from './recyclerRisks';

describe('recorded recycler risks', () => {
  it('uses current schema fields, annualizes monthly capacity, and prefers latest recorded utilization', () => {
    const rows = mapRecyclerRisks([{ id: 'recycler', name: 'Recorded Name', state: 'MH', epr_categories: ['Plastic'], capacity_per_month: '12.5', current_utilization_percent: 40, risk_flag: 'High', risk_flags: ['Expired evidence', 12, 'Review required'] }], [
      { recycler_id: 'recycler', utilization_pct: 75 },
      { recycler_id: 'recycler', utilization_pct: 30 },
    ]);
    expect(rows).toEqual([{ id: 'recycler', company_name: 'Recorded Name', state: 'MH', waste_categories: ['Plastic'], capacity_mt_pa: 150, utilization_pct: 75, risk_flag: 'High', risk_reason: 'Expired evidence; Review required' }]);
  });
  it('preserves missing quantities as unknown and falls back to recorded profile utilization', () => {
    const rows = mapRecyclerRisks([{ id: 'missing', risk_flags: null }, { id: 'recorded', current_utilization_percent: 0, capacity_per_month: 0, risk_flags: { reason: 'Recorded review note' } }], [{ recycler_id: 'recorded', utilization_pct: null }]);
    expect(rows.find(row => row.id === 'missing')).toMatchObject({ capacity_mt_pa: null, utilization_pct: null, risk_flag: 'None', risk_reason: '', waste_categories: [] });
    expect(rows.find(row => row.id === 'recorded')).toMatchObject({ capacity_mt_pa: 0, utilization_pct: 0, risk_reason: 'Recorded review note' });
  });
  it('prioritizes risk before utilization and bounds the visible monitor', () => {
    const rows = mapRecyclerRisks([{ id: 'high', risk_flag: 'High', current_utilization_percent: 1 }, ...Array.from({ length: 10 }, (_, i) => ({ id: `low-${i}`, risk_flag: 'Low', current_utilization_percent: i }))], []);
    expect(rows).toHaveLength(8);
    expect(rows.slice(0, 2).map(row => row.id)).toEqual(['high', 'low-9']);
  });
  it.each(['recyclers', 'capacity'])('reports %s query errors rather than presenting complete fresh data', async failed => {
    const from = vi.fn((table: string) => ({ select: () => ({ order: vi.fn(async () => table === 'recyclers'
      ? { data: [{ id: 'one', current_utilization_percent: 42 }], error: failed === 'recyclers' ? { message: 'offline' } : null }
      : { data: null, error: failed === 'capacity' ? { message: 'offline' } : null }) }) }));
    const result = await loadRecyclerRisks({ from } as unknown as SupabaseClient);
    expect(result.error).toMatch(failed === 'recyclers' ? /could not be loaded/ : /showing recorded profile values/);
    expect(result.rows).toHaveLength(failed === 'recyclers' ? 0 : 1);
    if (failed === 'capacity') expect(result.rows[0].utilization_pct).toBe(42);
  });
});
