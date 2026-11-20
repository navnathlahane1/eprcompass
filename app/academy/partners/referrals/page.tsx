'use client';

import { useState } from 'react';

const REFERRALS: { id: string; learner: string; partner: string; partnerId: string; program: string; enrolled: string; fee: number; share: number; utmMedium: string; status: string }[] = [];

export default function ReferralsPage() {
  const [partnerFilter, setPartnerFilter] = useState('All');
  const [search, setSearch] = useState('');

  const partners = ['All', ...Array.from(new Set(REFERRALS.map(r => r.partner)))];

  const filtered = REFERRALS.filter(r => {
    if (partnerFilter !== 'All' && r.partner !== partnerFilter) return false;
    if (search && !r.learner.toLowerCase().includes(search.toLowerCase()) && !r.partner.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalReferrals = filtered.length;
  const totalRevenue = filtered.reduce((s, r) => s + r.fee, 0);
  const totalShare = filtered.reduce((s, r) => s + r.share, 0);

  const byPartner = REFERRALS.reduce<Record<string, number>>((acc, r) => {
    acc[r.partner] = (acc[r.partner] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Referral Tracking</h1>
        <p className="mt-0.5 text-sm text-slate-500">All learner enrollments attributed to partner referral links via UTM tracking.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Referrals',      value: REFERRALS.length,                                color: 'text-indigo-400' },
          { label: 'Referring Partners',   value: Object.keys(byPartner).length,                   color: 'text-violet-400' },
          { label: 'Revenue from Referrals', value: `₹${REFERRALS.reduce((s,r) => s+r.fee,0).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Partner Share Due',    value: `₹${REFERRALS.reduce((s,r) => s+r.share,0).toLocaleString('en-IN')}`, color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Partner leaderboard */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Referral Leaderboard</h2>
        <div className="space-y-2">
          {Object.entries(byPartner).sort((a, b) => b[1] - a[1]).map(([partner, count], i) => {
            const pct = Math.round((count / REFERRALS.length) * 100);
            return (
              <div key={partner} className="flex items-center gap-3">
                <span className="w-5 text-center text-[10px] font-bold text-slate-500">#{i+1}</span>
                <span className="w-40 text-xs text-slate-300 truncate">{partner}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-200 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search learner or partner…"
          className="flex-1 min-w-[180px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <select value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {partners.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/40">
              {['Learner', 'Partner', 'Program', 'Enrolled', 'Fee Paid', 'Partner Share (20%)', 'UTM Source', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 font-medium text-slate-200">{r.learner}</td>
                <td className="px-4 py-3">
                  <p className="text-slate-300">{r.partner}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{r.partnerId}</p>
                </td>
                <td className="px-4 py-3 text-slate-400">{r.program}</td>
                <td className="px-4 py-3 text-slate-500">{r.enrolled}</td>
                <td className="px-4 py-3 text-slate-300">₹{r.fee.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">₹{r.share.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 font-mono text-indigo-400 text-[10px]">utm_medium={r.utmMedium}</td>
                <td className="px-4 py-3">
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/15 text-emerald-400">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
