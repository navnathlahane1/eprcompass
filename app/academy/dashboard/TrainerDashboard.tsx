'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import TeamWidget from '@/components/academy/TeamWidget';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildAcademyTrainerSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

interface TrainerKpis {
  upcomingSessions: number;
  completedSessions: number;
  totalParticipants: number;
  avgAttendanceRate: number;
  attendancePending: number;
  thisMonthSessions: number;
}

interface MySession {
  id: string;
  title: string;
  program_title: string;
  program_type: string;
  delivery_mode: string;
  scheduled_date: string;
  registered_count: number;
  capacity: number;
  status: 'upcoming' | 'completed';
  attendance_marked: boolean;
}

interface DashData {
  kpis: TrainerKpis;
  sessions: MySession[];
}

function relDate(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400_000);
  if (days < 0)   return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7)  return `in ${days}d`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const MODE_BADGE: Record<string, string> = {
  'Online Live': 'bg-blue-500/15 text-blue-300',
  'Classroom':   'bg-amber-500/15 text-amber-300',
  'Hybrid':      'bg-violet-500/15 text-violet-300',
  'Self-Paced':  'bg-emerald-500/15 text-emerald-300',
};


function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

export default function TrainerDashboard({ userName }: { userName?: string }) {
  const [data, setData]       = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  const todayLabel = useMemo(() => {
    try { return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return new Date().toDateString(); }
  }, []);

  useEffect(() => {
    fetch('/api/academy/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Shimmer className="h-6 w-56" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[...Array(6)].map((_,i) => <Shimmer key={i} className="h-24 rounded-xl" />)}</div>
        <Shimmer className="h-72 rounded-xl" />
      </div>
    );
  }

  const k = data!.kpis;
  const upcoming  = data!.sessions.filter(s => s.status === 'upcoming');
  const completed = data!.sessions.filter(s => s.status === 'completed');
  const needsAttendance = completed.filter(s => !s.attendance_marked);

  const trainerSetupSteps = buildAcademyTrainerSetupSteps({
    hasProfile: !!userName,
    hasUpcomingSession: upcoming.length > 0,
  });

  return (
    <div className="space-y-6">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={trainerSetupSteps}
          portalKey={`academy-trainer-${userName ?? 'unknown'}`}
          accentColor="emerald"
        />
      </TourTarget>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            {userName ? `Hi, ${userName.split(' ')[0]} 👋` : 'Trainer Dashboard'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{todayLabel}</p>
        </div>
        <Link href="/academy/calendar"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          My Calendar
        </Link>
      </div>

      {/* Attendance alert */}
      {needsAttendance.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-900/40 bg-amber-500/10 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          <p className="text-sm text-amber-300 flex-1">
            <span className="font-semibold">{needsAttendance.length} session{needsAttendance.length > 1 ? 's' : ''}</span> need attendance marking
          </p>
          <Link href="/academy/attendance" className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30">
            Mark Now →
          </Link>
        </div>
      )}

      {/* KPI Grid */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Upcoming Sessions',   value: k.upcomingSessions,   color: 'text-indigo-400',  border: 'border-indigo-900/40',   iconBg: 'bg-indigo-500/15',  iconColor: 'text-indigo-400',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Completed Sessions',  value: k.completedSessions,  color: 'text-emerald-400', border: 'border-emerald-900/40',  iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Participants',  value: k.totalParticipants,  color: 'text-slate-100',   border: 'border-slate-800/80',    iconBg: 'bg-slate-700/50',   iconColor: 'text-slate-400',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Avg Attendance Rate', value: `${k.avgAttendanceRate}%`, color: k.avgAttendanceRate >= 80 ? 'text-emerald-400' : 'text-amber-400', border: 'border-slate-800/80', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { label: 'This Month',          value: k.thisMonthSessions,  color: 'text-violet-400',  border: 'border-violet-900/30',   iconBg: 'bg-violet-500/15',  iconColor: 'text-violet-400',  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Attendance Pending',  value: k.attendancePending,  color: k.attendancePending > 0 ? 'text-amber-400' : 'text-emerald-400', border: k.attendancePending > 0 ? 'border-amber-900/30' : 'border-slate-800/80', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        ].map(m => (
          <div key={m.label} className={`overflow-hidden rounded-xl border ${m.border} bg-[#0c1022] p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className={`mt-1.5 text-3xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.iconBg}`}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${m.iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={m.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </TourTarget>

      {/* Upcoming Sessions */}
      <TourTarget id="dash-primary-list" className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">My Upcoming Sessions</h2>
            <p className="mt-0.5 text-[11px] text-slate-600">{upcoming.length} scheduled</p>
          </div>
          <Link href="/academy/sessions" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
        </div>
        <div className="space-y-2.5">
          {upcoming.map(s => {
            const fillPct   = s.capacity > 0 ? Math.round((s.registered_count / s.capacity) * 100) : 0;
            const fillColor = fillPct >= 90 ? 'bg-rose-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500';
            const dateStr   = relDate(s.scheduled_date);
            const isImminent = ['Today', 'Tomorrow'].includes(dateStr) || dateStr.startsWith('in ') && parseInt(dateStr.split(' ')[1]) <= 2;
            return (
              <Link key={s.id} href={`/academy/sessions/${s.id}`}
                className={`flex items-start gap-3 rounded-lg border p-3 transition hover:bg-slate-800/20
                  ${isImminent ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-800/50'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-slate-200 truncate">{s.title}</p>
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${MODE_BADGE[s.delivery_mode] ?? 'bg-slate-700 text-slate-400'}`}>
                      {s.delivery_mode}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{s.program_title} · {s.program_type}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${fillColor} transition-all`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-500">{s.registered_count} participants</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[11px] font-semibold ${isImminent ? 'text-indigo-300' : 'text-indigo-400'}`}>{dateStr}</p>
                  {isImminent && <p className="mt-0.5 text-[9px] font-bold text-indigo-500 uppercase">Soon</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </TourTarget>

      {/* Recent Completed */}
      {completed.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Recently Completed</h2>
            <Link href="/academy/sessions" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
          </div>
          <div className="space-y-2">
            {completed.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-800/40 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-300 truncate">{s.title}</p>
                  <p className="text-[10px] text-slate-500">{s.program_title} · {s.registered_count} participants</p>
                </div>
                <div className="shrink-0 text-right">
                  {s.attendance_marked ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Marked
                    </span>
                  ) : (
                    <Link href="/academy/attendance"
                      className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-400 hover:bg-amber-500/25 transition">
                      Mark Attendance
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Coordinator */}
      <TeamWidget viewerRole="trainer" />

      {/* Quick links */}
      <TourTarget id="dash-quick-actions" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/academy/lms',        label: 'Learning Hub',       icon: 'M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',               bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
          { href: '/academy/attendance', label: 'Mark Attendance',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
          { href: '/academy/calendar',   label: 'Training Calendar',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',                                                         bg: 'bg-slate-700/40 border-slate-700/60 text-slate-400' },
          { href: '/academy/sessions',   label: 'All Sessions',       icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',                                                                                                                 bg: 'bg-slate-700/40 border-slate-700/60 text-slate-400' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`flex items-center gap-2.5 rounded-xl border p-3 transition hover:brightness-110 ${a.bg}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
            <span className="text-xs font-semibold">{a.label}</span>
          </Link>
        ))}
      </TourTarget>

    </div>
  );
}
