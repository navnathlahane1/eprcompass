'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const WASTE_CATEGORIES: { id: string; label: string; color: string; bg: string; dot: string; programs: number; participants: number; evidence_items: number; last_activity: string; compliant: boolean }[] = [];

const ACTIVITIES: { id: string; title: string; category: string; audience: string; date: string; participants: number; trainer: string; mode: string; evidence: string[] }[] = [];

export default function EPRCompliancePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [showLog, setShowLog]   = useState(false);

  const selectedCat = selected ? WASTE_CATEGORIES.find(c => c.id === selected) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">EPR Awareness Compliance</h1>
          <p className="mt-0.5 text-sm text-slate-500">Track awareness programs by EPR waste category for compliance evidence.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLog(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
            Log Activity
          </button>
          <button onClick={() => router.push('/academy/reports/compliance')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            Generate Evidence Report
          </button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WASTE_CATEGORIES.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {WASTE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelected(selected === cat.id ? null : cat.id)}
            className={`text-left rounded-xl border p-5 transition ${selected === cat.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800/80 bg-[#0c1022] hover:border-slate-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${cat.dot}`} />
                <p className={`text-sm font-semibold ${cat.color}`}>{cat.label}</p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${cat.compliant ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {cat.compliant ? 'On Track' : 'Attention'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className={`text-xl font-bold ${cat.color}`}>{cat.programs}</p>
                <p className="text-[10px] text-slate-600">Programs</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-200">{cat.participants >= 1000 ? `${(cat.participants/1000).toFixed(1)}K` : cat.participants}</p>
                <p className="text-[10px] text-slate-600">Participants</p>
              </div>
              <div>
                <p className="text-xl font-bold text-violet-400">{cat.evidence_items}</p>
                <p className="text-[10px] text-slate-600">Evidence</p>
              </div>
            </div>
            {cat.last_activity !== '—' && (
              <p className="mt-2 text-[10px] text-slate-600">Last activity: {new Date(cat.last_activity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
            {cat.programs === 0 && (
              <p className="mt-2 text-[10px] text-rose-400">No programs conducted yet — schedule awareness activity</p>
            )}
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Awareness Activities Log</h2>
            <p className="mt-0.5 text-[11px] text-slate-600">{ACTIVITIES.length} recorded activities</p>
          </div>
          <button onClick={() => {
            const rows = [['Title','Category','Date','Participants','Trainer','Mode','Evidence'].join(','),
              ...ACTIVITIES.map(a => [a.title, a.category, a.date, a.participants, a.trainer, a.mode, a.evidence.join(';')].join(','))];
            const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'compliance-activities.csv'; a.click();
            URL.revokeObjectURL(url);
          }} className="text-xs text-indigo-400 hover:text-indigo-300 transition">Export CSV</button>
        </div>
        <div className="divide-y divide-slate-800/60">
          {ACTIVITIES.filter(a => !selected || a.category === selectedCat?.label).length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
          )}
          {ACTIVITIES.filter(a => !selected || a.category === selectedCat?.label).map(act => (
            <div key={act.id} className="px-5 py-4 transition hover:bg-slate-800/20">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl border border-slate-700 bg-slate-900/60">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">{new Date(act.date).toLocaleString('en-IN', { month: 'short' })}</p>
                  <p className="text-xl font-bold text-slate-200 leading-tight">{new Date(act.date).getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{act.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className={`${WASTE_CATEGORIES.find(c => c.label === act.category)?.color ?? 'text-slate-400'}`}>{act.category}</span>
                    <span>·</span><span>{act.audience}</span>
                    <span>·</span><span>{act.trainer}</span>
                    <span>·</span><span>{act.mode}</span>
                    <span>·</span><span className="text-emerald-400 font-semibold">{act.participants} participants</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {act.evidence.map(ev => (
                      <span key={ev} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => router.push('/academy/evidence')} className="rounded px-2 py-1 text-[10px] font-medium bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition">Evidence</button>
                  <button onClick={() => router.push('/academy/reports/compliance')} className="rounded px-2 py-1 text-[10px] font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition">Report</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Activity Modal (simplified inline) */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0c1022] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-200">Log Awareness Activity</h3>
              <button onClick={() => setShowLog(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {[
              { label: 'Activity Title', type: 'text',   ph: 'e.g. Plastic Waste Consumer Awareness Drive' },
              { label: 'Date',           type: 'date',   ph: '' },
              { label: 'Location',       type: 'text',   ph: 'City / Venue / Online' },
              { label: 'Participants',   type: 'number', ph: '0' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
                <input type={f.type} placeholder={f.ph}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">EPR Waste Category</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {WASTE_CATEGORIES.map(c => <option key={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowLog(false)}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
                Save Activity
              </button>
              <button onClick={() => setShowLog(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
