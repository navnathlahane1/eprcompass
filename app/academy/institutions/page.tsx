'use client';

import { useState } from 'react';

const INSTITUTIONS: { id: string; name: string; type: string; location: string; dept: string; students: number; programs: number; mou: boolean; mou_date: string | null; status: string; contact: string; faculty: number; certifications: number }[] = [];

const TYPE_META: Record<string, string> = {
  'Engineering College':    'bg-blue-500/15 text-blue-300',
  'Management Institute':   'bg-violet-500/15 text-violet-300',
  'Environmental Institute':'bg-emerald-500/15 text-emerald-300',
  'University':             'bg-amber-500/15 text-amber-300',
  'Research Institute':     'bg-teal-500/15 text-teal-300',
};

const STATUS_META: Record<string, string> = {
  Active:   'bg-emerald-500/15 text-emerald-300',
  Pending:  'bg-amber-500/15 text-amber-300',
  Prospect: 'bg-slate-700 text-slate-400',
  Inactive: 'bg-rose-500/15 text-rose-300',
};

export default function InstitutionsPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = INSTITUTIONS.filter(i => {
    if (filter !== 'All' && i.status !== filter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Educational Institution Collaborations</h1>
          <p className="mt-0.5 text-sm text-slate-500">{INSTITUTIONS.filter(i => i.mou).length} active MoUs · {INSTITUTIONS.filter(i => i.status === 'Active').length} institutions</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Institution
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All','Active','Pending','Prospect','Inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium transition ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {filtered.map(inst => (
          <div key={inst.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-200">{inst.name}</h3>
                  {inst.mou && (
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-violet-500/20 text-violet-300">MoU</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{inst.dept} · {inst.location}</p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${STATUS_META[inst.status]}`}>{inst.status}</span>
            </div>
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_META[inst.type] ?? 'bg-slate-700 text-slate-400'}`}>{inst.type}</span>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60">
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-400">{inst.students}</p>
                <p className="text-[10px] text-slate-600">Students</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{inst.programs}</p>
                <p className="text-[10px] text-slate-600">Programs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-violet-400">{inst.certifications}</p>
                <p className="text-[10px] text-slate-600">Certificates</p>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Contact: <span className="text-slate-300">{inst.contact}</span>
              {inst.mou_date && (
                <span className="ml-2 text-slate-600">· MoU: {new Date(inst.mou_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">View</button>
              <button className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
