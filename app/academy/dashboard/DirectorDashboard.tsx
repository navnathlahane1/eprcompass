'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import TeamWidget from '@/components/academy/TeamWidget';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildAcademyDirectorSetupSteps } from '@/components/setup/setupSteps';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AcademyKpis {
  totalPrograms: number;
  upcomingPrograms: number;
  ongoingPrograms: number;
  completedPrograms: number;
  cancelledPrograms: number;
  totalParticipants: number;
  activeParticipants: number;
  attendanceRate: number;
  completionRate: number;
  certificatesIssued: number;
  certificatesPending: number;
  awarenessprogramsConducted: number;
  stakeholdersReached: number;
  employeesTrained: number;
  customersTrained: number;
  institutionsCovered: number;
  trainingRevenue: number;
  corporateRevenue: number;
  certificationRevenue: number;
  eventRevenue: number;
}

interface UpcomingSession {
  id: string;
  title: string;
  program_type: string;
  delivery_mode: string;
  scheduled_date: string;
  registered_count: number;
  capacity: number;
  trainer_name: string;
}

interface RecentRegistration {
  id: string;
  participant_name: string;
  program_title: string;
  registered_at: string;
  status: string;
}

interface ComplianceActivity {
  waste_category: string;
  programs: number;
  participants: number;
  last_date: string;
}

