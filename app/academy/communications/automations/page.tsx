'use client';

import { useState, useEffect } from 'react';

type Automation = { id: string; trigger: string; action: string; delay: string; firedCount?: number | null; lastFired?: string | null; status: 'active' | 'paused' };
type LogEntry = { id: string; learner: string; automation: string; firedAt: string; status: string };

export default function AutomationsPage() {
  const [tab, setTab] = useState<'rules' | 'log'>('rules');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [triggerLog, setTriggerLog]   = useState<LogEntry[]>([]);
  const [loadingLog, setLoadingLog]   = useState(false);

  useEffect(() => {
    fetch('/api/academy/automations')
      .then(r => r.json())
      .then(d => setAutomations(d.rules ?? []))
      .catch(() => setAutomations([]))
      .finally(() => setLoadingRules(false));
  }, []);

  useEffect(() => {
    if (tab !== 'log') return;
    setLoadingLog(true);
    fetch('/api/academy/automation-log')
      .then(r => r.json())
      .then(d => { setTriggerLog(d.log ?? []); setLoadingLog(false); })
      .catch(() => setLoadingLog(false));
  }, [tab]);

  const activeCount = automations.filter(a => a.status === 'active').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;

  function toggleStatus(id: string) {
    const current = automations.find(a => a.id === id);
    if (!current) return;
    const newStatus = current.status === 'active' ? 'paused' : 'active';
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    fetch('/api/academy/automations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    }).catch(() => {
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: current.status } : a));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Automation Rules</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            <span className="text-emerald-400 font-medium">{activeCount} active</span>
            {pausedCount > 0 && <>, <span className="text-amber-400 font-medium">{pausedCount} paused</span></>}
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Automation
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-700 overflow-hidden w-fit">
        {(['rules', 'log'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize transition ${tab===t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            {t === 'rules' ? 'Automation Rules' : 'Trigger Log'}
          </button>
        ))}
      </div>

      {tab === 'rules' && loadingRules && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"/>
        </div>
      )}

      {tab === 'rules' && !loadingRules && (
        <div className="space-y-3">
          {automations.map((a, i) => (
            <div key={a.id} className={`rounded-xl border bg-[#0c1022] p-5 transition ${a.status === 'paused' ? 'border-slate-700/50 opacity-70' : 'border-slate-800/80'}`}>
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">TRIGGER</span>
                    <p className="text-sm font-semibold text-slate-200">{a.trigger}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">ACTION</span>
                    <p className="text-xs text-slate-400">{a.action}</p>
                    <span className="text-[10px] text-slate-600">· {a.delay}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-600">
                    <span>Fired <span className="text-slate-400 font-medium">{a.firedCount ?? '—'}</span> times</span>
                    <span>Last fired: <span className="text-slate-400">{a.lastFired ?? '—'}</span></span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${a.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                    {a.status}
                  </span>
                  <button onClick={() => toggleStatus(a.id)}
                    className={`relative h-5 w-9 rounded-full transition ${a.status === 'active' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${a.status === 'active' ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'log' && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Learner</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Automation</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fired At</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loadingLog && (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-500 text-sm">Loading log…</td></tr>
                )}
                {!loadingLog && triggerLog.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-500 text-sm">No trigger history yet.</td></tr>
                )}
                {triggerLog.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 text-slate-200 text-xs font-medium">{l.learner}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{l.automation}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{l.firedAt}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${l.status === 'Delivered' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-400'}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
