'use client';

import { use, useState } from 'react';
import Link from 'next/link';

interface Submission {
  learner: string;
  submittedDate: string;
  score: number | null;
  maxScore: number;
  status: 'Pass' | 'Fail' | 'Pending';
  feedback: string;
  answers?: number[];
}

interface MCQQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface AssessmentData {
  id: string;
  title: string;
  type: string;
  program: string;
  passMark: number;
  maxScore: number;
  questions?: MCQQuestion[];
  submissions: Submission[];
}

const ASSESSMENTS: Record<string, AssessmentData> = {};

const DEFAULT: AssessmentData = {
  id: '0', title: 'Assessment Not Found', type: 'MCQ', program: 'Tier 1', passMark: 7, maxScore: 10, questions: [], submissions: [],
};

type Tab = 'questions' | 'submissions' | 'grade';

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const data = ASSESSMENTS[resolvedParams.id] ?? DEFAULT;
  const [tab, setTab] = useState<Tab>('questions');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const graded = data.submissions.filter(s => s.score !== null);
  const ungraded = data.submissions.filter(s => s.score === null);
  const passed = graded.filter(s => s.status === 'Pass').length;
  const passRate = graded.length > 0 ? Math.round((passed / graded.length) * 100) : 0;

  // Score distribution
  const ranges = ['0–3', '4–5', '6–7', '8–9', '10'];
  const getBucket = (score: number) => {
    if (score <= 3) return 0;
    if (score <= 5) return 1;
    if (score <= 7) return 2;
    if (score <= 9) return 3;
    return 4;
  };
  const buckets = [0, 0, 0, 0, 0];
  graded.forEach(s => { if (s.score !== null) buckets[getBucket(s.score)]++; });
  const maxBucket = Math.max(...buckets, 1);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'questions',   label: 'Questions'   },
    { key: 'submissions', label: `Submissions (${data.submissions.length})` },
    { key: 'grade',       label: `Grade (${ungraded.length} pending)` },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/academy/assessments" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to Assessments
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">{data.title}</h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-300">{data.program}</span>
              <span className="rounded bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-300">{data.type}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Pass Mark: {data.passMark}/{data.maxScore}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{passRate}%</p>
              <p className="text-[10px] text-slate-500 uppercase">Pass Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-400">{graded.length}</p>
              <p className="text-[10px] text-slate-500 uppercase">Graded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      {graded.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Score Distribution</h3>
          <div className="flex items-end gap-3 h-24">
            {buckets.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-medium">{count}</span>
                <div style={{ height: `${(count / maxBucket) * 64 + (count > 0 ? 4 : 0)}px` }}
                  className={`w-full rounded-t-sm transition-all ${
                    i === 0 ? 'bg-rose-500' :
                    i === 1 ? 'bg-orange-500' :
                    i === 2 ? 'bg-amber-500' :
                    i === 3 ? 'bg-emerald-500' :
                    'bg-violet-500'
                  }`} />
                <span className="text-[10px] text-slate-500">{ranges[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${tab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Questions Tab */}
      {tab === 'questions' && data.questions && (
        <div className="space-y-4">
          {data.questions.length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center text-sm text-slate-600">No records yet.</div>
          )}
          {data.questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
              <div className="flex items-start gap-3">
                <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">{qi + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200 mb-3">{q.question}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${oi === q.correct ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/30'}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${oi === q.correct ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className={`text-xs ${oi === q.correct ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>{opt}</span>
                        {oi === q.correct && <span className="ml-auto text-[10px] text-emerald-400 font-bold">✓ Correct</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions Tab */}
      {tab === 'submissions' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                {['Learner', 'Submitted', 'Score', 'Result', 'Feedback'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {data.submissions.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              )}
              {data.submissions.map((s, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                        {s.learner.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-slate-200">{s.learner}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(s.submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                  <td className="px-4 py-3 text-sm font-bold">
                    {s.score !== null
                      ? <span className={s.score >= data.passMark ? 'text-emerald-400' : 'text-rose-400'}>{s.score}/{s.maxScore}</span>
                      : <span className="text-xs text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                      s.status === 'Pass' ? 'bg-emerald-500/15 text-emerald-300' :
                      s.status === 'Fail' ? 'bg-rose-500/15 text-rose-300' :
                      'bg-amber-500/15 text-amber-300'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[240px] truncate">{s.feedback || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade Tab */}
      {tab === 'grade' && (
        <div className="space-y-4">
          {ungraded.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center text-sm text-slate-600">
              All submissions have been graded.
            </div>
          ) : ungraded.map((s, i) => (
            <div key={i} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-bold">
                    {s.learner.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{s.learner}</p>
                    <p className="text-xs text-slate-500">Submitted {new Date(s.submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">Pending Grade</span>
              </div>
              {/* Learner answers */}
              {data.questions && s.answers && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Submitted Answers</p>
                  {data.questions.map((q, qi) => {
                    const ans = s.answers![qi];
                    const isCorrect = ans === q.correct;
                    return (
                      <div key={qi} className={`rounded-lg border px-3 py-2 ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                        <p className="text-[10px] font-medium text-slate-400">Q{qi + 1}: {q.question}</p>
                        <p className={`text-xs mt-0.5 ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {isCorrect ? '✓' : '✗'} {q.options[ans]} {!isCorrect && <span className="text-slate-500">→ Correct: {q.options[q.correct]}</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Score (out of {s.maxScore})</label>
                  <input type="number" min="0" max={s.maxScore}
                    value={scores[s.learner] ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [s.learner]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Feedback</label>
                  <textarea rows={2} value={feedbacks[s.learner] ?? ''}
                    onChange={e => setFeedbacks(prev => ({ ...prev, [s.learner]: e.target.value }))}
                    placeholder="Optional feedback for the learner…"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition">Approve & Save Grade</button>
                <button className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition">Reject / Request Resubmission</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
