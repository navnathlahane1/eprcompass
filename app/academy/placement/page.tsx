'use client';

import { useState } from 'react';
import Link from 'next/link';

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

const FUNNEL = [
  { label: 'Graduated', count: 0, color: 'bg-slate-600', pct: 0 },
  { label: 'Profile Complete', count: 0, color: 'bg-indigo-600', pct: 0 },
  { label: 'Actively Seeking', count: 0, color: 'bg-violet-600', pct: 0 },
  { label: 'Placed', count: 0, color: 'bg-emerald-600', pct: 0 },
  { label: 'Withdrawn', count: 0, color: 'bg-rose-700', pct: 0 },
];

const PARTNERS: { company: string; roles: string; placements: number; contact: string; status: string }[] = [];

const STATUS_STYLE: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-300',
  Paused: 'bg-amber-500/15 text-amber-400',
};

export default function PlacementDashboard() {
  const [partnerFilter, setPartnerFilter] = useState('All');
  const filtered = partnerFilter === 'All' ? PARTNERS : PARTNERS.filter(p => p.status === partnerFilter);

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Placement Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">EPR Academy · Placement & Alumni</p>
        </div>
        <div className="flex gap-3">
          <Link href="/academy/placement/jobs" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">Job Board</Link>
          <Link href="/academy/placement/applications" className="px-4 py-2 bg-[#0c1022] border border-slate-700 hover:border-indigo-500 text-sm font-medium rounded-lg transition">Applications</Link>
          <Link href="/academy/alumni" className="px-4 py-2 bg-[#0c1022] border border-slate-700 hover:border-violet-500 text-sm font-medium rounded-lg transition">Alumni</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total Placed" value="0" sub="out of 0 graduates" color="text-emerald-400" />
        <KPI label="Avg Time to Placement" value="0 days" sub="from profile completion" color="text-indigo-400" />
        <KPI label="Hiring Partners Active" value="0" sub="across India" color="text-violet-400" />
        <KPI label="Open Roles" value="0" sub="live on job board" color="text-amber-400" />
      </div>

      {/* Funnel */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5">Learner Placement Pipeline</h2>
        <div className="space-y-3">
          {FUNNEL.map(f => (
            <div key={f.label} className="flex items-center gap-4">
              <span className="w-36 text-xs text-slate-400 text-right">{f.label}</span>
              <div className="flex-1 bg-slate-800/50 rounded-full h-7 relative">
                <div className={`${f.color} h-7 rounded-full flex items-center pl-3`} style={{ width: `${f.pct}%` }}>
                  <span className="text-xs font-semibold text-white">{f.count}</span>
                </div>
              </div>
              <span className="w-8 text-xs text-slate-500">{f.pct}%</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-600 mt-4">Pipeline as of May 2026 · Cohorts Jan–Apr 2026</p>
      </div>

      {/* Hiring Partners Table */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-300">Hiring Partners (0)</h2>
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {['All', 'Active', 'Paused'].map(f => (
              <button key={f} onClick={() => setPartnerFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-medium transition ${partnerFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-[11px] text-slate-500 uppercase pb-3 pr-4">Company</th>
                <th className="text-left text-[11px] text-slate-500 uppercase pb-3 pr-4">Roles</th>
                <th className="text-left text-[11px] text-slate-500 uppercase pb-3 pr-4">Placements</th>
                <th className="text-left text-[11px] text-slate-500 uppercase pb-3 pr-4">Contact</th>
                <th className="text-left text-[11px] text-slate-500 uppercase pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.company} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 pr-4 font-medium text-slate-200">{p.company}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs">{p.roles}</td>
                  <td className="py-3 pr-4">
                    <span className="bg-indigo-500/15 text-indigo-300 text-xs px-2 py-0.5 rounded-full">{p.placements}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{p.contact}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
