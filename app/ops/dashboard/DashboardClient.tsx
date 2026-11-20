'use client';

import Link from 'next/link';
import TourTarget from '@/components/portal/tour/TourTarget';

const ROLE_QUICK_ACTIONS: Record<string, { label: string; href: string; icon: string }[]> = {
  virtual_assistant: [
    { label: 'View My Tasks',    href: '/ops/tasks',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Open Schedule',    href: '/ops/schedule',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Submit Daily Log', href: '/ops/daily-log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ],
  proposal_executive: [
    { label: 'New Proposal',     href: '/ops/proposals', icon: 'M12 4v16m8-8H4' },
    { label: 'My Proposals',     href: '/ops/proposals', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Submit Daily Log', href: '/ops/daily-log', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
  compliance_doc_executive: [
    { label: 'View Documents',   href: '/ops/documents',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Checklists',       href: '/ops/checklists', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Submit Daily Log', href: '/ops/daily-log',  icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
  market_research_executive: [
    { label: 'Research Notes',   href: '/ops/research',  icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { label: 'Open Intel',       href: '/intel',         icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Submit Daily Log', href: '/ops/daily-log', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
  mis_reporting_executive: [
    { label: 'View Reports',     href: '/ops/reports',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Export Data',      href: '/ops/exports',   icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { label: 'Submit Daily Log', href: '/ops/daily-log', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
  lead_gen_executive: [
    { label: 'Lead Pipeline',    href: '/ops/lead-gen',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'My Tasks',         href: '/ops/tasks',        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Submit Daily Log', href: '/ops/daily-log',    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
  appointment_setter: [
    { label: 'Appointments',     href: '/ops/appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'My Tasks',         href: '/ops/tasks',        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Submit Daily Log', href: '/ops/daily-log',    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
  crm_data_executive: [
    { label: 'Data Entry',       href: '/ops/crm-data',  icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: 'My Tasks',         href: '/ops/tasks',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Submit Daily Log', href: '/ops/daily-log', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
  customer_support_executive: [
    { label: 'Support Queue',    href: '/ops/support',   icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { label: 'My Tasks',         href: '/ops/tasks',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Submit Daily Log', href: '/ops/daily-log', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  ],
};

const DEFAULT_QUICK_ACTIONS = [
  { label: 'My Tasks',         href: '/ops/tasks',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Submit Daily Log', href: '/ops/daily-log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Training',         href: '/ops/training',  icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

interface Props {
  userName: string;
  userRole: string;
  checkin: { status: string; checked_in_at: string | null; checked_out_at: string | null; total_hours: number | null } | null;
  activeTasks: number;
  eodSubmitted: boolean;
  trainingComplete: boolean;
}

export default function DashboardClient({ userName, userRole, checkin, activeTasks, eodSubmitted, trainingComplete }: Props) {
  const quickActions = ROLE_QUICK_ACTIONS[userRole] ?? DEFAULT_QUICK_ACTIONS;

  function checkinLabel() {
    if (!checkin || checkin.status === 'pending') return { text: 'Not Checked In', color: 'text-slate-400', bg: 'bg-slate-800/60', border: 'border-slate-700' };
    if (checkin.status === 'active') return { text: 'Active — Working', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/40' };
    if (checkin.status === 'completed') return { text: `Done — ${checkin.total_hours?.toFixed(1) ?? '?'} hrs`, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/40' };
    return { text: 'Absent', color: 'text-rose-400', bg: 'bg-rose-900/20', border: 'border-rose-700/40' };
  }

  const ci = checkinLabel();

  const cards = [
    {
      title: 'Check-in Status',
      value: ci.text,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: ci.color,
      bg: ci.bg,
      border: ci.border,
      sub: checkin?.checked_in_at
        ? `Since ${new Date(checkin.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        : 'Use the sidebar widget to check in',
      href: null,
    },
    {
      title: 'Active Tasks',
      value: String(activeTasks),
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      color: activeTasks > 0 ? 'text-amber-400' : 'text-slate-400',
      bg: activeTasks > 0 ? 'bg-amber-900/20' : 'bg-slate-800/60',
      border: activeTasks > 0 ? 'border-amber-700/40' : 'border-slate-700',
      sub: 'Pending + In Progress',
      href: '/ops/tasks',
    },
    {
      title: 'Daily Log',
      value: eodSubmitted ? 'Submitted ✓' : 'Not submitted',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: eodSubmitted ? 'text-emerald-400' : 'text-rose-400',
      bg: eodSubmitted ? 'bg-emerald-900/20' : 'bg-rose-900/20',
      border: eodSubmitted ? 'border-emerald-700/40' : 'border-rose-700/40',
      sub: eodSubmitted ? 'Great work today!' : 'Submit your EOD log',
      href: '/ops/daily-log',
    },
    {
      title: 'Training',
      value: trainingComplete ? 'Complete ✓' : 'In Progress',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      color: trainingComplete ? 'text-emerald-400' : 'text-amber-400',
      bg: trainingComplete ? 'bg-emerald-900/20' : 'bg-amber-900/20',
      border: trainingComplete ? 'border-emerald-700/40' : 'border-amber-700/40',
      sub: trainingComplete ? 'Onboarding complete' : 'Complete your onboarding',
      href: trainingComplete ? null : '/ops/training',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">{greeting}, {userName.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's your workspace for today</p>
      </div>

      {/* Stat cards */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.title}
            className={`rounded-xl border ${card.border} ${card.bg} p-4 ${card.href ? 'cursor-pointer hover:brightness-110 transition' : ''}`}
            onClick={card.href ? () => { window.location.href = card.href! } : undefined}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
                <p className={`text-lg font-bold mt-1 ${card.color}`}>{card.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
              </div>
              <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${card.color} opacity-60`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
          </div>
        ))}
      </TourTarget>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Quick Actions</h2>
        <TourTarget id="dash-quick-actions" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map(action => (
            <Link key={action.href + action.label} href={action.href}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 hover:border-rose-500/30 hover:bg-rose-500/5 transition group">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-500/20 transition">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-200 group-hover:text-slate-100">{action.label}</span>
            </Link>
          ))}
        </TourTarget>
      </div>

      {/* Training reminder */}
      {!trainingComplete && (
        <TourTarget id="dash-training-reminder" className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">Complete your onboarding training</p>
            <p className="text-xs text-slate-500 mt-0.5">Learn how to use the portal and understand your role before you begin work.</p>
          </div>
          <Link href="/ops/training"
            className="shrink-0 rounded-lg bg-amber-600/20 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-600/30 transition">
            Start →
          </Link>
        </TourTarget>
      )}
    </div>
  );
}
