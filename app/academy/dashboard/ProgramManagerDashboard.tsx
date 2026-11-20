'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import TeamWidget from '@/components/academy/TeamWidget';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildAcademyManagerSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

interface PmKpis {
  myPrograms: number;
  upcomingPrograms: number;
  ongoingPrograms: number;
  completedPrograms: number;
  totalSessions: number;
  upcomingSessions: number;
  totalRegistrations: number;
  attendanceRate: number;
  completionRate: number;
  certificatesPending: number;
  evidenceSubmissions: number;
}

interface MySession {
  id: string;
  title: string;
  program_title: string;
  delivery_mode: string;
  scheduled_date: string;
  registered_count: number;
  capacity: number;
  attendance_marked: boolean;
}

interface MyProgram {
  id: string;
  title: string;
  program_type: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  sessions_total: number;
  sessions_done: number;
  registrations: number;
}

interface DashData {
  kpis: PmKpis;
  mySessions: MySession[];
  myPrograms: MyProgram[];
}

function relDate(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400_000);
  if (days < 0)   return `${Math.abs(days)}d ago`;
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

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  upcoming:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-400'  },
  ongoing:   { bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};


function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

export default function ProgramManagerDashboard({ userName }: { userName?: string }) {
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[...Array(4)].map((_,i) => <Shimmer key={i} className="h-24 rounded-xl" />)}</div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><Shimmer className="lg:col-span-2 h-64 rounded-xl" /><Shimmer className="h-64 rounded-xl" /></div>
      </div>
    );
  }

  const k = data!.kpis;

  const pmSetupSteps = buildAcademyManagerSetupSteps({
    hasReviewedPrograms: k.myPrograms > 0,
    hasAssignedTrainer: k.upcomingPrograms > 0,
  });

  return (
    <div className="space-y-6">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={pmSetupSteps}
          portalKey={`academy-pm-${userName ?? 'unknown'}`}
          accentColor="emerald"
          dark={true}
        />
      </TourTarget>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            {userName ? `Welcome, ${userName.split(' ')[0]}` : 'Program Dashboard'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{todayLabel} · Program Manager</p>
        </div>
        <Link href="/academy/sessions"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700">
          View All Sessions
        </Link>
      </div>

      {/* KPI Cards */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'My Programs',         value: k.myPrograms,           color: 'text-slate-100',   border: 'border-slate-800/80',   iconBg: 'bg-slate-700/50',    iconColor: 'text-slate-400',   icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
          { label: 'Upcoming Sessions',   value: k.upcomingSessions,     color: 'text-indigo-400',  border: 'border-indigo-900/40',  iconBg: 'bg-indigo-500/15',   iconColor: 'text-indigo-400',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Total Registrations', value: k.totalRegistrations,   color: 'text-emerald-400', border: 'border-emerald-900/40', iconBg: 'bg-emerald-500/15',  iconColor: 'text-emerald-400', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Certs Pending',       value: k.certificatesPending,  color: k.certificatesPending > 20 ? 'text-amber-400' : 'text-slate-300', border: k.certificatesPending > 20 ? 'border-amber-900/30' : 'border-slate-800/80', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
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

      {/* Metrics bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Attendance Rate',    value: `${k.attendanceRate}%`, accent: k.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500', color: k.attendanceRate >= 80 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Completion Rate',    value: `${k.completionRate}%`, accent: 'bg-indigo-500',  color: 'text-indigo-400'  },
          { label: 'Evidence Submitted', value: k.evidenceSubmissions,  accent: 'bg-teal-500',    color: 'text-teal-400'    },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div>
              <p className={`text-xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* My Programs */}
        <TourTarget id="dash-primary-list" className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">My Programs</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">{k.ongoingPrograms} ongoing · {k.upcomingPrograms} upcoming</p>
            </div>
            <Link href="/academy/programs" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
          </div>
          <div className="space-y-2.5">
            {data!.myPrograms.map(p => {
              const pct = p.sessions_total > 0 ? Math.round((p.sessions_done / p.sessions_total) * 100) : 0;
              const s   = STATUS_STYLES[p.status];
              return (
                <Link key={p.id} href={`/academy/programs/${p.id}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-800/50 p-3 transition hover:border-indigo-500/20 hover:bg-slate-800/20">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-200 truncate">{p.title}</p>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${s.bg} ${s.text}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">{p.program_type} · {p.registrations} registered</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-500">{p.sessions_done}/{p.sessions_total} sessions</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </TourTarget>

        {/* Upcoming Sessions + Quick Actions */}
        <div className="space-y-4">
          <TeamWidget viewerRole="training_program_manager" />
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Next Sessions</h2>
              <Link href="/academy/sessions" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
            </div>
            <div className="space-y-2">
              {data!.mySessions.map(s => {
                const fillPct = s.capacity > 0 ? Math.round((s.registered_count / s.capacity) * 100) : 0;
                return (
                  <Link key={s.id} href={`/academy/sessions/${s.id}`}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-800/40 p-2.5 transition hover:border-indigo-500/20 hover:bg-slate-800/20">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{s.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{s.program_title}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${MODE_BADGE[s.delivery_mode] ?? 'bg-slate-700 text-slate-400'}`}>
                          {s.delivery_mode}
                        </span>
                        <span className="text-[10px] text-slate-600">{s.registered_count}/{s.capacity}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-semibold text-indigo-400">{relDate(s.scheduled_date)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <TourTarget id="dash-quick-actions" className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quick Actions</p>
            <div className="space-y-1.5">
              {[
                { href: '/academy/attendance',    label: 'Mark Attendance',      sub: 'Sessions needing update',     iconBg: 'bg-amber-500/20',   iconColor: 'text-amber-400',   border: 'border-amber-500/20',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { href: '/academy/certifications',label: 'Issue Certificates',   sub: `${k.certificatesPending} pending`,iconBg: 'bg-violet-500/20', iconColor: 'text-violet-400', border: 'border-violet-500/20',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { href: '/academy/evidence',      label: 'Upload Evidence',      sub: 'Compliance documentation',    iconBg: 'bg-teal-500/20',    iconColor: 'text-teal-400',    border: 'border-teal-500/20',    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
                { href: '/academy/compliance',    label: 'Log Awareness',        sub: 'Record EPR activity',         iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', border: 'border-emerald-500/20', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex items-center gap-2.5 rounded-lg border ${a.border} p-2.5 transition hover:bg-slate-800/30`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.iconBg}`}>
                    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${a.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{a.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{a.sub}</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </TourTarget>
        </div>
      </div>

    </div>
  );
}
