/**
 * GET /api/taskmanager/compliance-intel
 * Compliance Intelligence Monitor for CCOO.
 * Per-category EPR obligation tracking, filing SLA status,
 * upcoming deadlines, Environmental Compensation risk flags.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

const EPR_CATEGORIES = [
  { key: 'plastic_extended',      label: 'Plastic EPR',     icon: '🔵', color: 'text-blue-400',    bar: 'bg-blue-500'    },
  { key: 'ewaste_extended',       label: 'E-Waste EPR',     icon: '🟣', color: 'text-purple-400',  bar: 'bg-purple-500'  },
  { key: 'battery_extended',      label: 'Battery EPR',     icon: '🟡', color: 'text-amber-400',   bar: 'bg-amber-500'   },
  { key: 'tyre_extended',         label: 'Tyre EPR',        icon: '🟢', color: 'text-green-400',   bar: 'bg-green-500'   },
  { key: 'used_oil',              label: 'Used Oil',        icon: '🟠', color: 'text-orange-400',  bar: 'bg-orange-500'  },
  { key: 'hazardous_waste',       label: 'Hazardous Waste', icon: '🔴', color: 'text-rose-400',    bar: 'bg-rose-500'    },
  { key: 'governance',            label: 'Governance',      icon: '⚫', color: 'text-slate-400',   bar: 'bg-slate-500'   },
  { key: 'reporting_disclosures', label: 'Reporting',       icon: '🔷', color: 'text-teal-400',    bar: 'bg-teal-500'    },
];

export async function GET(_req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 3_600_000);
  const in7  = new Date(now.getTime() +  7 * 24 * 3_600_000);

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [eprRes, filRes, srvRes] = await Promise.all([
    db.from('client_epr_tasks').select('waste_category, status, due_date, priority, client_id'),
    db.from('epr_filing_statuses').select('id, category, current_status, sla_due_at, fy_label, client_id'),
    db.from('service_requests').select('status, updated_at, created_at, request_type'),
  ]);

  const eprTasks = eprRes.data ?? [];
  const filings  = filRes.data ?? [];
  const srqs     = srvRes.data ?? [];

  // ── Per-category task stats ────────────────────────────────────────────────
  const categories = EPR_CATEGORIES.map(cat => {
    const tasks = eprTasks.filter(t => t.waste_category === cat.key);
    const total     = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue   = tasks.filter(t =>
      t.status === 'overdue' ||
      (t.due_date && new Date(t.due_date) < now && t.status !== 'completed')
    ).length;
    const in_prog   = tasks.filter(t => t.status === 'in_progress').length;
    const pending   = tasks.filter(t => t.status === 'pending').length;

    // Due within 7 days (not yet completed)
    const due_soon = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= now && d <= in7;
    }).length;

    // Due within 30 days
    const due_30 = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= now && d <= in30;
    }).length;

    const pct = total ? Math.round((completed / total) * 100) : 0;

    const risk: string = overdue > 5 ? 'critical'
      : overdue > 2                  ? 'high'
      : overdue > 0 || due_soon > 0  ? 'medium'
      : due_30  > 3                  ? 'at_risk'
      :                                'low';

    // Unique clients affected
    const affected_clients = [...new Set(tasks.filter(t => t.client_id).map(t => t.client_id))].length;

    return {
      ...cat,
      total, completed, overdue, in_progress: in_prog, pending,
      due_soon, due_30,
      completion_pct: pct,
      risk,
      affected_clients,
    };
  });

  // ── Upcoming filing deadlines (30-day window) ─────────────────────────────
  const upcoming_deadlines = filings
    .filter(f => {
      if (!f.sla_due_at) return false;
      const d = new Date(f.sla_due_at);
      return d >= now && d <= in30;
    })
    .map(f => ({
      id: f.id,
      category: f.category,
      fy_label: f.fy_label,
      current_status: f.current_status,
      sla_due_at: f.sla_due_at,
      days_remaining: Math.ceil((new Date(f.sla_due_at!).getTime() - now.getTime()) / 86_400_000),
      urgent: new Date(f.sla_due_at!) <= in7,
    }))
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 15);

  // ── Environmental Compensation risk assessment ────────────────────────────
  const overdue_filings  = filings.filter(f => f.sla_due_at && new Date(f.sla_due_at) < now).length;
  const critical_epr_cats = categories.filter(c =>
    c.overdue > 0 && ['plastic_extended', 'ewaste_extended', 'battery_extended'].includes(c.key)
  );
  const ec_risk = overdue_filings > 0 || critical_epr_cats.length > 0;
  const ec_risk_level: string =
    overdue_filings > 5 || critical_epr_cats.length >= 2 ? 'critical'
    : overdue_filings > 2 || critical_epr_cats.length > 0 ? 'high'
    : overdue_filings > 0 ? 'medium'
    : 'none';

  // ── Stale service requests ────────────────────────────────────────────────
  const stale_service_requests = srqs.filter(s => {
    const age = (now.getTime() - new Date(s.updated_at || s.created_at).getTime()) / 3_600_000;
    return !['closed', 'rejected'].includes(s.status) && age > 48;
  }).length;

  // ── Summary ───────────────────────────────────────────────────────────────
  const totTask  = categories.reduce((s, c) => s + c.total, 0);
  const totDone  = categories.reduce((s, c) => s + c.completed, 0);
  const totOvd   = categories.reduce((s, c) => s + c.overdue, 0);

  return NextResponse.json({
    categories,
    upcoming_deadlines,
    ec_risk,
    ec_risk_level,
    stale_service_requests,
    summary: {
      total_epr_tasks:    totTask,
      completed:          totDone,
      overdue:            totOvd,
      completion_pct:     totTask ? Math.round((totDone / totTask) * 100) : 0,
      total_filings:      filings.length,
      overdue_filings,
      upcoming_filings:   upcoming_deadlines.length,
    },
  });
}
