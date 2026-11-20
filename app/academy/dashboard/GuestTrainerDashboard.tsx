'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import TeamWidget from '@/components/academy/TeamWidget';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildAcademyGuestTrainerSetupSteps } from '@/components/setup/setupSteps';

interface MySession {
  id: string;
  title: string;
  program_title: string;
  program_type: string;
  delivery_mode: string;
  scheduled_date: string;
  registered_count: number;
  venue?: string;
  coordinator_name: string;
  coordinator_email: string;
  status: 'upcoming' | 'completed';
}

interface DashData {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  sessions: MySession[];
}

function relDate(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400_000);
  if (days < 0)   return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7)  return `in ${days}d`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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

export default function GuestTrainerDashboard({ userName }: { userName?: string }) {
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
        <Shimmer className="h-40 rounded-xl" />
        <div className="space-y-3">{[...Array(3)].map((_,i) => <Shimmer key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  const upcoming  = data!.sessions.filter(s => s.status === 'upcoming');
  const completed = data!.sessions.filter(s => s.status === 'completed');
  const nextSession = upcoming[0];

  const guestSetupSteps = buildAcademyGuestTrainerSetupSteps({
    hasProfile: !!userName,
  });

  return (
    <div className="space-y-6">
      <SetupGuideWidget
        steps={guestSetupSteps}
        portalKey={`academy-guest-${userName ?? 'unknown'}`}
        accentColor="teal"
      />

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">
          {userName ? `Welcome, ${userName.split(' ')[0]}` : 'Guest Trainer Portal'}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{todayLabel} · Guest Trainer</p>
      </div>

      {/* Next Session spotlight */}
      {nextSession && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-5">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Your Next Session</p>

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-100 leading-snug">{nextSession.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{nextSession.program_title}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${MODE_BADGE[nextSession.delivery_mode] ?? 'bg-slate-700 text-slate-400'}`}>
                  {nextSession.delivery_mode}
                </span>
                <span className="text-[11px] text-slate-500">·</span>
                <span className="text-[11px] text-slate-400">{nextSession.registered_count} participants</span>
                {nextSession.venue && (
                  <>
                    <span className="text-[11px] text-slate-500">·</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{nextSession.venue}</span>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-indigo-500/30 bg-indigo-500/20 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-indigo-300">{relDate(nextSession.scheduled_date)}</p>
              <p className="text-[10px] text-indigo-500 uppercase tracking-wide">Scheduled</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              {nextSession.coordinator_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-300">{nextSession.coordinator_name}</p>
              <p className="text-[10px] text-slate-500">Session Coordinator · {nextSession.coordinator_email}</p>
            </div>
            <Link href="/academy/sessions"
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-600">
              View Details →
            </Link>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Upcoming Sessions',  value: data!.upcomingSessions,  color: 'text-indigo-400',  iconBg: 'bg-indigo-500/15',  iconColor: 'text-indigo-400',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Completed Sessions', value: data!.completedSessions, color: 'text-emerald-400', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Assigned',     value: data!.totalSessions,     color: 'text-slate-100',   iconBg: 'bg-slate-700/50',   iconColor: 'text-slate-400',   icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
        ].map(m => (
          <div key={m.label} className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.iconBg}`}>
              <svg viewBox="0 0 24 24" className={`h-5 w-5 ${m.iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={m.icon} /></svg>
            </div>
            <div>
              <p className={`text-2xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600 leading-tight">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* All Sessions */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">All My Sessions</h2>
          <Link href="/academy/sessions" className="text-xs text-indigo-400 hover:text-indigo-300">Full list →</Link>
        </div>
        <div className="space-y-3">
          {data!.sessions.map(s => {
            const dateStr  = relDate(s.scheduled_date);
            const isPast   = s.status === 'completed';
            return (
              <Link key={s.id} href={`/academy/sessions/${s.id}`}
                className={`block rounded-xl border p-4 transition hover:bg-slate-800/20
                  ${isPast ? 'border-slate-800/40 opacity-60' : 'border-slate-700/60 hover:border-indigo-500/20'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-200">{s.title}</p>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${MODE_BADGE[s.delivery_mode] ?? 'bg-slate-700 text-slate-400'}`}>
                        {s.delivery_mode}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{s.program_title}</p>

                    <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {s.registered_count} participants
                      </span>
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {s.coordinator_name}
                      </span>
                      {s.venue && (
                        <span className="flex items-center gap-1 truncate max-w-[160px]">
                          <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {s.venue}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold ${isPast ? 'text-slate-500' : 'text-indigo-400'}`}>{dateStr}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600 capitalize">{s.program_type}</p>
                  </div>
                </div>
              </Link>
            );
          })}

          {data!.sessions.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No sessions assigned yet.</p>
              <p className="mt-1 text-xs text-slate-600">Your coordinator will notify you when sessions are scheduled.</p>
            </div>
          )}
        </div>
      </div>

      {/* My Coordinator */}
      <TeamWidget viewerRole="guest_trainer" />

      {/* Resources */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Resources</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: '/academy/lms',      label: 'Learning Hub',      sub: 'Training materials',    icon: 'M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',               bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { href: '/academy/calendar', label: 'Training Calendar', sub: 'Scheduled sessions',    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',                                                         bg: 'bg-slate-700/40 border-slate-700/60'  },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className={`flex items-center gap-2.5 rounded-lg border p-3 transition hover:brightness-110 ${a.bg}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200">{a.label}</p>
                <p className="text-[10px] text-slate-500">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
