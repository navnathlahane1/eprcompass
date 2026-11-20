'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Learner {
  id: string;
  name: string;
  email: string;
  phone: string;
  programs: string[];
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  enrolledDate: string;
  progress: number;
  lastActive: string;
  certStatus: 'Earned' | 'In Progress' | 'Not Started';
  status: 'Active' | 'Completed' | 'Dropped';
  cohort: string;
  upsellEligible: boolean;
}


const CERT_STYLE: Record<string, string> = {
  'Earned':      'bg-emerald-500/15 text-emerald-300',
  'In Progress': 'bg-amber-500/15 text-amber-300',
  'Not Started': 'bg-slate-700 text-slate-500',
};

const STATUS_STYLE: Record<string, string> = {
  'Active':    'bg-indigo-500/15 text-indigo-300',
  'Completed': 'bg-emerald-500/15 text-emerald-300',
  'Dropped':   'bg-rose-500/15 text-rose-400',
};

const TIER_STYLE: Record<string, string> = {
  'Tier 1': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Tier 2': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Tier 3': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function FilterBar({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-slate-600 uppercase">{label}:</span>
      <div className="flex rounded-lg border border-slate-700 overflow-hidden">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-2.5 py-1.5 text-[10px] font-medium transition ${value === o ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading]   = useState(true);
  const [programF, setProgramF] = useState('All');
  const [tierF, setTierF]       = useState('All');
  const [statusF, setStatusF]   = useState('All');
  const [cohortF, setCohortF]   = useState('All');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    fetch('/api/academy/learners')
      .then(r => r.json())
      .then(d => { setLearners(d.learners ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cohorts = ['All', ...Array.from(new Set(learners.map(l => l.cohort)))];

  const filtered = learners.filter(l => {
    if (programF !== 'All' && !l.programs.some(p => p.includes(programF))) return false;
    if (tierF !== 'All' && l.tier !== tierF) return false;
    if (statusF !== 'All' && l.status !== statusF) return false;
    if (cohortF !== 'All' && l.cohort !== cohortF) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const upsell = learners.filter(l => l.upsellEligible).length;
  const active = learners.filter(l => l.status === 'Active').length;
  const completed = learners.filter(l => l.status === 'Completed').length;
  const completionRate = learners.length > 0 ? Math.round((completed / learners.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Learner Directory</h1>
          <p className="mt-0.5 text-sm text-slate-500">{loading ? 'Loading…' : `${learners.length} total learners`} · Director / Manager view</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Learner
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Learners',        value: loading ? '—' : learners.length.toString(), sub: 'all-time', color: 'text-indigo-400' },
          { label: 'Active This Month',      value: active.toString(), sub: 'enrolled & learning',       color: 'text-emerald-400' },
          { label: 'Completion Rate',        value: `${completionRate}%`, sub: 'Tier 1 completions',     color: 'text-violet-400'  },
          { label: 'Upsell Candidates',      value: upsell.toString(), sub: 'Tier 1 → Tier 2 eligible',  color: 'text-amber-400'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Upsell Banner */}
      {upsell > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          <p className="text-sm font-semibold text-amber-300">{upsell} Tier 1 graduates eligible for CEPC upgrade at ₹500 off</p>
          <button className="ml-auto shrink-0 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition">
            Send Bulk Offer
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <FilterBar label="Program" options={['All', 'Bootcamp', 'CEPC', 'EALP']} value={programF} onChange={setProgramF} />
        <FilterBar label="Tier" options={['All', 'Tier 1', 'Tier 2', 'Tier 3']} value={tierF} onChange={setTierF} />
        <FilterBar label="Status" options={['All', 'Active', 'Completed', 'Dropped']} value={statusF} onChange={setStatusF} />
        <FilterBar label="Cohort" options={cohorts} value={cohortF} onChange={setCohortF} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {['Learner', 'Enrolled Programs', 'Tier', 'Enrolled', 'Progress', 'Last Active', 'Certificate', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            )}
            {filtered.map(l => (
              <tr key={l.id} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                      {l.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200 text-xs">{l.name}</p>
                      <p className="text-[10px] text-slate-600">{l.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {l.programs.map(p => (
                      <span key={p} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${TIER_STYLE[l.tier]}`}>{l.tier}</span>
                  {l.upsellEligible && (
                    <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">↑ Upsell</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(l.enrolledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${l.progress >= 80 ? 'bg-emerald-500' : l.progress >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                        style={{ width: `${l.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400">{l.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(l.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[9px] font-semibold ${CERT_STYLE[l.certStatus]}`}>{l.certStatus}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[l.status]}`}>{l.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="rounded px-2 py-1 text-[10px] font-medium bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition whitespace-nowrap">Send Msg</button>
                    <Link href={`/academy/learners/${l.id}`} className="rounded px-2 py-1 text-[10px] font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition">Profile</Link>
                    {l.upsellEligible && (
                      <button className="rounded px-2 py-1 text-[10px] font-medium bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition">Flag ↑</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-600">No learners match filters.</div>
        )}
      </div>
    </div>
  );
}