interface DashData {
  kpis: AcademyKpis;
  upcomingSessions: UpcomingSession[];
  recentRegistrations: RecentRegistration[];
  complianceActivities: ComplianceActivity[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtRev(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
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

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const WASTE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Plastic Waste': { bg: 'bg-blue-500/10',   text: 'text-blue-300',   dot: 'bg-blue-500'   },
  'E-Waste':       { bg: 'bg-amber-500/10',  text: 'text-amber-300',  dot: 'bg-amber-500'  },
  'Battery Waste': { bg: 'bg-emerald-500/10',text: 'text-emerald-300',dot: 'bg-emerald-500'},
  'Tyre Waste':    { bg: 'bg-violet-500/10', text: 'text-violet-300', dot: 'bg-violet-500' },
  'Used Oil':      { bg: 'bg-rose-500/10',   text: 'text-rose-300',   dot: 'bg-rose-500'   },
};

const MODE_BADGE: Record<string, string> = {
  'Online Live': 'bg-blue-500/15 text-blue-300',
  'Classroom':   'bg-amber-500/15 text-amber-300',
  'Hybrid':      'bg-violet-500/15 text-violet-300',
  'Self-Paced':  'bg-emerald-500/15 text-emerald-300',
  'Recorded':    'bg-slate-500/15 text-slate-300',
};


// ── Shimmer ────────────────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Shimmer className="h-6 w-48" /><Shimmer className="h-3.5 w-32" /></div>
        <div className="flex gap-2"><Shimmer className="h-9 w-32 rounded-lg" /><Shimmer className="h-9 w-36 rounded-lg" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[...Array(5)].map((_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Shimmer className="lg:col-span-2 h-72 rounded-xl" />
        <Shimmer className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function DirectorDashboard() {
  const [data,    setData]    = useState<DashData | null>(null);
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

  if (loading) return <Skeleton />;

  const k = data!.kpis;
  const totalRevenue = k.trainingRevenue + k.corporateRevenue + k.certificationRevenue + k.eventRevenue;

  const directorSetupSteps = buildAcademyDirectorSetupSteps({
    hasFirstProgram: k.totalPrograms > 0,
    hasTrainer: false, // trainers list not fetched here; guide will always prompt
    hasCalendarEvent: k.upcomingPrograms > 0,
  });

  return (
    <div className="space-y-6">
      <SetupGuideWidget
        steps={directorSetupSteps}
        portalKey="academy-director"
        accentColor="violet"
        dark={true}
      />

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Academy Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/academy/calendar"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Calendar
          </Link>
          <Link href="/academy/programs/create"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Program
          </Link>
        </div>
      </div>

      {/* ── Program Status Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total Programs',    value: k.totalPrograms,     color: 'text-slate-100',   border: 'border-slate-800/80',    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', iconBg: 'bg-slate-700/50', iconColor: 'text-slate-400' },
          { label: 'Upcoming',          value: k.upcomingPrograms,  color: 'text-indigo-400',  border: 'border-indigo-900/40',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',       iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400' },
          { label: 'Ongoing',           value: k.ongoingPrograms,   color: 'text-amber-400',   border: 'border-amber-900/30',    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
          { label: 'Completed',         value: k.completedPrograms, color: 'text-emerald-400', border: 'border-emerald-900/40',  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
          { label: 'Cancelled',         value: k.cancelledPrograms, color: 'text-rose-400',    border: 'border-rose-900/30',     icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400' },
        ].map(m => (
          <div key={m.label} className={`overflow-hidden rounded-xl border ${m.border} bg-[#0c1022] p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className={`mt-1.5 text-3xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.iconBg}`}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${m.iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d={m.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Participant & Compliance Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Participants',    value: fmtNum(k.totalParticipants),  accent: 'bg-indigo-500', color: 'text-indigo-400' },
          { label: 'Attendance Rate',       value: `${k.attendanceRate}%`,       accent: k.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500', color: k.attendanceRate >= 80 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Certificates Issued',   value: fmtNum(k.certificatesIssued), accent: 'bg-violet-500', color: 'text-violet-400' },
          { label: 'Stakeholders Reached',  value: fmtNum(k.stakeholdersReached),accent: 'bg-teal-500',   color: 'text-teal-400'   },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div className="min-w-0">
              <p className={`text-xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600 leading-tight">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Training Revenue',      value: fmtRev(k.trainingRevenue),      accent: 'bg-emerald-500', color: 'text-emerald-400' },
          { label: 'Corporate Revenue',     value: fmtRev(k.corporateRevenue),     accent: 'bg-blue-500',    color: 'text-blue-400'    },
          { label: 'Certification Revenue', value: fmtRev(k.certificationRevenue), accent: 'bg-violet-500',  color: 'text-violet-400'  },
          { label: 'Event Revenue',         value: fmtRev(k.eventRevenue),         accent: 'bg-amber-500',   color: 'text-amber-400'   },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div className="min-w-0">
              <p className={`text-xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600 leading-tight">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Upcoming Sessions</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">{k.upcomingPrograms} programs scheduled</p>
            </div>
            <Link href="/academy/sessions" className="text-xs text-indigo-400 transition hover:text-indigo-300">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {data!.upcomingSessions.map(s => {
              const fillPct = s.capacity > 0 ? Math.round((s.registered_count / s.capacity) * 100) : 0;
              const fillColor = fillPct >= 90 ? 'bg-rose-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500';
              return (
                <Link key={s.id} href={`/academy/sessions/${s.id}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-800/50 p-3 transition hover:border-indigo-500/20 hover:bg-slate-800/20">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-200 truncate">{s.title}</p>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${MODE_BADGE[s.delivery_mode] ?? 'bg-slate-700 text-slate-400'}`}>
                        {s.delivery_mode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">{s.trainer_name} · {s.program_type}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full rounded-full ${fillColor} transition-all`} style={{ width: `${fillPct}%` }} />
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-500">{s.registered_count}/{s.capacity}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-semibold text-indigo-400">{relDate(s.scheduled_date)}</p>
                    <p className={`mt-0.5 text-[10px] font-bold ${fillPct >= 90 ? 'text-rose-400' : 'text-slate-600'}`}>
                      {fillPct >= 90 ? 'Almost full' : `${k.upcomingPrograms - s.registered_count > 0 ? s.capacity - s.registered_count : 0} seats left`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions + Academy Health */}
        <div className="space-y-4">
          {/* Academy Health */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Academy Health</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(30 41 59)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(99 102 241)" strokeWidth="3"
                    strokeLinecap="round" strokeDasharray={`${k.completionRate} ${100 - k.completionRate}`}
                    className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-400">{k.completionRate}%</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">Completion Rate</p>
                <p className={`text-xs font-medium ${k.completionRate >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {k.completionRate >= 75 ? 'Strong' : 'Needs attention'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Attendance Rate',       value: `${k.attendanceRate}%`,           dot: k.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500', color: 'text-emerald-400' },
                { label: 'Certificates Pending',  value: k.certificatesPending,            dot: k.certificatesPending > 50 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500', color: 'text-amber-400' },
                { label: 'Active Participants',   value: fmtNum(k.activeParticipants),     dot: 'bg-indigo-500', color: 'text-indigo-400' },
                { label: 'Institutions Covered',  value: k.institutionsCovered,            dot: 'bg-teal-500',   color: 'text-teal-400'  },
                { label: 'Total Revenue',         value: fmtRev(totalRevenue),             dot: 'bg-violet-500', color: 'text-violet-400' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${r.dot}`} />
                    {r.label}
                  </span>
                  <span className={`text-[11px] font-semibold ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team Widget */}
          <TeamWidget viewerRole="academy_director" showEvaluate />

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quick Actions</p>
            <div className="space-y-1.5">
              {[
                { href: '/academy/programs/create', label: 'Create Program',     sub: 'New training program',           iconBg: 'bg-indigo-500/20',  iconColor: 'text-indigo-400',  border: 'border-indigo-500/20', icon: 'M12 4v16m8-8H4' },
                { href: '/academy/certifications',  label: 'Issue Certificates', sub: `${k.certificatesPending} pending`, iconBg: 'bg-violet-500/20',  iconColor: 'text-violet-400',  border: 'border-violet-500/20', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { href: '/academy/compliance',      label: 'Log Awareness',      sub: 'Record EPR activity',            iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', border: 'border-emerald-500/20',icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                { href: '/academy/reports',         label: 'Generate Report',    sub: 'Compliance evidence',            iconBg: 'bg-amber-500/20',   iconColor: 'text-amber-400',   border: 'border-amber-500/20',  icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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
          </div>
        </div>
      </div>

      {/* ── EPR Compliance Coverage ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">EPR Awareness Coverage</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">Programs conducted by waste category</p>
            </div>
            <Link href="/academy/compliance" className="text-xs text-indigo-400 hover:text-indigo-300">Manage →</Link>
          </div>
          <div className="space-y-3">
            {data!.complianceActivities.map(a => {
              const meta = WASTE_COLORS[a.waste_category] ?? { bg: 'bg-slate-500/10', text: 'text-slate-300', dot: 'bg-slate-500' };
              const maxP = Math.max(...data!.complianceActivities.map(x => x.participants), 1);
              const barW = Math.max((a.participants / maxP) * 100, 4);
              return (
                <div key={a.waste_category} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                    <p className="text-xs font-medium text-slate-300 truncate">{a.waste_category}</p>
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${meta.dot} opacity-70`} style={{ width: `${barW}%` }} />
                  </div>
                  <div className="w-32 shrink-0 text-right flex items-center justify-end gap-3">
                    <span className="text-[11px] text-slate-500">{a.programs} programs</span>
                    <span className={`text-xs font-bold ${meta.text}`}>{fmtNum(a.participants)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Employees Trained',  value: fmtNum(k.employeesTrained),  color: 'text-indigo-400' },
                { label: 'Customers Trained',  value: fmtNum(k.customersTrained),  color: 'text-emerald-400' },
                { label: 'Public Reached',     value: fmtNum(k.stakeholdersReached - k.employeesTrained - k.customersTrained), color: 'text-amber-400' },
              ].map(m => (
                <div key={m.label} className="text-center rounded-lg border border-slate-800/60 py-2">
                  <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-slate-600">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Recent Registrations</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">Latest sign-ups</p>
            </div>
            <Link href="/academy/registrations" className="text-xs text-indigo-400 hover:text-indigo-300">All →</Link>
          </div>
          <div className="space-y-2">
            {data!.recentRegistrations.map(r => (
              <div key={r.id} className="flex items-start gap-2.5 rounded-lg border border-slate-800/40 p-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-bold">
                  {r.participant_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{r.participant_name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{r.program_title}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${r.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {r.status}
                  </span>
                  <p className="mt-0.5 text-[10px] text-slate-600">{relTime(r.registered_at)}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/academy/registrations"
            className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-slate-800/60 py-2 text-[11px] font-medium text-slate-500 transition hover:text-indigo-400">
            View all registrations
          </Link>
        </div>
      </div>

    </div>
  );
}
