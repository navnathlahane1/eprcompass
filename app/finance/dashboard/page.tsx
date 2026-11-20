'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildFinanceSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

// ── Types ────────────────────────────────────────────────────────────────────

interface GstFiling {
  id: string;
  return_type: string;
  period_month: number | null;
  period_year: number;
  due_date: string;
  status: 'pending' | 'filed' | 'overdue';
  filed_date: string | null;
  arn: string | null;
  remarks: string | null;
}

interface Kpis {
  totalValue: number;
  collected: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  dueNext7Days: number;
  invoiceCount: number;
  collectionRate: number;
  dso: number;
  thisMonthBilled: number;
  lastMonthBilled: number;
  momChange: number | null;
}

interface StatusRow  { status: string; label: string; count: number; amount: number }
interface ClientRow  { name: string; billed: number; paid: number; count: number }
interface TaskRow    { id: string; title: string; task_type: string; client_name: string; due_at: string | null; is_overdue: boolean }
interface InvoiceRow { id: string; invoice_no: string; client_name: string; total_inr: number; status: string; due_date: string | null; paid_date: string | null; is_overdue: boolean }

interface DashData {
  kpis: Kpis;
  statusBreakdown: StatusRow[];
  topClients: ClientRow[];
  pendingTasks: TaskRow[];
  recentInvoices: InvoiceRow[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function relDate(d: string | null) {
  if (!d) return '—';
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400_000);
  if (days < 0)   return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days}d`;
}

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TASK_LABELS: Record<string, string> = {
  finance_invoice_deal:    'Deal Invoice',
  finance_invoice_service: 'Service Invoice',
  payment_followup:        'Payment Follow-up',
};

const STATUS_META: Record<string, { color: string; bar: string; badge: string }> = {
  paid:    { color: 'text-emerald-400', bar: 'bg-emerald-500',  badge: 'bg-emerald-500/20 text-emerald-300' },
  sent:    { color: 'text-blue-400',    bar: 'bg-blue-500',     badge: 'bg-blue-500/20 text-blue-300'    },
  overdue: { color: 'text-rose-400',    bar: 'bg-rose-500',     badge: 'bg-rose-500/20 text-rose-300'    },
  draft:   { color: 'text-slate-400',   bar: 'bg-slate-500',    badge: 'bg-slate-700/60 text-slate-400'  },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />
  );
}

function DashSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Shimmer className="h-6 w-48" /><Shimmer className="h-3.5 w-32" /></div>
        <Shimmer className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-16 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Shimmer className="lg:col-span-2 h-64 rounded-xl" />
        <Shimmer className="h-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Shimmer className="lg:col-span-2 h-56 rounded-xl" />
        <Shimmer className="h-56 rounded-xl" />
      </div>
      <Shimmer className="h-48 rounded-xl" />
    </div>
  );
}

// ── GST Helpers ───────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function gstPeriodLabel(f: GstFiling) {
  if (f.return_type === 'GSTR-9') return `FY ${f.period_year}-${String(f.period_year + 1).slice(2)}`;
  return `${MONTHS[(f.period_month ?? 1) - 1]} ${f.period_year}`;
}

function gstDaysLabel(due: string) {
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400_000);
  if (diff < 0)   return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  return `${diff}d left`;
}

function fmtDue(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const GST_META: Record<string, { color: string; border: string; bg: string }> = {
  'GSTR-1':  { color: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/8' },
  'GSTR-3B': { color: 'text-amber-400',   border: 'border-amber-500/25',   bg: 'bg-amber-500/8'   },
  'GSTR-9':  { color: 'text-violet-400',  border: 'border-violet-500/25',  bg: 'bg-violet-500/8'  },
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const [data,       setData]       = useState<DashData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [gstFilings, setGstFilings] = useState<GstFiling[]>([]);

  const todayLabel = useMemo(
    () => {
      try {
        return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        return new Date().toDateString();
      }
    },
    []
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/finance/dashboard').then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json?.detail ?? json?.error ?? `Error ${r.status}`);
        return json;
      }),
      fetch('/api/finance/gst').then(r => r.ok ? r.json() : []),
    ])
      .then(([dash, gst]) => { setData(dash); setGstFilings(gst ?? []); })
      .catch(err => setApiError(err?.message ?? 'Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashSkeleton />;

  if (apiError) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-300">Failed to load dashboard</p>
      <p className="text-xs text-slate-500 font-mono max-w-sm text-center">{apiError}</p>
      <button
        onClick={() => { setApiError(null); setLoading(true); fetch('/api/finance/dashboard').then(async r => { const j = await r.json(); r.ok ? setData(j) : setApiError(j?.detail ?? j?.error ?? `Error ${r.status}`); }).catch(e => setApiError(e?.message ?? 'Network error')).finally(() => setLoading(false)); }}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition"
      >
        Retry
      </button>
    </div>
  );

  const kpis            = data?.kpis           ?? {} as Kpis;
  const statusBreakdown = data?.statusBreakdown ?? [];
  const topClients      = data?.topClients      ?? [];
  const pendingTasks    = data?.pendingTasks    ?? [];
  const recentInvoices  = data?.recentInvoices  ?? [];

  const maxStatusAmt  = Math.max(...statusBreakdown.map(s => s.amount), 1);
  const maxClientBill = Math.max(...topClients.map(c => c.billed), 1);

  const dsoColor = !kpis.dso ? 'text-slate-500'
    : kpis.dso < 30 ? 'text-emerald-400'
    : kpis.dso < 60 ? 'text-amber-400'
    : 'text-rose-400';

  const healthLabel = kpis.collectionRate >= 80 ? 'Strong'
    : kpis.collectionRate >= 60 ? 'Fair'
    : kpis.invoiceCount === 0 ? 'No data'
    : 'Needs attention';

  const healthColor = kpis.collectionRate >= 80 ? 'text-emerald-400'
    : kpis.collectionRate >= 60 ? 'text-amber-400'
    : kpis.invoiceCount === 0 ? 'text-slate-500'
    : 'text-rose-400';

  const healthDot = kpis.collectionRate >= 80 ? 'bg-emerald-500'
    : kpis.collectionRate >= 60 ? 'bg-amber-500 animate-pulse'
    : kpis.invoiceCount === 0 ? 'bg-slate-600'
    : 'bg-rose-500 animate-pulse';

  // SVG ring: circumference ≈ 100 (r=15.9)
  const ringPct  = Math.min(kpis.collectionRate ?? 0, 100);
  const ringDash = `${ringPct} ${100 - ringPct}`;

  const financeSetupSteps = buildFinanceSetupSteps({
    hasReviewedInvoices: kpis.invoiceCount > 0,
    hasProcessedPayment: kpis.collected > 0,
  });

  return (
    <div className="space-y-6">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={financeSetupSteps}
          portalKey="finance"
          accentColor="blue"
          dark={true}
        />
      </TourTarget>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Finance Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/finance/reports"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports
          </Link>
          <Link href="/finance/invoices/create"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </Link>
        </div>
      </div>

      {/* ── Overdue Alert ────────────────────────────────────────────────────── */}
      {(kpis.overdueCount ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-300">
              {kpis.overdueCount} overdue invoice{kpis.overdueCount > 1 ? 's' : ''} — {fmt(kpis.overdueAmount ?? 0)} at risk
            </p>
            <p className="text-[11px] text-rose-400/70">Follow up immediately to avoid revenue loss</p>
          </div>
          <Link href="/finance/invoices?status=overdue"
            className="shrink-0 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/15">
            View overdue
          </Link>
        </div>
      )}

      {/* ── Primary KPI Cards ───────────────────────────────────────────────── */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        {/* Total Billed */}
        <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Total Billed</p>
              <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-slate-100">
                {fmt(kpis.totalValue ?? 0)}
              </p>
              {kpis.momChange !== null && kpis.momChange !== undefined ? (
                <p className={`mt-0.5 flex items-center gap-1 text-[10px] font-medium ${kpis.momChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={kpis.momChange >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                  </svg>
                  {Math.abs(kpis.momChange)}% vs last month
                </p>
              ) : (
                <p className="mt-0.5 text-[10px] text-slate-600">All time</p>
              )}
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700/50">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Collected */}
        <div className="overflow-hidden rounded-xl border border-emerald-900/40 bg-[#0c1022] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Collected</p>
              <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-emerald-400">
                {fmt(kpis.collected ?? 0)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                {kpis.collectionRate ?? 0}% collection rate
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Outstanding */}
        <div className="overflow-hidden rounded-xl border border-amber-900/30 bg-[#0c1022] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Outstanding</p>
              <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-amber-400">
                {fmt(kpis.outstanding ?? 0)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                DSO {kpis.dso ?? 0} days
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className={`overflow-hidden rounded-xl border bg-[#0c1022] p-4 ${(kpis.overdueAmount ?? 0) > 0 ? 'border-rose-900/40' : 'border-slate-800/80'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Overdue</p>
              <p className={`mt-1.5 text-3xl font-bold tabular-nums tracking-tight ${(kpis.overdueAmount ?? 0) > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                {fmt(kpis.overdueAmount ?? 0)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                {kpis.overdueCount ?? 0} invoice{(kpis.overdueCount ?? 0) !== 1 ? 's' : ''} past due
              </p>
            </div>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${(kpis.overdueAmount ?? 0) > 0 ? 'bg-rose-500/15' : 'bg-slate-700/50'}`}>
              <svg viewBox="0 0 24 24" className={`h-5 w-5 ${(kpis.overdueAmount ?? 0) > 0 ? 'text-rose-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
          </div>
        </div>
      </TourTarget>

      {/* ── Secondary Metrics ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Collection Rate', value: `${kpis.collectionRate ?? 0}%`, accent: 'bg-emerald-500', color: 'text-emerald-400' },
          { label: 'Days Sales Outstanding', value: `${kpis.dso ?? 0}d`, accent: kpis.dso < 30 ? 'bg-emerald-500' : kpis.dso < 60 ? 'bg-amber-500' : 'bg-rose-500', color: dsoColor },
          { label: 'Total Invoices', value: String(kpis.invoiceCount ?? 0), accent: 'bg-blue-500', color: 'text-blue-400' },
          { label: 'Due in 7 Days', value: String(kpis.dueNext7Days ?? 0), accent: (kpis.dueNext7Days ?? 0) > 0 ? 'bg-amber-500' : 'bg-slate-600', color: (kpis.dueNext7Days ?? 0) > 0 ? 'text-amber-400' : 'text-slate-500' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div className="min-w-0">
              <p className={`text-xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600 leading-tight">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle Grid: Invoice Pipeline + Financial Health ─────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Invoice Pipeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Invoice Pipeline</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">
                {kpis.invoiceCount ?? 0} invoices · {fmt(kpis.totalValue ?? 0)} total billed
              </p>
            </div>
            <Link href="/finance/invoices" className="text-xs text-emerald-400 transition hover:text-emerald-300">
              View all →
            </Link>
          </div>

          {statusBreakdown.length === 0 ? (
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-8 text-center">
              <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-slate-600">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(s => {
                const meta = STATUS_META[s.status] ?? STATUS_META.draft;
                const barW = Math.max((s.amount / maxStatusAmt) * 100, s.amount > 0 ? 3 : 0);
                const pct  = (kpis.totalValue ?? 0) > 0 ? Math.round((s.amount / (kpis.totalValue ?? 1)) * 100) : 0;
                return (
                  <div key={s.status} className="-mx-1 flex items-center gap-3 rounded-lg px-1 py-1.5 transition hover:bg-slate-800/30 group">
                    <div className="w-28 shrink-0">
                      <p className={`text-xs font-semibold ${meta.color}`}>{s.label}</p>
                      <p className="text-[10px] text-slate-600">{s.count} invoice{s.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${meta.bar} opacity-70 transition-all duration-700`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      <span className={`text-sm font-bold tabular-nums ${s.amount > 0 ? meta.color : 'text-slate-700'}`}>
                        {fmt(s.amount)}
                      </span>
                      {s.amount > 0 && (
                        <span className="ml-1.5 text-[10px] text-slate-600">{pct}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mini progress bar at bottom */}
          {statusBreakdown.length > 0 && (kpis.totalValue ?? 0) > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="mb-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-600">Collection progress</span>
                <span className="font-bold text-emerald-400">{kpis.collectionRate ?? 0}% collected</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                  style={{ width: `${kpis.collectionRate ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Financial Health + Quick Actions */}
        <div className="space-y-4">

          {/* Financial Health */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Financial Health</p>

            {/* Collection Rate Ring */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(30 41 59)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="rgb(16 185 129)" strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={ringDash}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-400">{kpis.collectionRate ?? 0}%</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">Collection Rate</p>
                <p className={`text-xs font-medium ${healthColor}`}>{healthLabel}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">of total billed</p>
              </div>
            </div>

            {/* Health indicators */}
            <div className="space-y-2">
              {[
                {
                  label: 'Payment Health',
                  value: healthLabel,
                  dot: healthDot,
                  valColor: healthColor,
                },
                {
                  label: 'Days Sales Outstanding',
                  value: `${kpis.dso ?? 0} days`,
                  dot: kpis.dso < 30 ? 'bg-emerald-500' : kpis.dso < 60 ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse',
                  valColor: dsoColor,
                },
                {
                  label: 'Overdue Invoices',
                  value: kpis.overdueCount ?? 0,
                  dot: (kpis.overdueCount ?? 0) > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500',
                  valColor: (kpis.overdueCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400',
                },
                {
                  label: 'Total Invoices',
                  value: kpis.invoiceCount ?? 0,
                  dot: 'bg-blue-500',
                  valColor: 'text-blue-400',
                },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className={`text-[11px] font-semibold ${row.valColor}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <TourTarget id="dash-quick-actions" className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quick Actions</p>
            <div className="space-y-2">
              {[
                {
                  href: '/finance/invoices/create',
                  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                  label: 'Create Invoice',
                  sub: 'New invoice for a client',
                  border: 'border-emerald-500/20',
                  bg: 'hover:bg-emerald-500/8',
                  iconBg: 'bg-emerald-500/20',
                  iconColor: 'text-emerald-400',
                },
                {
                  href: '/finance/payments',
                  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
                  label: 'Payment Tracker',
                  sub: 'Track pending payments',
                  border: 'border-blue-500/20',
                  bg: 'hover:bg-blue-500/8',
                  iconBg: 'bg-blue-500/20',
                  iconColor: 'text-blue-400',
                },
                {
                  href: '/finance/invoices?status=overdue',
                  icon: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
                  label: 'Overdue Follow-up',
                  sub: `${kpis.overdueCount ?? 0} invoices need action`,
                  border: 'border-rose-500/20',
                  bg: 'hover:bg-rose-500/8',
                  iconBg: 'bg-rose-500/20',
                  iconColor: 'text-rose-400',
                },
                {
                  href: '/finance/reports',
                  icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
                  label: 'Revenue Reports',
                  sub: 'CFO analytics & trends',
                  border: 'border-violet-500/20',
                  bg: 'hover:bg-violet-500/8',
                  iconBg: 'bg-violet-500/20',
                  iconColor: 'text-violet-400',
                },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex items-center gap-2.5 rounded-lg border ${a.border} p-2.5 transition ${a.bg}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.iconBg}`}>
                    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${a.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{a.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{a.sub}</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </TourTarget>
        </div>
      </div>

      {/* ── Bottom Grid: Top Clients + Pending Tasks ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Top Clients */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Top Clients by Revenue</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">Top 5 clients by invoiced amount</p>
            </div>
            <Link href="/finance/invoices" className="text-xs text-emerald-400 transition hover:text-emerald-300">
              All invoices →
            </Link>
          </div>

          {topClients.length === 0 ? (
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-8 text-center">
              <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              <p className="text-sm text-slate-600">No client data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => {
                const collectedPct = client.billed > 0 ? Math.round((client.paid / client.billed) * 100) : 0;
                const barW = Math.max((client.billed / maxClientBill) * 100, 3);
                const rankColors = ['text-amber-400', 'text-slate-300', 'text-slate-400', 'text-slate-500', 'text-slate-600'];
                return (
                  <div key={client.name} className="-mx-1 flex items-center gap-3 rounded-lg px-1 py-1.5 transition hover:bg-slate-800/30">
                    <span className={`w-5 shrink-0 text-center text-xs font-bold tabular-nums ${rankColors[i] ?? 'text-slate-600'}`}>
                      {i + 1}
                    </span>
                    <div className="w-36 shrink-0 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{client.name}</p>
                      <p className="text-[10px] text-slate-600">{client.count} inv · {collectedPct}% paid</p>
                    </div>
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 opacity-60 transition-all duration-700"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <span className="text-sm font-bold tabular-nums text-slate-200">{fmt(client.billed)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Pending Tasks</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">{pendingTasks.length} active</p>
            </div>
            <Link href="/finance/tasks" className="text-xs text-emerald-400 transition hover:text-emerald-300">
              View all →
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-8 text-center">
              <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-sm text-slate-600">All clear</p>
              <p className="mt-1 text-[11px] text-slate-700">No pending tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 6).map(t => (
                <Link key={t.id} href="/finance/tasks"
                  className="flex items-start gap-2.5 rounded-lg border border-slate-800/40 p-2.5 transition hover:border-emerald-500/20 hover:bg-slate-800/30">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${t.is_overdue ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <svg viewBox="0 0 24 24" className={`h-3 w-3 ${t.is_overdue ? 'text-rose-400' : 'text-emerald-400'}`} fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{t.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                      {t.client_name} · {TASK_LABELS[t.task_type] ?? t.task_type}
                    </p>
                  </div>
                  {t.due_at && (
                    <span className={`shrink-0 text-[10px] font-medium ${t.is_overdue ? 'text-rose-400' : 'text-slate-600'}`}>
                      {relDate(t.due_at)}
                    </span>
                  )}
                </Link>
              ))}
              {pendingTasks.length > 6 && (
                <Link href="/finance/tasks"
                  className="block rounded-lg border border-slate-800/40 p-2.5 text-center text-[11px] font-medium text-slate-500 transition hover:text-emerald-400">
                  +{pendingTasks.length - 6} more tasks
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── GST Filing Calendar ─────────────────────────────────────────────── */}
      {gstFilings.length > 0 && (() => {
        // Show: all pending/overdue + filed in last 30d, sorted by due_date asc, capped at 6
        const now = Date.now();
        const visible = gstFilings
          .filter(f =>
            f.status !== 'filed' ||
            (f.filed_date && now - new Date(f.filed_date).getTime() < 30 * 86400_000)
          )
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 6);
        const hasOverdue = visible.some(f => f.status === 'overdue');
        const pendingCount = visible.filter(f => f.status !== 'filed').length;
        return (
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">GST Filing Calendar</h2>
                  <p className="mt-0.5 text-[11px] text-slate-600">{pendingCount} return{pendingCount !== 1 ? 's' : ''} pending</p>
                </div>
                {hasOverdue && (
                  <span className="ml-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    Action needed
                  </span>
                )}
              </div>
              <Link href="/finance/tax/gst" className="text-xs text-emerald-400 transition hover:text-emerald-300">
                Manage GST →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {visible.map(f => {
                const meta = GST_META[f.return_type] ?? GST_META['GSTR-1'];
                const isFiled   = f.status === 'filed';
                const isOverdue = f.status === 'overdue';
                const daysLabel = gstDaysLabel(f.due_date);
                return (
                  <Link key={f.id} href="/finance/tax/gst"
                    className={`group flex flex-col gap-2 rounded-lg border p-3 transition hover:opacity-80 ${
                      isFiled   ? 'border-emerald-500/20 bg-emerald-500/5' :
                      isOverdue ? 'border-rose-500/30 bg-rose-500/5' :
                      meta.border
                    }`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold ${isFiled ? 'text-emerald-400' : isOverdue ? 'text-rose-400' : meta.color}`}>
                        {f.return_type}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        isFiled   ? 'bg-emerald-500/20 text-emerald-300' :
                        isOverdue ? 'bg-rose-500/20 text-rose-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isFiled ? 'Filed' : isOverdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">{gstPeriodLabel(f)}</p>
                    <div className="mt-auto">
                      <p className="text-[10px] text-slate-600">Due</p>
                      <p className={`text-xs font-semibold ${isOverdue ? 'text-rose-400' : isFiled ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {fmtDue(f.due_date)}
                      </p>
                      {isFiled ? (
                        <p className="mt-0.5 text-[10px] font-medium text-emerald-500 truncate">
                          {f.arn ? `ARN: ${f.arn}` : f.filed_date ? `Filed ${fmtDue(f.filed_date)}` : 'Filed'}
                        </p>
                      ) : (
                        <p className={`mt-0.5 text-[10px] font-medium ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                          {daysLabel}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Reports Section ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Reports</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">CFO analytics, trends & financial statements</p>
            </div>
          </div>
          <Link href="/finance/reports" className="text-xs text-violet-400 transition hover:text-violet-300">
            View all reports →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              href: '/finance/reports',
              label: 'Revenue Report',
              sub: 'Monthly billed & collected trends',
              icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
              iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400',
              border: 'border-emerald-500/20', bg: 'hover:bg-emerald-500/5',
            },
            {
              href: '/finance/reports',
              label: 'Collection Analysis',
              sub: 'Payment rates & overdue trends',
              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
              iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400',
              border: 'border-blue-500/20', bg: 'hover:bg-blue-500/5',
            },
            {
              href: '/finance/statements',
              label: 'Financial Statements',
              sub: 'P&L, Balance Sheet, Cash Flow',
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400',
              border: 'border-amber-500/20', bg: 'hover:bg-amber-500/5',
            },
            {
              href: '/finance/tax',
              label: 'Tax Summary',
              sub: 'GST, TDS & income tax overview',
              icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400',
              border: 'border-violet-500/20', bg: 'hover:bg-violet-500/5',
            },
          ].map(r => (
            <Link key={r.href + r.label} href={r.href}
              className={`group flex flex-col gap-3 rounded-xl border ${r.border} p-4 transition ${r.bg}`}>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${r.iconBg}`}>
                <svg viewBox="0 0 24 24" className={`h-4.5 w-4.5 ${r.iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition">{r.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">{r.sub}</p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-[10px] font-medium text-slate-600 group-hover:text-slate-400 transition">
                View report
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Invoice Activity ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Recent Invoices</h2>
            <p className="mt-0.5 text-[11px] text-slate-600">Latest invoice activity</p>
          </div>
          <Link href="/finance/invoices" className="text-xs text-emerald-400 transition hover:text-emerald-300">
            Full list →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-8 text-center">
            <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-600">No invoices yet</p>
            <p className="mt-1 text-[11px] text-slate-700">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentInvoices.map(inv => {
              const meta    = STATUS_META[inv.is_overdue ? 'overdue' : inv.status] ?? STATUS_META.draft;
              const displayStatus = inv.is_overdue && inv.status !== 'paid' ? 'overdue' : inv.status;
              return (
                <Link key={inv.id} href={`/finance/invoices/${inv.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-800/30">
                  {/* Status badge */}
                  <span className={`min-w-[64px] shrink-0 rounded-md px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
                    {displayStatus}
                  </span>
                  {/* Invoice info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-300">
                      <span className="font-semibold text-slate-200">{inv.invoice_no}</span>
                      <span className="mx-1.5 text-slate-700">·</span>
                      <span className="text-slate-400">{inv.client_name}</span>
                    </p>
                  </div>
                  {/* Amount */}
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${meta.color}`}>
                    {fmt(inv.total_inr)}
                  </span>
                  {/* Date */}
                  <span className="shrink-0 whitespace-nowrap text-[10px] text-slate-600 w-20 text-right">
                    {inv.paid_date
                      ? `Paid ${relTime(inv.paid_date)}`
                      : inv.due_date
                      ? relDate(inv.due_date)
                      : '—'}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
