'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Review {
  id: string;
  review_period: string;
  period_start: string | null;
  period_end: string | null;
  reviewee_role: string;
  status: 'draft' | 'submitted' | 'acknowledged';
  score_overall: number | null;
  score_delivery: number | null;
  score_engagement: number | null;
  score_knowledge: number | null;
  score_punctuality: number | null;
  score_compliance: number | null;
  sessions_conducted: number;
  avg_attendance_rate: number | null;
  avg_feedback_rating: number | null;
  programs_managed: number;
  completion_rate: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  goals_next_period: string | null;
  additional_notes: string | null;
  acknowledged_at: string | null;
  created_at: string;
  reviewer: { id: string; full_name: string | null } | null;
  reviewee: { id: string; full_name: string | null; role: string } | null;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  stats: any;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  academy_manager: 'Academy Manager', training_program_manager: 'Program Manager',
  trainer: 'Trainer', guest_trainer: 'Guest Trainer',
};

const COMPETENCIES: { key: keyof Review; label: string; desc: string }[] = [
  { key: 'score_delivery',    label: 'Content Delivery',  desc: 'Clarity, structure, and quality of session delivery' },
  { key: 'score_engagement',  label: 'Participant Engagement', desc: 'Ability to engage and motivate participants' },
  { key: 'score_knowledge',   label: 'Subject Knowledge', desc: 'Depth of EPR/compliance domain expertise' },
  { key: 'score_punctuality', label: 'Punctuality',       desc: 'On-time delivery and meeting deadlines' },
  { key: 'score_compliance',  label: 'Process Compliance',desc: 'Following academy SOPs and documentation' },
];

const PERIODS = [
  'Q1 2025','Q2 2025','Q3 2025','Q4 2025',
  'H1 2025','H2 2025','FY 2025-26',
];

const SCORE_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

// ── Star rating input ──────────────────────────────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n} type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className={`text-xl transition ${(hover || value) >= n ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'}`}
        >★</button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-xs font-medium text-slate-400">{SCORE_LABELS[value]}</span>
      )}
    </div>
  );
}

// ── Main form state ────────────────────────────────────────────────────────────
interface FormState {
  review_period: string;
  period_start: string;
  period_end: string;
  score_delivery: number;
  score_engagement: number;
  score_knowledge: number;
  score_punctuality: number;
  score_compliance: number;
  sessions_conducted: string;
  avg_attendance_rate: string;
  avg_feedback_rating: string;
  programs_managed: string;
  completion_rate: string;
  strengths: string;
  areas_for_improvement: string;
  goals_next_period: string;
  additional_notes: string;
}

const EMPTY_FORM: FormState = {
  review_period: '', period_start: '', period_end: '',
  score_delivery: 0, score_engagement: 0, score_knowledge: 0,
  score_punctuality: 0, score_compliance: 0,
  sessions_conducted: '', avg_attendance_rate: '', avg_feedback_rating: '',
  programs_managed: '', completion_rate: '',
  strengths: '', areas_for_improvement: '', goals_next_period: '', additional_notes: '',
};

