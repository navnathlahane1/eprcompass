/**
 * GET /api/taskmanager/calendar
 * Regulatory Deadline Calendar.
 * Returns static CPCB/SPCB events overlaid with live client compliance status.
 * ?month=YYYY-MM  → filter to specific month (default: current + next 3 months)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

/* ── Static CPCB/SPCB Regulatory Events ──────────────────────────────────── */
const REGULATORY_EVENTS = [
  // FY 2026-27
  { date: '2026-06-30', title: 'CPCB EPR Annual Target Submission',    category: 'all',       type: 'mandatory', authority: 'CPCB',  description: 'Annual EPR target submission for FY 2025-26 compliance period.' },
  { date: '2026-09-30', title: 'Q2 EPR Progress Report',               category: 'plastic',   type: 'periodic',  authority: 'CPCB',  description: 'Quarterly progress report for Plastic EPR obligations.' },
  { date: '2026-09-30', title: 'E-Waste Q2 Channelization Report',     category: 'ewaste',    type: 'periodic',  authority: 'CPCB',  description: 'Quarterly e-waste channelization and processing report.' },
  { date: '2026-12-31', title: 'Q3 EPR Progress Report',               category: 'plastic',   type: 'periodic',  authority: 'CPCB',  description: 'Q3 plastic EPR progress update.' },
  { date: '2026-12-31', title: 'Battery EPR Q3 Report',                category: 'battery',   type: 'periodic',  authority: 'CPCB',  description: 'Battery EPR Q3 collection and recycling report.' },
  { date: '2027-01-31', title: 'Annual EPR Credit Reconciliation',      category: 'all',       type: 'mandatory', authority: 'CPCB',  description: 'Annual reconciliation of EPR credits procured vs. obligations.' },
  { date: '2027-03-31', title: 'FY Close — EPR Target Assessment',      category: 'all',       type: 'critical',  authority: 'CPCB',  description: 'Financial year end EPR target assessment. Shortfalls attract Environmental Compensation.' },
  { date: '2027-03-31', title: 'Certificate Expiry — FY 2026-27',       category: 'all',       type: 'critical',  authority: 'CPCB',  description: 'EPR certificates issued for FY 2026-27 expire. Renewal required.' },
  { date: '2027-06-30', title: 'CPCB Annual Return Filing',             category: 'all',       type: 'mandatory', authority: 'CPCB',  description: 'Statutory annual EPR return filing for FY 2026-27.' },
  // Tyre & Used Oil specific
  { date: '2026-10-31', title: 'Tyre EPR Half-Year Report',             category: 'tyre',      type: 'periodic',  authority: 'CPCB',  description: 'Half-yearly tyre EPR collection and recycling status.' },
  { date: '2027-01-31', title: 'Used Oil Annual Audit Submission',      category: 'used_oil',  type: 'mandatory', authority: 'SPCB',  description: 'Annual used oil generation and disposal audit report.' },
  // Hazardous Waste
  { date: '2026-07-31', title: 'Hazardous Waste Annual Return',         category: 'hazardous', type: 'mandatory', authority: 'SPCB',  description: 'Annual hazardous waste generation and disposal return filing.' },
  { date: '2027-02-28', title: 'Consent to Operate Renewal Deadline',   category: 'hazardous', type: 'critical',  authority: 'SPCB',  description: 'CTO renewal application must be filed before expiry.' },
  // General
  { date: '2026-08-15', title: 'CPCB Producer Registration Review',     category: 'all',       type: 'advisory',  authority: 'CPCB',  description: 'Annual review of registered producer details and targets.' },
  { date: '2026-11-30', title: 'Brand Registration Update Deadline',    category: 'all',       type: 'periodic',  authority: 'CPCB',  description: 'Update brand/product registration details for new models.' },
];

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const { searchParams } = new URL(req.url);
  const monthFilter = searchParams.get('month'); // 'YYYY-MM'

  // ── Live filing counts by date range ─────────────────────────────────────
  const windowStart = monthFilter
    ? `${monthFilter}-01`
    : now.toISOString().split('T')[0];
  const windowEnd = monthFilter
    ? `${monthFilter}-31`
    : new Date(now.getTime() + 120 * 24 * 3_600_000).toISOString().split('T')[0];

  const { data: filings } = await db
    .from('epr_filing_statuses')
    .select('id, category, current_status, sla_due_at, client_id')
    .gte('sla_due_at', windowStart)
    .lte('sla_due_at', windowEnd + 'T23:59:59');

  const { data: eprTasks } = await db
    .from('client_epr_tasks')
    .select('id, waste_category, status, due_date, client_id')
    .gte('due_date', windowStart)
    .lte('due_date', windowEnd);

  // ── Build event overlay: count clients affected ───────────────────────────
  const events = REGULATORY_EVENTS.map(ev => {
    const evDate = new Date(ev.date);
    const daysTo = Math.ceil((evDate.getTime() - now.getTime()) / 86_400_000);

    // Count filings due near this event date (±7 days)
    const nearFilings = (filings ?? []).filter(f => {
      if (!f.sla_due_at) return false;
      const diff = Math.abs(new Date(f.sla_due_at).getTime() - evDate.getTime()) / 86_400_000;
      return diff <= 7;
    });
    const nearEpr = (eprTasks ?? []).filter(t => {
      if (!t.due_date) return false;
      const diff = Math.abs(new Date(t.due_date).getTime() - evDate.getTime()) / 86_400_000;
      return diff <= 7;
    });

    const clients_affected = new Set([
      ...nearFilings.map(f => f.client_id),
      ...nearEpr.map(t => t.client_id),
    ]).size;

    const ready_count = nearFilings.filter(f =>
      ['Submitted', 'Approved', 'Certificate Issued'].includes(f.current_status)
    ).length + nearEpr.filter(t => t.status === 'completed').length;

    const not_ready = clients_affected - Math.min(ready_count, clients_affected);

    return {
      ...ev,
      days_to: daysTo,
      past: daysTo < 0,
      clients_affected,
      not_ready: Math.max(0, not_ready),
    };
  });

  // ── Upcoming events (next 90 days, sorted) ───────────────────────────────
  const upcoming = events
    .filter(e => e.days_to >= 0 && e.days_to <= 90)
    .sort((a, b) => a.days_to - b.days_to);

  // ── Group events by month for calendar view ──────────────────────────────
  const byMonth: Record<string, typeof events> = {};
  for (const ev of events) {
    const key = ev.date.slice(0, 7); // 'YYYY-MM'
    (byMonth[key] ??= []).push(ev);
  }

  // ── Count clients with SLA filings due this month ─────────────────────────
  const thisMonth = now.toISOString().slice(0, 7);
  const thisMonthFilings = (filings ?? []).filter(f =>
    f.sla_due_at?.startsWith(thisMonth)
  );
  const thisMonthClients = new Set(thisMonthFilings.map(f => f.client_id)).size;

  return NextResponse.json({
    events,
    upcoming,
    by_month:   byMonth,
    stats: {
      upcoming_30d:  events.filter(e => e.days_to >= 0 && e.days_to <= 30).length,
      upcoming_90d:  events.filter(e => e.days_to >= 0 && e.days_to <= 90).length,
      critical_events: upcoming.filter(e => e.type === 'critical').length,
      this_month_filings_due: thisMonthFilings.length,
      this_month_clients:     thisMonthClients,
    },
  });
}
