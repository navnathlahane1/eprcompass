'use client';

import { useState } from 'react';
import TourTarget from '@/components/portal/tour/TourTarget';
import { trackEvent } from '@/lib/analytics';

interface Program {
  id: string;
  title: string;
  description: string | null;
  delivery_mode: string;
  duration_hours: number | null;
  content_url: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  waste_category: string | null;
}

interface Session {
  id: string;
  program_id: string;
  title: string;
  scheduled_date: string;
  duration_minutes: number | null;
  meeting_link: string | null;
  status: string;
}

interface ProgressRecord {
  program_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
}

interface Props {
  programs: Program[];
  sessions: Session[];
  progressMap: Record<string, ProgressRecord>;
  partnerId: string;
}

const MODE_COLOR: Record<string, string> = {
  'Online Live': 'bg-blue-100 text-blue-800',
  'Recorded':    'bg-violet-100 text-violet-800',
  'Self-Paced':  'bg-emerald-100 text-emerald-800',
  'Hybrid':      'bg-amber-100 text-amber-800',
  'Classroom':   'bg-slate-100 text-slate-700',
};

const PROGRESS_COLOR: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed:   'bg-emerald-100 text-emerald-700',
};

const PROGRESS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
};

function isLive(mode: string) {
  return mode === 'Online Live' || mode === 'Hybrid' || mode === 'Classroom';
}

function isRecorded(mode: string) {
  return mode === 'Recorded' || mode === 'Self-Paced';
}

export default function PartnerTrainingClient({ programs, sessions, progressMap, partnerId }: Props) {
  const [localProgress, setLocalProgress] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(progressMap).map(([k, v]) => [k, v.status]))
  );
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateProgress(programId: string, status: string) {
    setUpdating(programId);
    const res = await fetch(`/api/partner/training/${programId}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      trackEvent('Partner Training Progress Updated', { program_id: programId, status });
      setLocalProgress(p => ({ ...p, [programId]: status }));
    }
    setUpdating(null);
  }

  const completedCount = Object.values(localProgress).filter(s => s === 'completed').length;
  const totalCount = programs.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (programs.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Training & Certification Centre</h1>
          <p className="text-sm text-slate-500">Trainings assigned to you by the academy team will appear here.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-700">No trainings assigned yet</p>
          <p className="mt-1 text-xs text-slate-400">Your relationship manager will assign training programmes to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Training & Certification Centre</h1>
        <p className="text-sm text-slate-500">Complete your assigned programmes to earn your Certified EPR Partner badge.</p>
      </div>

      {/* Progress bar */}
      <TourTarget id="training-progress" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Your Progress</h2>
          <span className={`text-sm font-bold ${progressPct === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {completedCount}/{totalCount} completed
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">{progressPct}% — complete all modules to earn your Certified EPR Partner badge.</p>
      </TourTarget>

      {/* Badge */}
      <div className={`rounded-xl border p-5 shadow-sm flex items-center gap-4 ${progressPct === 100 ? 'border-yellow-300 bg-yellow-50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${progressPct === 100 ? 'border-yellow-400 bg-yellow-100' : 'border-slate-300 bg-white'}`}>
          <svg viewBox="0 0 24 24" className={`h-7 w-7 ${progressPct === 100 ? 'text-yellow-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div>
          <p className={`font-semibold ${progressPct === 100 ? 'text-yellow-800' : 'text-slate-500'}`}>
            Certified EPR Partner {progressPct < 100 && '— Locked'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {progressPct === 100
              ? 'Congratulations! You are a Certified EPR Partner.'
              : `${totalCount - completedCount} module${totalCount - completedCount !== 1 ? 's' : ''} remaining.`}
          </p>
        </div>
        {progressPct < 100 && (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400 ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </div>

      {/* Programme cards */}
      <TourTarget id="training-programs" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map(prog => {
          const prog_status = localProgress[prog.id] || 'not_started';
          const upcomingSessions = sessions.filter(s => s.program_id === prog.id);
          const nextSession = upcomingSessions[0] || null;
          const live = isLive(prog.delivery_mode);
          const recorded = isRecorded(prog.delivery_mode);
          const isUpdating = updating === prog.id;

          return (
            <div key={prog.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 leading-snug flex-1">{prog.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${MODE_COLOR[prog.delivery_mode] || 'bg-slate-100 text-slate-600'}`}>
                  {prog.delivery_mode}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2">
                {prog.waste_category && (
                  <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">{prog.waste_category}</span>
                )}
                {prog.duration_hours && (
                  <span className="text-[11px] text-slate-400">{prog.duration_hours}h</span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PROGRESS_COLOR[prog_status]}`}>
                  {PROGRESS_LABEL[prog_status]}
                </span>
              </div>

              {prog.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{prog.description}</p>
              )}

              {/* Live session info */}
              {live && nextSession && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 space-y-1">
                  <p className="text-xs font-semibold text-blue-800">Next Live Session</p>
                  <p className="text-xs text-blue-700 font-medium">
                    {new Date(nextSession.scheduled_date).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {' · '}
                    {new Date(nextSession.scheduled_date).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                    {nextSession.duration_minutes ? ` (${nextSession.duration_minutes} min)` : ''}
                  </p>
                  {nextSession.meeting_link && (
                    <a
                      href={nextSession.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      Join Meeting
                    </a>
                  )}
                </div>
              )}

              {live && !nextSession && (
                <p className="text-xs text-slate-400 italic">No upcoming sessions scheduled yet.</p>
              )}

              {/* Recorded content */}
              {recorded && prog.content_url && (
                <a
                  href={prog.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch / Start Module
                </a>
              )}

              {recorded && !prog.content_url && (
                <p className="text-xs text-slate-400 italic">Content coming soon.</p>
              )}

              {/* Progress actions */}
              <div className="mt-auto pt-1 flex gap-2 flex-wrap">
                {prog_status === 'not_started' && (
                  <button
                    onClick={() => updateProgress(prog.id, 'in_progress')}
                    disabled={isUpdating}
                    className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white transition text-center"
                  >
                    {isUpdating ? 'Updating…' : 'Start Module'}
                  </button>
                )}
                {prog_status === 'in_progress' && (
                  <button
                    onClick={() => updateProgress(prog.id, 'completed')}
                    disabled={isUpdating}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white transition text-center"
                  >
                    {isUpdating ? 'Updating…' : 'Mark as Complete'}
                  </button>
                )}
                {prog_status === 'completed' && (
                  <div className="flex-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Completed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </TourTarget>
    </div>
  );
}
