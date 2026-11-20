'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function OpsResearchPage() {
  const [notes, setNotes]     = useState('');
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ops/daily-log').then(r => r.json()).then(d => {
      if (d.log?.deliverables) setNotes(d.log.deliverables);
      setLoading(false);
    });
  }, []);

  async function saveNotes() {
    setSaving(true);
    await fetch('/api/ops/daily-log', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverables: notes }),
    });
    setSaving(false);
    trackEvent('Ops Research Notes Saved', {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Research Workspace</h1>
          <p className="text-sm text-slate-500 mt-0.5">Capture notes, insights and findings from your market research</p>
        </div>
        <Link href="/intel" target="_blank"
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg px-3 py-1.5 transition">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Open Intel Portal
        </Link>
      </div>

      {/* Quick links to Intel sections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Company Search', href: '/intel/companies', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { label: 'Market Data',    href: '/intel/market',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { label: 'Penalty Checker', href: '/epr-penalty-checker', icon: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
          { label: 'Knowledge Hub',  href: '/knowledge',        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13' },
        ].map(link => (
          <Link key={link.href} href={link.href} target="_blank"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 hover:border-rose-500/30 hover:bg-rose-500/5 transition group">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-rose-400 group-hover:text-rose-300" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
            </svg>
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Notes workspace */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <p className="text-sm font-semibold text-slate-200">Today's Research Notes</p>
          <button onClick={saveNotes} disabled={saving}
            className="rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-600/30 transition disabled:opacity-50">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Notes'}
          </button>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Capture your research findings here. Include sources, insights, competitor data, market sizing…"
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none min-h-[320px]"
          />
        )}
      </div>

      <p className="text-xs text-slate-600">Notes are saved to today's daily log deliverables. Submit your daily log at end of day.</p>
    </div>
  );
}
