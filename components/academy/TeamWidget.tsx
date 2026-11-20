'use client';

/**
 * TeamWidget — shows relevant team members based on the viewer's role.
 * Used in all 5 academy dashboards.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  stats?: Record<string, number>;
  latest_review?: { score_overall: number | null; review_period: string } | null;
  sessions?: { id: string; title: string; scheduled_date: string }[];
}

interface Coordinator {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  academy_director:         'Academy Director',
  academy_manager:          'Academy Manager',
  training_program_manager: 'Program Manager',
  trainer:                  'Trainer',
  guest_trainer:            'Guest Trainer',
};

const ROLE_COLORS: Record<string, string> = {
  academy_manager:          'bg-indigo-500/20 text-indigo-300',
  training_program_manager: 'bg-violet-500/20 text-violet-300',
  trainer:                  'bg-emerald-500/20 text-emerald-300',
  guest_trainer:            'bg-amber-500/20 text-amber-300',
  academy_director:         'bg-indigo-500/20 text-indigo-300',
};

interface Props {
  viewerRole: string;
  /** Director only: show evaluate button */
  showEvaluate?: boolean;
}

export default function TeamWidget({ viewerRole, showEvaluate }: Props) {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/academy/team')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">My Team</p>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800/60" />
          ))}
        </div>
      </div>
    );
  }

  // ── Director: full team ──────────────────────────────────────────────────────
  if (viewerRole === 'academy_director' || viewerRole === 'admin') {
    const team: TeamMember[] = data?.team ?? [];
    if (!team.length) return null;

    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Academy Team ({team.length})
          </p>
          {showEvaluate && (
            <Link href="/academy/performance" className="text-xs text-indigo-400 hover:text-indigo-300">
              Evaluate →
            </Link>
          )}
        </div>
        <div className="space-y-1.5">
          {team.slice(0, 6).map(m => {
            const initials = (m.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const rc = ROLE_COLORS[m.role] ?? 'bg-slate-700/40 text-slate-400';
            return (
              <div key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-800/30 transition">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${rc}`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate">{m.full_name ?? m.email}</p>
                  <p className="text-[10px] text-slate-600">{ROLE_LABELS[m.role] ?? m.role}</p>
                </div>
                {m.latest_review?.score_overall && (
                  <span className={`text-[10px] font-bold shrink-0 ${m.latest_review.score_overall >= 4 ? 'text-emerald-400' : m.latest_review.score_overall >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {m.latest_review.score_overall}/5
                  </span>
                )}
                {showEvaluate && (
                  <Link href={`/academy/performance/${m.id}`}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 hover:text-indigo-400 transition">
                    Review
                  </Link>
                )}
              </div>
            );
          })}
          {team.length > 6 && (
            <Link href="/academy/performance"
              className="block pt-1 text-center text-[11px] text-slate-600 hover:text-indigo-400 transition">
              +{team.length - 6} more →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Manager: program managers + trainers ─────────────────────────────────────
  if (viewerRole === 'academy_manager') {
    const team: TeamMember[] = data?.team ?? [];
    if (!team.length) return null;

    const pms      = team.filter(m => m.role === 'training_program_manager');
    const trainers = team.filter(m => m.role === 'trainer' || m.role === 'guest_trainer');

    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">My Team</p>

        {pms.length > 0 && (
          <div>
            <p className="text-[10px] text-violet-500 font-semibold mb-1.5">Program Managers</p>
            {pms.map(m => <MemberRow key={m.id} member={m} />)}
          </div>
        )}
        {trainers.length > 0 && (
          <div>
            <p className="text-[10px] text-emerald-500 font-semibold mb-1.5">Trainers</p>
            {trainers.slice(0, 4).map(m => <MemberRow key={m.id} member={m} />)}
            {trainers.length > 4 && (
              <p className="text-[10px] text-slate-600 pt-1">+{trainers.length - 4} more trainers</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Program Manager: trainers ────────────────────────────────────────────────
  if (viewerRole === 'training_program_manager') {
    const team: TeamMember[] = data?.team ?? [];
    if (!team.length) {
      return (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">My Trainers</p>
          <p className="text-xs text-slate-600">No trainers assigned to your sessions yet.</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          My Trainers ({team.length})
        </p>
        <div className="space-y-1.5">
          {team.map(m => (
            <div key={m.id} className="space-y-1">
              <MemberRow member={m} />
              {m.sessions && m.sessions.length > 0 && (
                <div className="ml-9 text-[10px] text-slate-600">
                  Next: {m.sessions.filter(s => new Date(s.scheduled_date) > new Date())[0]?.title?.slice(0, 40) ?? 'No upcoming sessions'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Trainer / Guest Trainer: show coordinators ───────────────────────────────
  if (viewerRole === 'trainer' || viewerRole === 'guest_trainer') {
    const coordinators: Coordinator[] = data?.coordinators ?? [];
    if (!coordinators.length) return null;

    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">My Coordinators</p>
        <div className="space-y-1.5">
          {coordinators.map(c => {
            const initials = (c.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const rc = ROLE_COLORS[c.role] ?? 'bg-slate-700/40 text-slate-400';
            return (
              <div key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${rc}`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate">{c.full_name ?? '—'}</p>
                  <p className="text-[10px] text-slate-500">{ROLE_LABELS[c.role] ?? c.role} · {c.email}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

function MemberRow({ member: m }: { member: TeamMember }) {
  const initials = (m.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const rc = ROLE_COLORS[m.role] ?? 'bg-slate-700/40 text-slate-400';
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-800/30 transition">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${rc}`}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-200 truncate">{m.full_name ?? m.email}</p>
        <p className="text-[10px] text-slate-600">{ROLE_LABELS[m.role] ?? m.role}</p>
      </div>
    </div>
  );
}
