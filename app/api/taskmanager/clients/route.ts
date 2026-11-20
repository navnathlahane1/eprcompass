/**
 * GET /api/taskmanager/clients
 * Client Health Monitor — composite health score for every client.
 *
 * Health score (0–100):
 *   EPR task completion %   × 40
 *   Filing SLA adherence    × 30
 *   No overdue tasks ratio  × 20
 *   SR responsiveness       × 10
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

function healthTier(score: number): string {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'at_risk';
  if (score >= 40) return 'poor';
  return 'critical';
}

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const { searchParams } = new URL(req.url);
  const tier   = searchParams.get('tier')   ?? '';
  const search = searchParams.get('search') ?? '';

  // ── 1. All clients ────────────────────────────────────────────────────────
  const { data: clients } = await db
    .from('clients')
    .select('id, name, assigned_manager_id, waste_categories, created_at')
    .order('name');

  if (!clients?.length) {
    return NextResponse.json({ clients: [], summary: { total: 0, healthy: 0, at_risk: 0, poor: 0, critical: 0, unassigned: 0 } });
  }

  const clientIds = clients.map(c => c.id);

  // ── 2. Parallel data fetch ────────────────────────────────────────────────
  const [eprRes, filRes, srRes, ptRes, manRes] = await Promise.all([
    db.from('client_epr_tasks')
      .select('client_id, status, due_date, priority')
      .in('client_id', clientIds),
    db.from('epr_filing_statuses')
      .select('client_id, current_status, sla_due_at')
      .in('client_id', clientIds),
    db.from('service_requests')
      .select('client_id, status, updated_at, created_at')
      .in('client_id', clientIds)
      .not('status', 'in', '("closed","rejected","cancelled")'),
    db.from('portal_tasks')
      .select('client_id, status, due_at')
      .in('client_id', clientIds)
      .not('status', 'in', '("cancelled","done","completed","resolved")'),
    db.from('profiles')
      .select('id, full_name')
      .in('role', ['manager'])
  ]);

  const eprTasks = eprRes.data ?? [];
  const filings  = filRes.data ?? [];
  const srqs     = srRes.data ?? [];
  const ptTasks  = ptRes.data ?? [];
  const managers = manRes.data ?? [];

  const manMap: Record<string, string> = {};
  for (const m of managers) manMap[m.id] = m.full_name ?? 'Unknown';

  // ── 3. Per-client health calculation ─────────────────────────────────────
  const enriched = clients.map(c => {
    // --- EPR tasks ---
    const myEpr   = eprTasks.filter(t => t.client_id === c.id);
    const eprTotal = myEpr.length;
    const eprDone  = myEpr.filter(t => t.status === 'completed').length;
    const eprOvd   = myEpr.filter(t =>
      t.status === 'overdue' ||
      (t.due_date && t.due_date < todayStr && t.status !== 'completed')
    ).length;
    const epr_pct  = eprTotal ? Math.round((eprDone / eprTotal) * 100) : 100;

    // --- Filings ---
    const myFil     = filings.filter(f => f.client_id === c.id);
    const filTotal  = myFil.length;
    const filOvd    = myFil.filter(f => f.sla_due_at && f.sla_due_at < now.toISOString()).length;
    const fil_pct   = filTotal ? Math.round(((filTotal - filOvd) / filTotal) * 100) : 100;

    // --- Portal tasks (open, overdue) ---
    const myPt  = ptTasks.filter(t => t.client_id === c.id);
    const ptOvd = myPt.filter(t => t.due_at && t.due_at < now.toISOString()).length;
    const no_ovd_pct = myPt.length
      ? Math.round(((myPt.length - ptOvd) / myPt.length) * 100) : 100;

    // --- Service requests (stale) ---
    const mySr   = srqs.filter(s => s.client_id === c.id);
    const srStale = mySr.filter(s => {
      const age = (now.getTime() - new Date(s.updated_at || s.created_at).getTime()) / 3_600_000;
      return age > 48;
    }).length;
    const sr_pct = mySr.length ? Math.round(((mySr.length - srStale) / mySr.length) * 100) : 100;

    // --- Composite health score ---
    const score = Math.round(
      epr_pct  * 0.40 +
      fil_pct  * 0.30 +
      no_ovd_pct * 0.20 +
      sr_pct   * 0.10
    );

    const days_since_activity = ptRes.data
      ? (() => {
          const recent = myPt
            .map(t => t.due_at)
            .filter(Boolean)
            .sort()
            .pop();
          return recent ? Math.floor((now.getTime() - new Date(recent).getTime()) / 86_400_000) : null;
        })()
      : null;

    return {
      id:    c.id,
      name:  c.name,
      manager_id:   c.assigned_manager_id,
      manager_name: c.assigned_manager_id ? (manMap[c.assigned_manager_id] ?? 'Unknown') : null,
      waste_categories: c.waste_categories ?? [],
      created_at: c.created_at,
      health_score: score,
      health_tier:  healthTier(score),
      epr: { total: eprTotal, completed: eprDone, overdue: eprOvd, pct: epr_pct },
      filings: { total: filTotal, overdue: filOvd, pct: fil_pct },
      portal_tasks: { open: myPt.length, overdue: ptOvd },
      service_requests: { open: mySr.length, stale: srStale },
      days_since_activity,
    };
  });

  // ── 4. Apply filters ──────────────────────────────────────────────────────
  let filtered = enriched;
  if (tier)   filtered = filtered.filter(c => c.health_tier === tier);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.manager_name ?? '').toLowerCase().includes(q)
    );
  }

  // Sort: critical first, then score ascending within each tier
  filtered.sort((a, b) => a.health_score - b.health_score);

  // ── 5. Summary ────────────────────────────────────────────────────────────
  const summary = {
    total:      enriched.length,
    healthy:    enriched.filter(c => c.health_tier === 'healthy').length,
    at_risk:    enriched.filter(c => c.health_tier === 'at_risk').length,
    poor:       enriched.filter(c => c.health_tier === 'poor').length,
    critical:   enriched.filter(c => c.health_tier === 'critical').length,
    unassigned: enriched.filter(c => !c.manager_id).length,
    avg_score:  enriched.length
      ? Math.round(enriched.reduce((s, c) => s + c.health_score, 0) / enriched.length) : 0,
  };

  return NextResponse.json({ clients: filtered, summary });
}
