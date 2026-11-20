'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReportData {
  monthly: { month: string; billed: number; collected: number; count: number }[];
  byStatus: { status: string; count: number; total: number }[];
  topClients: { client_name: string; total: number; count: number; paid: number }[];
  summary: {
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    avgInvoiceValue: number;
    collectionRate: number;
  };
}

function fmt(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

export default function ReportsPage() {
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('12');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finance/reports?months=${period}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );

  const summary = data?.summary;
  const monthly = data?.monthly ?? [];
  const topClients = data?.topClients ?? [];
  const byStatus = data?.byStatus ?? [];

  const maxBilled = Math.max(...monthly.map(m => m.billed), 1);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Financial Reports</h1>
          <p className="mt-0.5 text-sm text-slate-500">CFO — Revenue & collection analytics</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 p-1">
          {[
            { key: '3',  label: '3M' },
            { key: '6',  label: '6M' },
            { key: '12', label: '12M' },
          ].map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${period === p.key ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Total Billed',      value: fmt(summary.totalBilled),      color: 'text-slate-100',   bg: 'bg-slate-700/30' },
            { label: 'Total Collected',   value: fmt(summary.totalCollected),   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Outstanding',       value: fmt(summary.totalOutstanding), color: 'text-amber-400',   bg: 'bg-amber-500/10' },
            { label: 'Avg Invoice',       value: fmt(summary.avgInvoiceValue),  color: 'text-blue-400',    bg: 'bg-blue-500/10' },
            { label: 'Collection Rate',   value: fmtPct(summary.collectionRate),color: summary.collectionRate >= 80 ? 'text-emerald-400' : summary.collectionRate >= 50 ? 'text-amber-400' : 'text-rose-400', bg: 'bg-slate-800/30' },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border border-slate-800/80 ${k.bg} p-4`}>
              <p className="text-[10px] text-slate-600">{k.label}</p>
              <p className={`mt-1.5 text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly chart */}
      {monthly.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">Monthly Revenue</h2>
          <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: '120px' }}>
            {monthly.map(m => {
              const billedH    = maxBilled > 0 ? Math.max((m.billed / maxBilled) * 100, m.billed > 0 ? 4 : 0) : 0;
              const collectedH = m.billed > 0 ? Math.max((m.collected / m.billed) * billedH, m.collected > 0 ? 2 : 0) : 0;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1 min-w-[40px] flex-1">
                  <p className="text-[9px] text-slate-600 tabular-nums">{fmt(m.billed)}</p>
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '80px' }}>
                    {/* Billed bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t bg-slate-700/60 transition-all duration-500"
                      style={{ height: `${billedH}%` }}
                    />
                    {/* Collected bar */}
                    <div
                      className="absolute bottom-0 left-1 right-1 rounded-t bg-emerald-500/60 transition-all duration-500"
                      style={{ height: `${collectedH}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-600 whitespace-nowrap">{m.month}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-700/60" />Billed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500/60" />Collected</span>
          </div>
        </div>
      )}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Top Clients */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">Top Clients by Revenue</h2>
          {topClients.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => {
                const pct = c.total > 0 ? Math.round((c.paid / c.total) * 100) : 0;
                return (
                  <div key={c.client_name + i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 truncate">{c.client_name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-500">{c.count} inv</span>
                        <span className="font-bold tabular-nums text-slate-200">{fmt(c.total)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-600">{pct}% collected · {fmt(c.paid)} received</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Status breakdown */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">Invoice Status Breakdown</h2>
          {byStatus.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byStatus.map(s => {
                const totalVal = byStatus.reduce((acc, r) => acc + r.total, 0);
                const pct = totalVal > 0 ? Math.round((s.total / totalVal) * 100) : 0;
                const colorMap: Record<string, string> = {
                  paid:     'bg-emerald-500',
                  sent:     'bg-blue-500',
                  overdue:  'bg-rose-500',
                  draft:    'bg-slate-600',
                  cancelled:'bg-slate-700',
                };
                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-semibold text-slate-300">{s.status}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{s.count} inv</span>
                        <span className="font-bold tabular-nums text-slate-200">{fmt(s.total)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${colorMap[s.status] || 'bg-slate-500'} opacity-60 transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/finance/invoices"
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200 hover:border-slate-700">
          View All Invoices →
        </Link>
        <Link href="/finance/payments"
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200 hover:border-slate-700">
          Payment Tracker →
        </Link>
      </div>
    </div>
  );
}
