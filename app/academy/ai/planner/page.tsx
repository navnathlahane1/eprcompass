'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Gap {
  category: string;
  stakeholder: string;
  priority: 'High' | 'Medium' | 'Low';
  programs_needed: number;
  last_covered: string;
  recommendation: string;
}

interface Plan {
  title: string;
  programs: number;
  reach: number;
  compliance_score: number;
  budget_est: string;
}

const PRIORITY_META: Record<string, string> = {
  High:   'bg-rose-500/15 text-rose-300',
  Medium: 'bg-amber-500/15 text-amber-300',
  Low:    'bg-emerald-500/15 text-emerald-300',
};

export default function AIPlannerPage() {
  const [quarter, setQuarter]   = useState('Q3 2026 (Jul–Sep)');
  const [focus, setFocus]       = useState('All Waste Categories');
  const [generating, setGenerating] = useState(false);
  const [gaps, setGaps]         = useState<Gap[]>([]);
  const [plan, setPlan]         = useState<Plan | null>(null);
  const [error, setError]       = useState('');

  async function generate() {
    setGenerating(true);
    setError('');
    setGaps([]);
    setPlan(null);

    try {
      const res = await fetch('/api/academy/ai/training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter, focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      trackEvent('AI Training Plan Generated', { quarter, focus });
      setGaps(data.gaps ?? []);
      setPlan(data.plan ?? null);
    } catch (e: any) {
      setError(e.message || 'Failed to generate training plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2m-4 0H9m4 0v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4m4 0H9" /></svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">AI Training Planner</h1>
        </div>
        <p className="text-sm text-slate-500">AI identifies compliance gaps and recommends optimal training plans for stakeholder coverage.</p>
      </div>

      {/* AI Plan Generator */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">Generate AI Training Plan</p>
            <p className="text-[11px] text-slate-400">AI will analyse compliance gaps and generate an optimal quarterly training plan</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Quarter</label>
            <select value={quarter} onChange={e => setQuarter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Q3 2026 (Jul–Sep)</option>
              <option>Q4 2026 (Oct–Dec)</option>
              <option>Q1 2027 (Jan–Mar)</option>
              <option>Q2 2027 (Apr–Jun)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Focus</label>
            <select value={focus} onChange={e => setFocus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>All Waste Categories</option>
              <option>Plastic Waste</option>
              <option>E-Waste</option>
              <option>Battery Waste</option>
              <option>Tyre Waste</option>
              <option>Used Oil</option>
            </select>
          </div>
        </div>
        <button onClick={generate} disabled={generating}
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50">
          {generating ? 'AI is analysing compliance data…' : 'Generate Optimal Training Plan'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Compliance Gap Analysis */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Compliance Gap Analysis</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">AI-identified missing stakeholder coverage</p>
            </div>
            <span className="rounded-md px-2 py-1 text-[10px] font-bold bg-rose-500/15 text-rose-300">
              {gaps.filter(g => g.priority === 'High').length} High Priority Gaps
            </span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {gaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 mt-0.5 ${PRIORITY_META[gap.priority]}`}>{gap.priority}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{gap.category} — {gap.stakeholder}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{gap.recommendation}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Last covered: {gap.last_covered} · {gap.programs_needed} programs needed</p>
                </div>
                <button className="shrink-0 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
                  Schedule
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-bold text-emerald-300">AI Plan Generated: {plan.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Programs',    value: String(plan.programs) },
              { label: 'Est. Reach',  value: plan.reach.toLocaleString('en-IN') },
              { label: 'Compliance',  value: `${plan.compliance_score}%` },
              { label: 'Budget Est.', value: plan.budget_est },
            ].map(m => (
              <div key={m.label} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                <p className="text-lg font-bold text-emerald-300">{m.value}</p>
                <p className="text-[10px] text-emerald-500/70">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">Adopt Plan</button>
            <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">Export</button>
          </div>
        </div>
      )}

      {!generating && gaps.length === 0 && !plan && !error && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2m-4 0H9m4 0v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4m4 0H9"/></svg>
          <p className="text-sm text-slate-600">Select quarter and focus, then click Generate to see AI-powered compliance gap analysis.</p>
        </div>
      )}
    </div>
  );
}
