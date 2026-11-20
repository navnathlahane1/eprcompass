'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  joined_at: string | null;
  stats: {
    programs_managed?: number;
    sessions_total?: number;
    sessions_upcoming?: number;
    avg_feedback?: number;
  };
  latest_review: {
    score_overall: number | null;
    review_period: string;
    status: string;
  } | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  academy_manager:          'Academy Manager',
  training_program_manager: 'Program Manager',
  trainer:                  'Trainer',
  guest_trainer:            'Guest Trainer',
};

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  academy_manager:          { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  dot: 'bg-indigo-500'  },
  training_program_manager: { bg: 'bg-violet-500/15',  text: 'text-violet-400',  dot: 'bg-violet-500'  },
  trainer:                  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  guest_trainer:            { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
};

function ScoreBadge({ score }: { score: number | null }) {
  if (!score) return <span className="text-[11px] text-slate-600">Not reviewed</span>;
  const color = score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-amber-400' : 'text-rose-400';
  const stars = Math.round(score);
  return (
    <span className={`text-sm font-bold tabular-nums ${color}`}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)} {score.toFixed(1)}
    </span>
  );
}

function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const [team,    setTeam]    = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState<string>('all');

  useEffect(() => {
    fetch('/api/academy/team')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setTeam(d.team ?? []);
      })
      .catch(() => setError('Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  const roleOrder = ['academy_manager', 'training_program_manager', 'trainer', 'guest_trainer'];
  const filtered  = filter === 'all' ? team : team.filter(m => m.role === filter);
  const grouped   = roleOrder.reduce<Record<string, TeamMember[]>>((acc, r) => {
    acc[r] = filtered.filter(m => m.role === r);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  const totalReviewed = team.filter(m => m.latest_review).length;
  const avgScore = (() => {
    const scores = team.map(m => m.latest_review?.score_overall).filter(Boolean) as number[];
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  })();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Performance Evaluation</h1>
          <p className="mt-0.5 text-sm text-slate-500">Evaluate and track your academy team's performance</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Team',        value: team.length,      color: 'text-slate-100',   accent: 'bg-slate-700'    },
          { label: 'Reviewed',          value: totalReviewed,    color: 'text-indigo-400',  accent: 'bg-indigo-500'   },
          { label: 'Pending Review',    value: team.length - totalReviewed, color: 'text-amber-400', accent: 'bg-amber-500' },
          { label: 'Avg Team Score',    value: avgScore ? `${avgScore}/5` : '—', color: 'text-emerald-400', accent: 'bg-emerald-500' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div>
              <p className={`text-2xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { key: 'all',                     label: `All (${team.length})` },
          { key: 'academy_manager',          label: `Managers (${team.filter(m=>m.role==='academy_manager').length})` },
          { key: 'training_program_manager', label: `Program Mgrs (${team.filter(m=>m.role==='training_program_manager').length})` },
          { key: 'trainer',                  label: `Trainers (${team.filter(m=>m.role==='trainer').length})` },
          { key: 'guest_trainer',            label: `Guest Trainers (${team.filter(m=>m.role==='guest_trainer').length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition
              ${filter === t.key
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 border border-transparent hover:border-slate-700 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {/* Team by role group */}
      {!loading && !error && roleOrder.map(role => {
        const members = grouped[role];
        if (!members?.length) return null;
        const rc = ROLE_COLORS[role] ?? { bg: 'bg-slate-700/30', text: 'text-slate-400', dot: 'bg-slate-500' };
        return (
          <div key={role}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${rc.dot}`} />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {ROLE_LABELS[role]} ({members.length})
              </h2>
            </div>

            <div className="space-y-2">
              {members.map(m => {
                const initials = (m.full_name || m.email || '?')
                  .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const needsReview = !m.latest_review;

                return (
                  <div key={m.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">

                    {/* Avatar */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${rc.bg} ${rc.text} text-xs font-bold`}>
                      {initials}
                    </div>

                    {/* Name + role */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-200">{m.full_name || '—'}</p>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${rc.bg} ${rc.text}`}>
                          {ROLE_LABELS[role]}
                        </span>
                        {needsReview && (
                          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                            Not yet reviewed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0">
                      {role === 'academy_manager' || role === 'training_program_manager' ? (
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-200">{m.stats.programs_managed ?? 0}</p>
                          <p className="text-[10px] text-slate-600">Programs</p>
                        </div>
                      ) : (
                        <>
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-200">{m.stats.sessions_total ?? 0}</p>
                            <p className="text-[10px] text-slate-600">Sessions</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-indigo-400">{m.stats.sessions_upcoming ?? 0}</p>
                            <p className="text-[10px] text-slate-600">Upcoming</p>
                          </div>
                          {m.stats.avg_feedback && (
                            <div className="text-center">
                              <p className="text-sm font-bold text-amber-400">{m.stats.avg_feedback}</p>
                              <p className="text-[10px] text-slate-600">Avg Rating</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Latest score */}
                    <div className="hidden md:block shrink-0 text-right min-w-[120px]">
                      {m.latest_review ? (
                        <div>
                          <ScoreBadge score={m.latest_review.score_overall} />
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {m.latest_review.review_period} ·{' '}
                            <span className={m.latest_review.status === 'acknowledged' ? 'text-emerald-500' : 'text-amber-500'}>
                              {m.latest_review.status}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-600">Not reviewed</span>
                      )}
                    </div>

                    {/* Action */}
                    <Link href={`/academy/performance/${m.id}`}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition
                        ${needsReview
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'border border-slate-700 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300'}`}>
                      {needsReview ? 'Evaluate' : 'View / Edit'}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] py-12 text-center">
          <p className="text-sm text-slate-500">No team members found.</p>
        </div>
      )}

    </div>
  );
}
