/**
 * GET /api/taskmanager/exposure
 * Revenue & Liability Exposure Dashboard.
 * Estimates Environmental Compensation liability and revenue-at-risk.
 *
 * EC Rates (CPCB indicative):
 *   Plastic:  ₹10,000 / MT shortfall
 *   E-Waste:  ₹25,000 / MT shortfall
 *   Battery:  ₹15,000 / MT shortfall
 *   Tyre:     ₹8,000  / MT shortfall
 *   Used Oil: ₹5,000  / MT shortfall
 *   Hazardous:₹30,000 / MT shortfall
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

const EC_RATE: Record<string, number> = {
  plastic_extended:      10_000,
  ewaste_extended:       25_000,
  battery_extended:      15_000,
  tyre_extended:          8_000,
  used_oil:               5_000,
  hazardous_waste:       30_000,
  governance:                 0,
  reporting_disclosures:      0,
};

// Revenue at risk per certificate: rough estimate based on typical client cert fee
const AVG_CERT_REVENUE = 50_000; // ₹50,000 per EPR certificate per client per year

export async function GET(_req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // ── 1. Overdue EPR tasks by category ─────────────────────────────────────
  const { data: eprTasks } = await db
    .from('client_epr_tasks')
    .select('client_id, waste_category, status, due_date, priority')
    .not('status', 'in', '("completed","cancelled","na","skipped")');

  // ── 2. Overdue filings ────────────────────────────────────────────────────
  const { data: filings } = await db
    .from('epr_filing_statuses')
    .select('id, client_id, category, current_status, sla_due_at, fy_label')
    .not('current_status', 'in', '("Approved","Certificate Issued","Rejected")');

  // ── 3. Service requests stale ─────────────────────────────────────────────
  const { data: srqs } = await db
    .from('service_requests')
    .select('id, client_id, status, created_at, updated_at')
    .not('status', 'in', '("closed","rejected","cancelled")');

  // ── 4. Client companies ───────────────────────────────────────────────────
  const { data: clients } = await db
    .from('clients')
    .select('id, name, waste_categories, assigned_manager_id')
    .not('waste_categories', 'is', null);

  const allEpr  = eprTasks  ?? [];
  const allFil  = filings   ?? [];
  const allSr   = srqs      ?? [];
  const allClients = clients ?? [];

  // ── 5. Per-category exposure ──────────────────────────────────────────────
  const categories = Object.keys(EC_RATE).filter(k => EC_RATE[k] > 0).map(cat => {
    const catTasks = allEpr.filter(t => t.waste_category === cat);
    const overdue  = catTasks.filter(t =>
      t.status === 'overdue' ||
      (t.due_date && t.due_date < todayStr && t.status !== 'completed')
    );
    const affected_clients = new Set(overdue.map(t => t.client_id)).size;

    // Estimate MT shortfall: 1 overdue critical task = 5MT, high = 3MT, others = 1MT
    const est_shortfall_mt = overdue.reduce((s, t) => {
      return s + (t.priority === 'critical' ? 5 : t.priority === 'high' ? 3 : 1);
    }, 0);
    const est_ec_liability = est_shortfall_mt * EC_RATE[cat];

    return {
      category:         cat,
      label:            cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      ec_rate_per_mt:   EC_RATE[cat],
      overdue_tasks:    overdue.length,
      affected_clients,
      est_shortfall_mt,
      est_ec_liability,
      risk_level:       overdue.length === 0 ? 'none'
        : affected_clients >= 5 ? 'critical'
        : affected_clients >= 2 ? 'high'
        : 'medium',
    };
  });

  // ── 6. Revenue at risk (certificates expiring, not renewed) ───────────────
  const overdueFilings = allFil.filter(f => f.sla_due_at && f.sla_due_at < now.toISOString());
  const atRiskClients  = new Set(overdueFilings.map(f => f.client_id)).size;
  const revenue_at_risk = atRiskClients * AVG_CERT_REVENUE;

  // ── 7. Per-client top risks ───────────────────────────────────────────────
  const clientMap: Record<string, {
    overdue_epr: number; overdue_filings: number;
    est_liability: number; stale_sr: number;
  }> = {};

  for (const t of allEpr) {
    if (t.status !== 'overdue' && !(t.due_date && t.due_date < todayStr)) continue;
    const c = clientMap[t.client_id] ??= { overdue_epr: 0, overdue_filings: 0, est_liability: 0, stale_sr: 0 };
    c.overdue_epr++;
    c.est_liability += EC_RATE[t.waste_category] ?? 0;
  }
  for (const f of overdueFilings) {
    const c = clientMap[f.client_id] ??= { overdue_epr: 0, overdue_filings: 0, est_liability: 0, stale_sr: 0 };
    c.overdue_filings++;
  }
  for (const s of allSr) {
    const age = (now.getTime() - new Date(s.updated_at || s.created_at).getTime()) / 3_600_000;
    if (age > 48) {
      const c = clientMap[s.client_id] ??= { overdue_epr: 0, overdue_filings: 0, est_liability: 0, stale_sr: 0 };
      c.stale_sr++;
    }
  }

  // Enrich with client names + manager names + categories
  const riskClientIds = Object.keys(clientMap);
  const { data: clientRows } = riskClientIds.length
    ? await db.from('clients')
        .select('id, name, assigned_manager_id, waste_categories')
        .in('id', riskClientIds)
    : { data: [] };

  // Fetch manager names
  const managerIds = [...new Set((clientRows ?? []).map((c: any) => c.assigned_manager_id).filter(Boolean))];
  const { data: managerProfiles } = managerIds.length
    ? await db.from('profiles').select('id, full_name').in('id', managerIds)
    : { data: [] };
  const mgrMap: Record<string, string> = {};
  for (const p of managerProfiles ?? []) mgrMap[(p as any).id] = (p as any).full_name ?? 'Unknown';

  const cInfoMap: Record<string, { name: string; manager_name: string | null; categories: string[] }> = {};
  for (const c of clientRows ?? []) {
    cInfoMap[(c as any).id] = {
      name:         (c as any).name,
      manager_name: (c as any).assigned_manager_id ? (mgrMap[(c as any).assigned_manager_id] ?? null) : null,
      categories:   (c as any).waste_categories ?? [],
    };
  }

  const top_risk_clients = Object.entries(clientMap)
    .map(([id, d]) => ({
      id,                                               // page expects 'id'
      client_name:    cInfoMap[id]?.name ?? 'Unknown',
      manager_name:   cInfoMap[id]?.manager_name ?? null,
      categories:     cInfoMap[id]?.categories ?? [],
      overdue_epr:    d.overdue_epr,
      overdue_filings: d.overdue_filings,
      est_ec_exposure: d.est_liability,                // page expects 'est_ec_exposure'
      risk_score:     d.overdue_epr * 2 + d.overdue_filings * 3 + d.stale_sr,
    }))
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 20);

  // ── 8. Summary ────────────────────────────────────────────────────────────
  const total_ec_liability   = categories.reduce((s, c) => s + c.est_ec_liability, 0);
  const critical_categories  = categories.filter(c => c.risk_level === 'critical').length;

  return NextResponse.json({
    categories,
    top_risk_clients,
    summary: {
      total_overdue_epr_tasks: allEpr.filter(t =>
        t.status === 'overdue' || (t.due_date && t.due_date < todayStr)
      ).length,
      total_overdue_filings:   overdueFilings.length,
      clients_at_risk:         atRiskClients,
      total_ec_liability,                               // page expects this name
      critical_categories,                              // page expects this
      revenue_at_risk,
      stale_service_requests: allSr.filter(s => {
        const age = (now.getTime() - new Date(s.updated_at || s.created_at).getTime()) / 3_600_000;
        return age > 48;
      }).length,
    },
  });
}
