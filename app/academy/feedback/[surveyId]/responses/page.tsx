'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

const SURVEY_META: Record<string, { name: string; program: string; type: string }> = {
  'sv-001': { name: 'Post-Session Survey – Tier 1', program: 'Tier 1 – Foundation', type: 'Post-Session' },
  'sv-002': { name: 'Program Completion Survey – Tier 1', program: 'Tier 1 – Foundation', type: 'Post-Program' },
  'sv-003': { name: 'Post-Session Survey – Tier 2', program: 'Tier 2 – Professional', type: 'Post-Session' },
  'sv-004': { name: 'Program Completion Survey – Tier 2', program: 'Tier 2 – Professional', type: 'Post-Program' },
  'sv-005': { name: 'Trainer Effectiveness Survey', program: 'All', type: 'Post-Session' },
  'sv-006': { name: 'Program Completion Survey – Tier 3', program: 'Tier 3 – Expert', type: 'Post-Program' },
};

const DEFAULT_META = { name: 'Survey Responses', program: 'All', type: 'Post-Session' };

const RESPONSES: { id: string; learner: string; nps: number; trainerRating: number; openAnswer: string; date: string; flagged: boolean }[] = [];

const THEMES: { label: string; size: string; count: number }[] = [];

function npsColor(score: number) {
  if (score >= 9) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
  if (score >= 7) return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
  return 'bg-red-500/15 text-red-400 border-red-500/20';
}

function npsLabel(score: number) {
  if (score >= 9) return 'Promoter';
  if (score >= 7) return 'Passive';
  return 'Detractor';
}

export default function SurveyResponsesPage() {
  const params = useParams();
  const surveyId = typeof params?.surveyId === 'string' ? params.surveyId : 'sv-001';
  const meta = SURVEY_META[surveyId] ?? DEFAULT_META;

  const [responses, setResponses] = useState(RESPONSES);

  const promoters   = responses.filter(r => r.nps >= 9).length;
  const passives    = responses.filter(r => r.nps >= 7 && r.nps < 9).length;
  const detractors  = responses.filter(r => r.nps < 7).length;
  const nps = responses.length > 0 ? Math.round(((promoters - detractors) / responses.length) * 100) : 0;

  const promoterPct   = responses.length > 0 ? Math.round((promoters / responses.length) * 100) : 0;
  const passivePct    = responses.length > 0 ? Math.round((passives / responses.length) * 100) : 0;
  const detractorPct  = responses.length > 0 ? Math.round((detractors / responses.length) * 100) : 0;

  function toggleFlag(id: string) {
    setResponses(prev => prev.map(r => r.id === id ? { ...r, flagged: !r.flagged } : r));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
          <span>Feedback</span><span>/</span><span>Surveys</span><span>/</span><span className="text-slate-400">{meta.name}</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-100">{meta.name}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{meta.program} · {meta.type} · {responses.length} responses</p>
      </div>

      {/* NPS hero */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 flex flex-col items-center justify-center">
          <p className="text-5xl font-black tabular-nums text-indigo-400">{nps}</p>
          <p className="text-xs text-slate-500 mt-1">Net Promoter Score</p>
        </div>
        <div className="sm:col-span-3 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-300">Score Distribution</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-px">
            <div className="bg-emerald-500 transition-all" style={{ width: `${promoterPct}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${passivePct}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${detractorPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Promoters', count: promoters, pct: promoterPct, color: 'text-emerald-400' },
              { label: 'Passives', count: passives, pct: passivePct, color: 'text-amber-400' },
              { label: 'Detractors', count: detractors, pct: detractorPct, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.count}</p>
                <p className="text-[10px] text-slate-600">{s.label} ({s.pct}%)</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Responses feed */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Individual Responses</p>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {responses.length === 0 && (
              <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center text-sm text-slate-600">No records yet.</div>
            )}
            {responses.map(r => (
              <div key={r.id} className={`rounded-xl border bg-[#0c1022] p-4 space-y-3 transition ${r.flagged ? 'border-amber-500/30' : 'border-slate-800/80'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-lg border px-2 py-1 text-sm font-bold tabular-nums ${npsColor(r.nps)}`}>{r.nps}</span>
                    <span className={`text-[10px] font-semibold ${r.nps >= 9 ? 'text-emerald-400' : r.nps >= 7 ? 'text-amber-400' : 'text-red-400'}`}>{npsLabel(r.nps)}</span>
                    <span className="text-slate-200 text-xs font-medium">{r.learner}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-600">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <button onClick={() => toggleFlag(r.id)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${r.flagged ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'border border-slate-700 text-slate-500 hover:border-amber-500/40 hover:text-amber-400'}`}>
                      {r.flagged ? '⚑ Flagged' : 'Flag for Follow-up'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 mb-1">Trainer Rating</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <div key={s} className={`h-3 w-3 rounded-full ${s <= r.trainerRating ? 'bg-amber-400' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 mb-1">Open Feedback</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.openAnswer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Aggregated / Word Cloud */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">NPS Score Breakdown</p>
            <div className="space-y-1.5">
              {Array.from({length: 11}, (_, i) => 10 - i).map(score => {
                const count = responses.filter(r => r.nps === score).length;
                const pct = Math.round((count / responses.length) * 100);
                return (
                  <div key={score} className="flex items-center gap-2">
                    <span className={`w-4 text-[10px] font-bold text-right tabular-nums ${score >= 9 ? 'text-emerald-400' : score >= 7 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${score >= 9 ? 'bg-emerald-500' : score >= 7 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-600 w-5 text-right tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Common Themes</p>
            <div className="flex flex-wrap gap-2 leading-loose">
              {THEMES.map(t => (
                <span key={t.label}
                  className={`${t.size} font-medium rounded-full px-2 py-0.5 cursor-default select-none transition hover:opacity-80 ${
                    t.count >= 10 ? 'bg-indigo-500/20 text-indigo-300' :
                    t.count >= 7  ? 'bg-violet-500/15 text-violet-300' :
                    t.count >= 5  ? 'bg-slate-700 text-slate-300' :
                    'bg-slate-800 text-slate-500'
                  }`}
                  title={`${t.count} mentions`}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Flagged for Follow-up</p>
            {responses.filter(r => r.flagged).length === 0
              ? <p className="text-xs text-slate-600">No responses flagged.</p>
              : responses.filter(r => r.flagged).map(r => (
                <div key={r.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <p className="text-xs font-medium text-amber-300">{r.learner}</p>
                  <p className="text-[10px] text-slate-500">NPS {r.nps} · {r.date}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