function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function MemberPerformancePage() {
  const { userId } = useParams<{ userId: string }>();
  const router     = useRouter();

  const [member,   setMember]   = useState<TeamMember | null>(null);
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'overview' | 'new'>('overview');
  const [form,     setForm]     = useState<FormState>(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/academy/team').then(r => r.json()),
      fetch(`/api/academy/performance?reviewee_id=${userId}`).then(r => r.json()),
    ]).then(([teamData, perfData]) => {
      const found = (teamData.team ?? []).find((m: TeamMember) => m.id === userId);
      setMember(found ?? null);
      setReviews(perfData.reviews ?? []);
    }).finally(() => setLoading(false));
  }, [userId]);

  function setScore(key: keyof FormState, val: number) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function computeOverall(): number {
    const scores = [
      form.score_delivery, form.score_engagement,
      form.score_knowledge, form.score_punctuality, form.score_compliance,
    ].filter(s => s > 0);
    if (!scores.length) return 0;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }

  async function handleSubmit(status: 'draft' | 'submitted') {
    if (!form.review_period) { setSaveMsg('Please select a review period.'); return; }
    setSaving(true); setSaveMsg('');

    const overall = computeOverall();
    const body = {
      reviewee_id: userId,
      review_period: form.review_period,
      period_start: form.period_start || null,
      period_end:   form.period_end   || null,
      score_overall:    overall || null,
      score_delivery:   form.score_delivery   || null,
      score_engagement: form.score_engagement || null,
      score_knowledge:  form.score_knowledge  || null,
      score_punctuality:form.score_punctuality|| null,
      score_compliance: form.score_compliance || null,
      sessions_conducted:  parseInt(form.sessions_conducted)   || 0,
      avg_attendance_rate: parseFloat(form.avg_attendance_rate)|| null,
      avg_feedback_rating: parseFloat(form.avg_feedback_rating)|| null,
      programs_managed:    parseInt(form.programs_managed)     || 0,
      completion_rate:     parseFloat(form.completion_rate)    || null,
      strengths:            form.strengths            || null,
      areas_for_improvement:form.areas_for_improvement|| null,
      goals_next_period:    form.goals_next_period    || null,
      additional_notes:     form.additional_notes     || null,
      status,
    };

    try {
      const res = await fetch('/api/academy/performance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(data.error || 'Save failed'); return; }
      setReviews(prev => [data.review, ...prev]);
      setForm(EMPTY_FORM);
      setTab('overview');
      setSaveMsg(status === 'submitted' ? 'Review submitted ✓' : 'Draft saved ✓');
      setTimeout(() => setSaveMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm('Delete this draft review?')) return;
    await fetch(`/api/academy/performance/${reviewId}`, { method: 'DELETE' });
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Shimmer className="h-6 w-48" />
        <Shimmer className="h-32 rounded-xl" />
        <Shimmer className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0c1022] p-8 text-center">
        <p className="text-slate-400">Team member not found or not accessible.</p>
        <Link href="/academy/performance" className="mt-3 inline-block text-xs text-indigo-400 hover:text-indigo-300">← Back to team</Link>
      </div>
    );
  }

  const initials = (member.full_name || member.email || '?')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const overall = computeOverall();

  return (
    <div className="space-y-6">

      {/* Back + Header */}
      <div>
        <Link href="/academy/performance" className="text-xs text-slate-500 hover:text-indigo-400 transition">
          ← Performance Evaluation
        </Link>
        <div className="mt-3 flex items-start gap-4 flex-wrap">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 text-lg font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-100">{member.full_name || 'Unknown'}</h1>
              <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                {ROLE_LABELS[member.role] ?? member.role}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{member.email}</p>
          </div>
          <button
            onClick={() => setTab(t => t === 'new' ? 'overview' : 'new')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {tab === 'new' ? 'Cancel' : 'New Review'}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      {(() => {
        const avgScore = (() => {
          const sc = reviews.filter(r => r.score_overall).map(r => r.score_overall as number);
          return sc.length ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) : '—';
        })();
        const stats = (member.role === 'academy_manager' || member.role === 'training_program_manager')
          ? [
              { label: 'Programs Managed', value: member.stats?.programs_managed ?? 0, color: 'text-indigo-400'  },
              { label: 'Total Reviews',    value: reviews.length,                        color: 'text-slate-200'  },
              { label: 'Avg Score',        value: avgScore,                              color: 'text-emerald-400'},
              { label: 'Last Reviewed',    value: reviews[0]?.review_period ?? '—',     color: 'text-slate-400'  },
            ]
          : [
              { label: 'Sessions Total',   value: member.stats?.sessions_total ?? 0,    color: 'text-indigo-400'  },
              { label: 'Upcoming',         value: member.stats?.sessions_upcoming ?? 0, color: 'text-emerald-400' },
              { label: 'Avg Feedback',     value: member.stats?.avg_feedback ? `${member.stats.avg_feedback}/5` : '—', color: 'text-amber-400' },
              { label: 'Total Reviews',    value: reviews.length,                        color: 'text-slate-200'   },
            ];
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
                <div className="min-w-0">
                  <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-600">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Success / error message */}
      {saveMsg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm font-medium
          ${saveMsg.includes('✓') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'}`}>
          {saveMsg}
        </div>
      )}

      {/* New review form */}
      {tab === 'new' && (
        <div className="rounded-xl border border-indigo-500/20 bg-[#0c1022] p-6 space-y-6">
          <h2 className="text-sm font-semibold text-slate-200">New Performance Review</h2>

          {/* Period */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Review Period <span className="text-rose-400">*</span>
              </label>
              <select
                value={form.review_period}
                onChange={e => setForm(f => ({ ...f, review_period: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">Select period…</option>
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Period Start</label>
              <input type="date" value={form.period_start}
                onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Period End</label>
              <input type="date" value={form.period_end}
                onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Competency scores */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Competency Scores</p>
            <div className="space-y-4">
              {COMPETENCIES.map(c => (
                <div key={c.key} className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 w-full sm:w-48 shrink-0">
                    <p className="text-sm font-medium text-slate-200">{c.label}</p>
                    <p className="text-[11px] text-slate-500">{c.desc}</p>
                  </div>
                  <StarInput
                    value={form[c.key] as number}
                    onChange={v => setScore(c.key as keyof FormState, v)}
                  />
                </div>
              ))}
            </div>
            {overall > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5">
                <span className="text-xs text-slate-400">Computed Overall Score:</span>
                <span className="text-lg font-bold text-indigo-300">{overall}/5</span>
                <span className="text-xs text-slate-500">— {SCORE_LABELS[Math.round(overall)]}</span>
              </div>
            )}
          </div>

          {/* Quantitative metrics */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Quantitative Metrics</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { key: 'sessions_conducted',  label: 'Sessions Conducted', type: 'number' },
                { key: 'avg_attendance_rate', label: 'Avg Attendance %',   type: 'number' },
                { key: 'avg_feedback_rating', label: 'Avg Feedback Rating',type: 'number' },
                { key: 'programs_managed',    label: 'Programs Managed',   type: 'number' },
                { key: 'completion_rate',     label: 'Completion Rate %',  type: 'number' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Qualitative Feedback</p>
            <div className="space-y-3">
              {[
                { key: 'strengths',             label: 'Strengths',               placeholder: 'What did this person do exceptionally well?' },
                { key: 'areas_for_improvement', label: 'Areas for Improvement',   placeholder: 'What should they focus on improving?' },
                { key: 'goals_next_period',     label: 'Goals for Next Period',    placeholder: 'SMART goals for the upcoming review period…' },
                { key: 'additional_notes',      label: 'Additional Notes',         placeholder: 'Any other observations or context…' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</label>
                  <textarea
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
            <button
              onClick={() => handleSubmit('draft')} disabled={saving}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSubmit('submitted')} disabled={saving}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
              {saving ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Review history */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Review History ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] py-10 text-center">
            <p className="text-sm text-slate-500">No reviews yet.</p>
            <button onClick={() => setTab('new')} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
              Create the first review →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => {
              const scoreColor = !r.score_overall ? 'text-slate-500'
                : r.score_overall >= 4 ? 'text-emerald-400'
                : r.score_overall >= 3 ? 'text-amber-400'
                : 'text-rose-400';

              return (
                <div key={r.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-200">{r.review_period}</h3>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase
                          ${r.status === 'acknowledged' ? 'bg-emerald-500/15 text-emerald-400'
                          : r.status === 'submitted'    ? 'bg-indigo-500/15 text-indigo-400'
                          : 'bg-slate-700 text-slate-400'}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Reviewed by {r.reviewer?.full_name ?? 'Unknown'} ·{' '}
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.score_overall && (
                        <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
                          {r.score_overall}/5
                        </span>
                      )}
                      {r.status === 'draft' && (
                        <button onClick={() => handleDelete(r.id)}
                          className="rounded-lg border border-rose-900/40 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Score breakdown */}
                  {(r.score_delivery || r.score_engagement || r.score_knowledge) && (
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {COMPETENCIES.map(c => {
                        const val = r[c.key] as number | null;
                        return (
                          <div key={c.key} className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-center">
                            <p className={`text-base font-bold ${val && val >= 4 ? 'text-emerald-400' : val && val >= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                              {val ? `${val}/5` : '—'}
                            </p>
                            <p className="text-[9px] text-slate-600 leading-tight mt-0.5">{c.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Metrics */}
                  {(r.sessions_conducted > 0 || r.programs_managed > 0) && (
                    <div className="mb-4 flex flex-wrap gap-4 text-[11px]">
                      {r.sessions_conducted > 0 && <span className="text-slate-400"><span className="font-semibold text-slate-200">{r.sessions_conducted}</span> sessions</span>}
                      {r.avg_attendance_rate  && <span className="text-slate-400"><span className="font-semibold text-emerald-400">{r.avg_attendance_rate}%</span> attendance</span>}
                      {r.avg_feedback_rating  && <span className="text-slate-400"><span className="font-semibold text-amber-400">{r.avg_feedback_rating}</span> avg feedback</span>}
                      {r.programs_managed > 0  && <span className="text-slate-400"><span className="font-semibold text-slate-200">{r.programs_managed}</span> programs</span>}
                      {r.completion_rate       && <span className="text-slate-400"><span className="font-semibold text-indigo-400">{r.completion_rate}%</span> completion</span>}
                    </div>
                  )}

                  {/* Qualitative */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {r.strengths && (
                      <div className="rounded-lg border border-emerald-900/30 bg-emerald-500/5 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1">Strengths</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{r.strengths}</p>
                      </div>
                    )}
                    {r.areas_for_improvement && (
                      <div className="rounded-lg border border-amber-900/30 bg-amber-500/5 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">Areas for Improvement</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{r.areas_for_improvement}</p>
                      </div>
                    )}
                    {r.goals_next_period && (
                      <div className="rounded-lg border border-indigo-900/30 bg-indigo-500/5 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 mb-1">Goals Next Period</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{r.goals_next_period}</p>
                      </div>
                    )}
                    {r.additional_notes && (
                      <div className="rounded-lg border border-slate-800/40 bg-slate-900/40 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mb-1">Notes</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{r.additional_notes}</p>
                      </div>
                    )}
                  </div>

                  {r.acknowledged_at && (
                    <p className="mt-3 text-[10px] text-emerald-600">
                      ✓ Acknowledged by {member.full_name} on {new Date(r.acknowledged_at).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
