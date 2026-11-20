import type { SupabaseClient } from '@supabase/supabase-js';

export function mapRecyclerRisks(recyclers: any[], capacity: any[]) {
  const latest = new Map<string, number>();
  for (const row of capacity) {
    if (!latest.has(row.recycler_id) && row.utilization_pct != null) latest.set(row.recycler_id, Number(row.utilization_pct));
  }
  const order: Record<string, number> = { None: 0, Low: 1, Medium: 2, High: 3 };
  return recyclers.map(row => {
    const flags = row.risk_flags;
    const reason = Array.isArray(flags) ? flags.filter(flag => typeof flag === 'string').join('; ')
      : typeof flags?.reason === 'string' ? flags.reason : '';
    return {
      id: row.id, company_name: row.name, state: row.state,
      waste_categories: row.epr_categories || [],
      capacity_mt_pa: row.capacity_per_month == null ? null : Number(row.capacity_per_month) * 12,
      utilization_pct: latest.get(row.id) ?? (row.current_utilization_percent == null ? null : Number(row.current_utilization_percent)),
      risk_flag: row.risk_flag || 'None', risk_reason: reason,
    };
  }).sort((a, b) => (order[b.risk_flag] || 0) - (order[a.risk_flag] || 0)
    || (b.utilization_pct ?? -1) - (a.utilization_pct ?? -1)).slice(0, 8);
}

export async function loadRecyclerRisks(db: SupabaseClient) {
  const [recyclers, capacity] = await Promise.all([
    db.from('recyclers').select('id, name, state, epr_categories, capacity_per_month, current_utilization_percent, risk_flag, risk_flags').order('created_at', { ascending: false }),
    db.from('recycler_capacity_log').select('recycler_id, month, utilization_pct').order('month', { ascending: false }),
  ]);
  if (recyclers.error) return { rows: [], error: 'Recycler risk records could not be loaded. Retry before relying on this monitor.' };
  return {
    rows: mapRecyclerRisks(recyclers.data || [], capacity.data || []),
    error: capacity.error ? 'Latest capacity updates are unavailable; showing recorded profile values.' : null,
  };
}
