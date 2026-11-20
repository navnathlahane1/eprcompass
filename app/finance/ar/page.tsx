'use client';

import { useEffect, useState, useMemo } from 'react';

const fmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
const fmtK = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L` : `₹${(v / 1000).toFixed(1)}K`;

interface Summary {
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  invoiceCount: number;
  collectionRate: number;
  dso: number;
}
interface AgingBucket { key: string; label: string; count: number; amount: number }
interface Debtor { client_id: string; name: string; outstanding: number; count: number; maxDays: number }
interface Invoice { id: string; invoice_no: string; total_inr: number; due_date: string; days_overdue: number; client_name: string; status: string }

interface ARData {
  summary:         Summary;
  agingBuckets:    AgingBucket[];
  topDebtors:      Debtor[];
  overdueInvoices: Invoice[];
}

const BUCKET_COLORS: Record<string, string> = {
  current:  'bg-emerald-500',
  b0_30:    'bg-yellow-500',
  b31_60:   'bg-orange-400',
  b61_90:   'bg-rose-400',
  b91_180:  'bg-rose-600',
  b180plus: 'bg-red-700',
};
const BUCKET_TEXT: Record<string, string> = {
  current:  'text-emerald-400',
  b0_30:    'text-yellow-400',
  b31_60:   'text-orange-400',
  b61_90:   'text-rose-400',
  b91_180:  'text-rose-500',
  b180plus: 'text-red-500',
};

function DsoBar({ dso }: { dso: number }) {
  const color = dso <= 30 ? 'text-emerald-400' : dso <= 60 ? 'text-amber-400' : 'text-rose-400';
  const barW  = Math.min((dso / 90) * 100, 100);
  const barC  = dso <= 30 ? 'bg-emerald-500' : dso <= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <span className="text-xs text-slate-500">DSO (Days Sales Outstanding)</span>
        <span className={`text-lg font-bold ${color}`}>{dso} days</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${barC}`} style={{ width: `${barW}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-600">
        <span>0</span><span>30</span><span>60</span><span>90+</span>
      </div>
    </div>
  );
}

export default function ARPage() {
  const [data,      setData]      = useState<ARData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [apiError,  setApiError]  = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/finance/ar')
      .then(async r => {
        const json = await r.json();
        if (!r.ok) { setApiError(json?.detail ?? json?.error ?? `Error ${r.status}`); return; }
        setData(json);
      })
      .catch(err => setApiError(err?.message ?? 'Network error'))
      .finally(() => setLoading(false));
  }, []);

  const maxAmount = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.agingBuckets.map(b => b.amount), 1);
  }, [data]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-800" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-800" />)}
      </div>
      <div className="h-64 rounded-xl bg-slate-800" />
    </div>
  );

  if (apiError) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 max-w-md text-center">
        <p className="text-rose-400 font-semibold mb-1">Failed to load AR data</p>
        <p className="text-xs text-slate-400">{apiError}</p>
        <button onClick={() => { setApiError(null); setLoading(true); fetch('/api/finance/ar').then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false)); }}
          className="mt-4 rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/30 transition">
          Retry
        </button>
      </div>
    </div>
  );

  const s = data!.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Accounts Receivable</h1>
        <p className="text-sm text-slate-500 mt-0.5">Outstanding customer balances and aging analysis</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Outstanding', value: fmt(s.totalOutstanding), sub: `${s.invoiceCount} invoices`, color: 'text-slate-100', accent: 'border-slate-700' },
          { label: 'Total Overdue',     value: fmt(s.totalOverdue),     sub: `${s.overdueCount} invoices`, color: 'text-rose-300',  accent: 'border-rose-500/30' },
          { label: 'Collection Rate',   value: `${s.collectionRate}%`,  sub: 'of total billed',           color: 'text-emerald-300',accent: 'border-emerald-500/30' },
          { label: 'Invoices Pending',  value: s.invoiceCount,          sub: 'awaiting payment',           color: 'text-amber-300', accent: 'border-amber-500/30' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border ${k.accent} bg-slate-900/60 p-4`}>
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* DSO gauge */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5">
        <DsoBar dso={s.dso} />
      </div>

      {/* Aging buckets */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-5">Aging Analysis</h2>
        <div className="space-y-3">
          {data!.agingBuckets.map(b => {
            const pct = maxAmount > 0 ? (b.amount / maxAmount) * 100 : 0;
            const barColor = BUCKET_COLORS[b.key] ?? 'bg-slate-500';
            const txtColor = BUCKET_TEXT[b.key] ?? 'text-slate-400';
            return (
              <div key={b.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${txtColor}`}>{b.label}</span>
                    <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{b.count}</span>
                  </div>
                  <span className={`text-xs font-semibold ${txtColor}`}>{fmtK(b.amount)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: top debtors + overdue list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top debtors */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Top Outstanding Clients</h2>
          {data!.topDebtors.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No outstanding balances</p>
          ) : (
            <div className="space-y-3">
              {data!.topDebtors.map((d, i) => (
                <div key={d.client_id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{d.name}</p>
                    <p className="text-[10px] text-slate-500">{d.count} inv · {d.maxDays > 0 ? `${d.maxDays}d overdue` : 'Not overdue'}</p>
                  </div>
                  <span className={`text-xs font-semibold ${d.maxDays > 60 ? 'text-rose-400' : d.maxDays > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {fmtK(d.outstanding)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue invoices */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Overdue Invoices</h2>
          {data!.overdueInvoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No overdue invoices 🎉</p>
          ) : (
            <div className="space-y-2">
              {data!.overdueInvoices.slice(0, 8).map(inv => (
                <div key={inv.id} className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{inv.invoice_no}</p>
                    <p className="text-[10px] text-slate-500 truncate">{inv.client_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-rose-400">{fmtK(inv.total_inr)}</p>
                    <p className="text-[10px] text-slate-500">{inv.days_overdue}d overdue</p>
                  </div>
                </div>
              ))}
              {data!.overdueInvoices.length > 8 && (
                <p className="text-center text-xs text-slate-600 pt-1">+{data!.overdueInvoices.length - 8} more overdue invoices</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
