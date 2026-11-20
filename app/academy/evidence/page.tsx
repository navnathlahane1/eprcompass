'use client';

import { useState } from 'react';

const EVIDENCE: { id: string; title: string; type: string; program: string; date: string; size: string; tags: string[]; format: string; compliant: boolean }[] = [];

const TYPE_META: Record<string, { icon: string; color: string }> = {
  'Attendance Sheet': { icon: '📋', color: 'bg-blue-500/15 text-blue-300' },
  'Photos':           { icon: '📷', color: 'bg-amber-500/15 text-amber-300' },
  'Presentation':     { icon: '📊', color: 'bg-violet-500/15 text-violet-300' },
  'Video':            { icon: '🎥', color: 'bg-rose-500/15 text-rose-300' },
  'Certificates':     { icon: '🏆', color: 'bg-yellow-500/15 text-yellow-300' },
  'Feedback':         { icon: '📝', color: 'bg-emerald-500/15 text-emerald-300' },
  'Awareness Material':{ icon: '📢', color: 'bg-teal-500/15 text-teal-300' },
};

export default function EvidencePage() {
  const [search, setSearch] = useState('');
  const [typeF,  setTypeF]  = useState('All');

  const types = ['All', ...Object.keys(TYPE_META)];
  const filtered = EVIDENCE.filter(e => {
    if (typeF !== 'All' && e.type !== typeF) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Evidence Repository</h1>
          <p className="mt-0.5 text-sm text-slate-500">Compliance-ready evidence for EPR audits and annual returns</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
            Export Bundle
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            + Upload Evidence
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Items',       value: EVIDENCE.length,                                  accent: 'bg-indigo-500',  color: 'text-indigo-400' },
          { label: 'Compliance Ready',  value: EVIDENCE.filter(e => e.compliant).length,         accent: 'bg-emerald-500', color: 'text-emerald-400' },
          { label: 'Needs Attention',   value: EVIDENCE.filter(e => !e.compliant).length,        accent: 'bg-rose-500',    color: 'text-rose-400'   },
          { label: 'Evidence Types',    value: Object.keys(TYPE_META).length,                    accent: 'bg-violet-500',  color: 'text-violet-400' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search evidence…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <select value={typeF} onChange={e => setTypeF(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {filtered.map(ev => {
          const meta = TYPE_META[ev.type] ?? { icon: '📄', color: 'bg-slate-700 text-slate-400' };
          return (
            <div key={ev.id} className="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 transition hover:border-slate-700">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-200 truncate">{ev.title}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>{ev.type}</span>
                  {ev.compliant
                    ? <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400"><svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Audit Ready</span>
                    : <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/15 text-rose-300">Review Needed</span>
                  }
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{ev.program} · {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {ev.size} · {ev.format}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {ev.tags.map(t => (
                    <span key={t} className="rounded px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-500">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-slate-600">{ev.id}</span>
                <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">Download</button>
                <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">View</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
