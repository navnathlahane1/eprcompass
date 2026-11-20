'use client';

import { useState } from 'react';
import Link from 'next/link';

type AppStatus = 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | 'Joined' | 'Rejected';

interface Application {
  id: string;
  learner: string;
  company: string;
  role: string;
  appliedDate: string;
  status: AppStatus;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  notes: string;
}

const APPS: Application[] = [];

const STATUS_STYLE: Record<AppStatus, string> = {
  Applied: 'bg-slate-700 text-slate-300',
  Shortlisted: 'bg-blue-500/15 text-blue-300',
  Interview: 'bg-amber-500/15 text-amber-300',
  Offered: 'bg-violet-500/15 text-violet-300',
  Joined: 'bg-emerald-500/15 text-emerald-300',
  Rejected: 'bg-rose-500/15 text-rose-400',
};

const STATUSES: AppStatus[] = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Joined', 'Rejected'];

export default function ApplicationTracker() {
  const [apps, setApps] = useState<Application[]>(APPS);
  const [statusF, setStatusF] = useState('All');
  const [tierF, setTierF] = useState('All');
  const [companyF, setCompanyF] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  function updateStatus(id: string, status: AppStatus) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }
  function updateNotes(id: string, notes: string) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
  }
  function toggleNotes(id: string) {
    setExpandedNotes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const filtered = apps.filter(a => {
    if (statusF !== 'All' && a.status !== statusF) return false;
    if (tierF !== 'All' && a.tier !== tierF) return false;
    if (companyF && !a.company.toLowerCase().includes(companyF.toLowerCase())) return false;
    return true;
  });

  const kpi = (s: AppStatus) => apps.filter(a => a.status === s).length;

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Tracker</h1>
          <p className="text-sm text-slate-400 mt-0.5">All learner job applications · EPR Compass</p>
        </div>
        <Link href="/academy/placement" className="text-sm text-indigo-400 hover:text-indigo-300">← Placement Dashboard</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: apps.length, color: 'text-slate-200' },
          { label: 'Shortlisted', value: kpi('Shortlisted'), color: 'text-blue-400' },
          { label: 'Offers', value: kpi('Offered'), color: 'text-violet-400' },
          { label: 'Joined', value: kpi('Joined'), color: 'text-emerald-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Status Pipeline */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
        <p className="text-xs text-slate-500 uppercase mb-3">Status Pipeline</p>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUSES.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${STATUS_STYLE[s]}`}>
                {s} <span className="opacity-60 ml-1">{kpi(s)}</span>
              </div>
              {i < STATUSES.length - 1 && <span className="text-slate-700">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="bg-[#0c1022] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={tierF} onChange={e => setTierF(e.target.value)}
          className="bg-[#0c1022] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
          <option value="All">All Tiers</option>
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2 (CEPC)</option>
          <option value="Tier 3">Tier 3 (EALP)</option>
        </select>
        <input value={companyF} onChange={e => setCompanyF(e.target.value)} placeholder="Search company..."
          className="bg-[#0c1022] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 w-48" />
        <span className="text-xs text-slate-500">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['#', 'Learner', 'Company', 'Role', 'Applied', 'Tier', 'Status', 'Update Status', 'Notes'].map(h => (
                  <th key={h} className="text-left text-[11px] text-slate-500 uppercase py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              ) : filtered.map(a => (
                <>
                  <tr key={a.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 text-slate-600 text-xs">{a.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">{a.learner}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{a.company}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{a.role}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{a.appliedDate}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full">{a.tier}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <select value={a.status} onChange={e => updateStatus(a.id, e.target.value as AppStatus)}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleNotes(a.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline whitespace-nowrap">
                        {expandedNotes.has(a.id) ? 'Hide' : 'Add Notes'}
                      </button>
                    </td>
                  </tr>
                  {expandedNotes.has(a.id) && (
                    <tr key={`${a.id}-notes`} className="bg-slate-900/40">
                      <td colSpan={9} className="px-6 pb-3 pt-1">
                        <textarea value={a.notes} onChange={e => updateNotes(a.id, e.target.value)}
                          placeholder="Add notes about this application..."
                          className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500 resize-none h-16" />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

