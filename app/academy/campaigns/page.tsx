'use client';

import { useState } from 'react';

const CAMPAIGNS: { id: string; title: string; type: string; channel: string; start: string; end: string; reach: number; engagement: number; participants: number; status: string; budget: number; waste: string }[] = [];

const STATUS_META: Record<string, string> = {
  Active:    'bg-emerald-500/15 text-emerald-300',
  Scheduled: 'bg-indigo-500/15 text-indigo-300',
  Completed: 'bg-slate-500/15 text-slate-400',
  Paused:    'bg-amber-500/15 text-amber-300',
};

const TYPE_META: Record<string, string> = {
  'Digital Campaign': 'bg-blue-500/15 text-blue-300',
  'School Program':   'bg-violet-500/15 text-violet-300',
  'College Program':  'bg-violet-500/15 text-violet-300',
  'Industry Outreach':'bg-amber-500/15 text-amber-300',
  'Public Program':   'bg-emerald-500/15 text-emerald-300',
};

function fmtNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtCur(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function CampaignsPage() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? CAMPAIGNS : CAMPAIGNS.filter(c => c.status === filter);
  const totalReach = filtered.reduce((s, c) => s + c.reach, 0);
  const totalParticipants = filtered.reduce((s, c) => s + c.participants, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Awareness Campaigns</h1>
          <p className="mt-0.5 text-sm text-slate-500">{fmtNum(totalReach)} total reach · {fmtNum(totalParticipants)} participants</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Campaign
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active Campaigns',  value: CAMPAIGNS.filter(c => c.status === 'Active').length,    accent: 'bg-emerald-500', color: 'text-emerald-400' },
          { label: 'Total Reach',       value: fmtNum(CAMPAIGNS.reduce((s,c)=>s+c.reach,0)),            accent: 'bg-indigo-500',  color: 'text-indigo-400'  },
          { label: 'Total Engagement',  value: fmtNum(CAMPAIGNS.reduce((s,c)=>s+c.engagement,0)),        accent: 'bg-violet-500',  color: 'text-violet-400'  },
          { label: 'Total Budget',      value: fmtCur(CAMPAIGNS.reduce((s,c)=>s+c.budget,0)),            accent: 'bg-amber-500',   color: 'text-amber-400'   },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div className="min-w-0">
              <p className={`text-xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex rounded-lg border border-slate-700 overflow-hidden w-fit">
        {['All','Active','Scheduled','Completed','Paused'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs font-medium transition ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {filtered.map(c => {
          const engRate = c.reach > 0 ? Math.round((c.engagement / c.reach) * 100) : 0;
          return (
            <div key={c.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-slate-200">{c.title}</h3>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_META[c.status]}`}>{c.status}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_META[c.type] ?? 'bg-slate-800 text-slate-400'}`}>{c.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{c.waste} · {c.channel} · {new Date(c.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(c.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Reach',        value: fmtNum(c.reach),        color: 'text-indigo-400' },
                      { label: 'Engagement',   value: fmtNum(c.engagement),   color: 'text-violet-400' },
                      { label: 'Participants', value: fmtNum(c.participants),  color: 'text-emerald-400' },
                      { label: 'Budget',       value: fmtCur(c.budget),       color: 'text-amber-400'  },
                    ].map(m => (
                      <div key={m.label}>
                        <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-[10px] text-slate-600">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {c.reach > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-slate-800 overflow-hidden max-w-xs">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(engRate, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{engRate}% engagement rate</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">Manage</button>
                  {c.status === 'Completed' && (
                    <button className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition">Evidence</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
