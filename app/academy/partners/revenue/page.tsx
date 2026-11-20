'use client';

import { useState } from 'react';

const PAYOUTS: { id: string; partner: string; partnerId: string; month: string; enrollments: number; grossRevenue: number; shareType: string; partnerShare: number; status: string; paidDate: string | null }[] = [];

export default function RevenuePayoutsPage() {
  const [monthFilter, setMonthFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = PAYOUTS.filter(p => {
    if (monthFilter !== 'All' && p.month !== monthFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    return true;
  });

  const totalPending = PAYOUTS.filter(p => p.status === 'Pending').reduce((s, p) => s + p.partnerShare, 0);
  const totalPaid    = PAYOUTS.filter(p => p.status === 'Paid').reduce((s, p) => s + p.partnerShare, 0);
  const totalGross   = PAYOUTS.reduce((s, p) => s + p.grossRevenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Revenue & Partner Payouts</h1>
          <p className="mt-0.5 text-sm text-slate-500">Monthly revenue share breakdown and payment tracking.</p>
        </div>
        <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
          Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Gross Revenue',   value: `₹${(totalGross/1000).toFixed(0)}K`,      color: 'text-indigo-400' },
          { label: 'Total Partner Payouts', value: `₹${((totalPaid+totalPending)/1000).toFixed(0)}K`, color: 'text-violet-400' },
          { label: 'Paid (Apr 2026)',        value: `₹${(totalPaid/1000).toFixed(0)}K`,        color: 'text-emerald-400' },
          { label: 'Pending Payouts',        value: `₹${(totalPending/1000).toFixed(0)}K`,     color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pending payout alert */}
      {totalPending > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-amber-300">₹{totalPending.toLocaleString('en-IN')} in payouts due by 15 May 2026</p>
            <p className="text-xs text-slate-500 mt-0.5">{filtered.filter(p => p.status === 'Pending').length} partner(s) awaiting payment</p>
          </div>
          <button className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition">
            Approve All Pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All', 'Mar 2026', 'Apr 2026'].map(m => (
            <button key={m} onClick={() => setMonthFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium transition ${monthFilter === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All', 'Pending', 'Paid'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium transition ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/40">
              {['Partner', 'Month', 'Enrollments', 'Gross Revenue', 'Share Type', 'Partner Share', 'Status', 'Paid Date', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{p.partner}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{p.partnerId}</p>
                </td>
                <td className="px-4 py-3 text-slate-400">{p.month}</td>
                <td className="px-4 py-3 text-slate-300 font-semibold">{p.enrollments}</td>
                <td className="px-4 py-3 text-slate-300">₹{p.grossRevenue.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-slate-500">{p.shareType}</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">₹{p.partnerShare.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${p.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.paidDate ?? '—'}</td>
                <td className="px-4 py-3">
                  {p.status === 'Pending' && (
                    <button className="rounded px-2 py-1 text-[9px] font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition">
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-600 text-center">
        Revenue share calculated on actual fees received, net of refunds. Payment due by 15th of following month.
      </p>
    </div>
  );
}
