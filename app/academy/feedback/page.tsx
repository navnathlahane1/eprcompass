'use client';

import { useState } from 'react';

const NPS_PROGRAMS: { program: string; nps: number; promoters: number; passives: number; detractors: number; responses: number }[] = [];

const TRAINERS: { name: string; avgRating: number; responses: number; specialization: string }[] = [];

const RECENT_RESPONSES: { id: string; nps: number; program: string; trainer: string; date: string; comment: string }[] = [];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`h-3 w-3 rounded-full ${i <= Math.round(rating) ? 'bg-amber-400' : 'bg-slate-700'}`} />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-slate-300">{rating.toFixed(1)}</span>
    </div>
  );
}

function NpsGauge({ nps, program }: { nps: number; program: string }) {
  const angle = ((nps + 100) / 200) * 180;
  const color = nps >= 70 ? '#10b981' : nps >= 50 ? '#f59e0b' : '#ef4444';
  const r = 40;
  const cx = 55, cy = 55;
  const startAngle = 180;
  const endAngle = startAngle + angle;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = cx + r * Math.cos(toRad(endAngle));
  const arcY = cy + r * Math.sin(toRad(endAngle));
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 flex flex-col items-center gap-2">
      <p className="text-xs font-semibold text-slate-400">{program}</p>
      <svg width="110" height="65" viewBox="0 0 110 65">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${arcX} ${arcY}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="text-xl font-bold" fill={color} fontSize="18" fontWeight="bold">{nps}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fill="#475569" fontSize="8">NPS Score</text>
      </svg>
      <div className="flex gap-2 text-[10px] text-slate-600 w-full justify-between">
        <span className="text-red-400">–100</span>
        <span className="text-amber-400">0</span>
        <span className="text-emerald-400">+100</span>
      </div>
    </div>
  );
}

function npsColor(score: number) {
  if (score >= 9) return 'bg-emerald-500/15 text-emerald-300';
  if (score >= 7) return 'bg-amber-500/15 text-amber-300';
  return 'bg-red-500/15 text-red-400';
}

export default function FeedbackPage() {
  const [programFilter, setProgramFilter] = useState('All');
  const [trainerFilter, setTrainerFilter] = useState('All');

  const filteredResponses = RECENT_RESPONSES.filter(r => {
    if (programFilter !== 'All' && !r.program.includes(programFilter.replace('Tier ', ''))) return false;
    if (trainerFilter !== 'All' && r.trainer !== trainerFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Feedback & NPS Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">{RECENT_RESPONSES.length} recent responses</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      {/* NPS Gauges */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">NPS by Program</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {NPS_PROGRAMS.map(p => <NpsGauge key={p.program} nps={p.nps} program={p.program} />)}
        </div>
      </div>

      {/* NPS breakdown per program */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <p className="text-sm font-semibold text-slate-200 mb-4">Promoters / Passives / Detractors</p>
        <div className="space-y-3">
          {NPS_PROGRAMS.map(p => (
            <div key={p.program} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{p.program}</span>
                <span className="text-slate-600">{p.responses} responses</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                <div className="bg-emerald-500" style={{ width: `${p.promoters}%` }} title={`Promoters ${p.promoters}%`} />
                <div className="bg-amber-400" style={{ width: `${p.passives}%` }} title={`Passives ${p.passives}%`} />
                <div className="bg-red-500" style={{ width: `${p.detractors}%` }} title={`Detractors ${p.detractors}%`} />
              </div>
              <div className="flex gap-4 text-[10px]">
                <span className="text-emerald-400">▲ {p.promoters}% promoters</span>
                <span className="text-amber-400">● {p.passives}% passives</span>
                <span className="text-red-400">▼ {p.detractors}% detractors</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainer Ratings */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-sm font-semibold text-slate-200">Trainer Ratings</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-left">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trainer</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Specialization</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rating</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Responses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {TRAINERS.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              )}
              {TRAINERS.map(t => (
                <tr key={t.name} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 text-slate-200 text-xs font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{t.specialization}</td>
                  <td className="px-4 py-3"><StarRating rating={t.avgRating} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs tabular-nums">{t.responses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Responses */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Recent Responses</p>
          <div className="flex gap-2">
            <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-1.5 text-xs text-slate-300">
              {['All','Tier 1','Tier 2','Tier 3'].map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={trainerFilter} onChange={e => setTrainerFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-1.5 text-xs text-slate-300">
              <option value="All">All Trainers</option>
              {TRAINERS.map(t => <option key={t.name}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {filteredResponses.map(r => (
            <div key={r.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3 flex items-start gap-3">
              <span className={`rounded-lg px-2 py-1 text-sm font-bold tabular-nums shrink-0 ${npsColor(r.nps)}`}>{r.nps}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-600 mb-1">
                  <span className="text-slate-400">{r.program}</span>
                  <span>·</span>
                  <span>{r.trainer}</span>
                  <span>·</span>
                  <span>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{r.comment}</p>
              </div>
            </div>
          ))}
          {filteredResponses.length === 0 && <div className="py-8 text-center text-slate-600 text-sm">No responses match your filters.</div>}
        </div>
      </div>
    </div>
  );
}
