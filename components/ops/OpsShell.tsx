'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { OPS_TOUR_STEPS } from '@/components/portal/tour/opsTourSteps';
import { OPS_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/opsDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY = 'ops-sidebar-collapsed';

// ── Role → department mapping ─────────────────────────────────────────────────
const DEPT_LABELS: Record<string, string> = {
  virtual_assistant:          'Operations',
  proposal_executive:         'Operations',
  compliance_doc_executive:   'Operations',
  market_research_executive:  'Operations',
  mis_reporting_executive:    'Operations',
  lead_gen_executive:         'Business & Sales',
  appointment_setter:         'Business & Sales',
  crm_data_executive:         'Business & Sales',
  customer_support_executive: 'Business & Sales',
  admin:                      'Admin',
  manager:                    'Admin',
};

const ROLE_LABELS: Record<string, string> = {
  virtual_assistant:          'Virtual Assistant',
  proposal_executive:         'Proposal Executive',
  compliance_doc_executive:   'Compliance Doc Executive',
  market_research_executive:  'Market Research Executive',
  mis_reporting_executive:    'MIS & Reporting Executive',
  lead_gen_executive:         'Lead Generation Executive',
  appointment_setter:         'Appointment Setter',
  crm_data_executive:         'CRM Data Executive',
  customer_support_executive: 'Customer Support Executive',
  admin:                      'Administrator',
  manager:                    'Manager',
};

// ── Common nav (all roles) ────────────────────────────────────────────────────
const COMMON_NAV = [
  { href: '/ops/dashboard',  label: 'Dashboard',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/ops/tasks',      label: 'My Tasks',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/ops/daily-log',  label: 'Daily Log',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/ops/training',   label: 'Training',   icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

// ── Role-specific nav sections ────────────────────────────────────────────────
function getRoleNav(role: string) {
  switch (role) {
    case 'proposal_executive':
      return [
        { href: '/ops/proposals', label: 'Proposals',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { href: '/ops/documents', label: 'Templates',  icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
      ];
    case 'compliance_doc_executive':
      return [
        { href: '/ops/documents',   label: 'Documents',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { href: '/ops/checklists',  label: 'Checklists',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      ];
    case 'market_research_executive':
      return [
        { href: '/ops/research',  label: 'Research',     icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
        { href: '/intel',         label: 'Intel Portal', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      ];
    case 'mis_reporting_executive':
      return [
        { href: '/ops/reports',  label: 'Reports',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { href: '/ops/exports',  label: 'Data Exports', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
      ];
    case 'lead_gen_executive':
      return [
        { href: '/ops/lead-gen',     label: 'Lead Pipeline', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        { href: '/ops/lead-sources', label: 'Lead Sources',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      ];
    case 'appointment_setter':
      return [
        { href: '/ops/appointments', label: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { href: '/ops/followups',    label: 'Follow-ups',   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      ];
    case 'crm_data_executive':
      return [
        { href: '/ops/crm-data',  label: 'Data Entry', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
        { href: '/ops/contacts',  label: 'Contacts',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      ];
    case 'customer_support_executive':
      return [
        { href: '/ops/support',    label: 'Support Queue', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { href: '/ops/my-tickets', label: 'My Tickets',    icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
      ];
    case 'virtual_assistant':
      return [
        { href: '/ops/schedule',  label: 'Scheduling',       icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { href: '/ops/comms-log', label: 'Communication Log', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
      ];
    default:
      return [];
  }
}

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface Props {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail: string;
}

interface CheckinState {
  status: 'unknown' | 'pending' | 'active' | 'completed';
  checkedInAt: string | null;
  totalHours: number | null;
}

function NavLink({ href, label, icon, collapsed, onClick }: {
  href: string; label: string; icon: string; collapsed: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/ops/dashboard' && pathname.startsWith(href));
  return (
    <Link href={href} data-tour-id={href} title={collapsed ? label : undefined} onClick={onClick}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
        ${active ? 'bg-rose-500/15 text-rose-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}
        ${collapsed ? 'justify-center px-2' : ''}`}>
      {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-rose-400" />}
      <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${active ? 'text-rose-400' : 'text-slate-500'}`}
        fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function OpsShell({ children, userName, userRole, userEmail }: Props) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkin, setCheckin] = useState<CheckinState>({ status: 'unknown', checkedInAt: null, totalHours: null });
  const [checkinLoading, setCheckinLoading] = useState(false);

  const tour = usePortalTour({
    steps: interleaveDeepDive(OPS_TOUR_STEPS, { '/ops/dashboard': OPS_DASHBOARD_TOUR_STEPS }),
    storageKey: STORAGE_KEY,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  // Make sure the sidebar is actually visible while the tour is highlighting a nav item
  useEffect(() => {
    if (!tour.isActive) return;
    if (collapsed) setCollapsed(false);
    if (window.innerWidth < 768) setMobileOpen(true);
  }, [tour.isActive, collapsed]);

  // Auto-skip a step if its target isn't in the current DOM (e.g. gated nav item not rendered for this user)
  useEffect(() => {
    if (!tour.isActive || !tour.step || !tour.isReady) return;
    const stepId = tour.step.id;
    if (document.querySelector(`[data-tour-id="${stepId}"]`)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(`[data-tour-id="${stepId}"]`)) tour.next();
    }, 400);
    return () => clearTimeout(t);
  }, [tour.isActive, tour.step, tour.next]);

  const loadCheckin = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/checkin');
      if (res.ok) {
        const data = await res.json();
        setCheckin({
          status: data.status ?? 'pending',
          checkedInAt: data.checked_in_at ?? null,
          totalHours: data.total_hours ?? null,
        });
      }
    } catch {}
  }, []);

  useEffect(() => { loadCheckin(); }, [loadCheckin]);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  async function handleSignOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push('/ops/login');
  }

  async function handleCheckin() {
    setCheckinLoading(true);
    try {
      const action = checkin.status === 'active' ? 'checkout' : 'checkin';
      const res = await fetch('/api/ops/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await loadCheckin();
    } finally {
      setCheckinLoading(false);
    }
  }

  const initials = (userName || userEmail || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const roleNav = getRoleNav(userRole);

  const sidebar = (
    <aside className={`flex flex-col bg-[#0d0f1a] border-r border-slate-800/60 transition-all duration-200
      ${collapsed ? 'w-14' : 'w-60'} shrink-0`}>

      {/* Logo */}
      <div className={`flex h-14 items-center border-b border-slate-800/60 ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'}`}>
        <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={40} height={40} className="h-9 w-9 shrink-0 rounded-full object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 leading-tight truncate">Operations Portal</p>
            <p className="text-[10px] text-slate-500 truncate">EPR Compass</p>
          </div>
        )}
        {!collapsed && (
          <button onClick={tour.start} title="Take a tour of this portal"
            className="hidden sm:flex ml-auto mr-1 items-center gap-1 rounded-md border border-slate-800 px-1.5 py-1 text-[10px] font-medium text-slate-500 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-300 transition">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tour
          </button>
        )}
        <button onClick={toggleSidebar} className={`text-slate-600 hover:text-slate-400 ${collapsed ? 'hidden' : ''}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {/* Common */}
        {COMMON_NAV.map(item => (
          <NavLink key={item.href} {...item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        ))}

        {/* Role-specific */}
        {roleNav.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {DEPT_LABELS[userRole] ?? 'My Work'}
              </p>
            )}
            {collapsed && <div className="border-t border-slate-800/60 my-2" />}
            {roleNav.map(item => (
              <NavLink key={item.href} {...item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            ))}
          </>
        )}
      </nav>

      {/* Check-in widget */}
      {mounted && (
        <div className={`border-t border-slate-800/60 px-2 py-2 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <button onClick={handleCheckin} disabled={checkinLoading}
              title={checkin.status === 'active' ? 'Check Out' : 'Check In'}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition
                ${checkin.status === 'active' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'}`}>
              {checkin.status === 'active' ? '●' : '○'}
            </button>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 space-y-2">
              {checkin.status === 'completed' ? (
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Today's session</p>
                  <p className="text-xs font-semibold text-emerald-400">{checkin.totalHours?.toFixed(1) ?? '—'} hrs logged</p>
                </div>
              ) : checkin.status === 'active' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400">
                      Since {checkin.checkedInAt ? new Date(checkin.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                  <button onClick={handleCheckin} disabled={checkinLoading}
                    className="w-full rounded bg-rose-600/20 border border-rose-500/30 py-1.5 text-[11px] font-semibold text-rose-400 hover:bg-rose-600/30 transition">
                    {checkinLoading ? 'Saving…' : 'Check Out'}
                  </button>
                </>
              ) : (
                <button onClick={handleCheckin} disabled={checkinLoading}
                  className="w-full rounded bg-emerald-600/20 border border-emerald-500/30 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-600/30 transition">
                  {checkinLoading ? 'Saving…' : '● Check In'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* User footer */}
      <div className={`border-t border-slate-800/60 p-2 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-[11px] font-bold text-rose-300">
            {initials}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[11px] font-bold text-rose-300">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName || userEmail}</p>
              <p className="truncate text-[10px] text-slate-500">{ROLE_LABELS[userRole] ?? userRole}</p>
            </div>
            <button onClick={handleSignOut} title="Sign out"
              className="shrink-0 text-slate-600 hover:text-rose-400 transition">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={toggleSidebar}
          className="border-t border-slate-800/60 flex justify-center py-2 text-slate-600 hover:text-slate-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </aside>
  );

  return (
    <div className="dark min-h-screen bg-[#020817] text-slate-100 flex">
      {/* Desktop sidebar */}
      <div className="hidden sm:flex">{sidebar}</div>

      {/* Mobile header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-slate-800/60 bg-[#0d0f1a] px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-sm font-bold text-slate-100">Operations</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} className="text-slate-400 hover:text-slate-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-30 flex">
          <div className="flex flex-col w-60 bg-[#0d0f1a] border-r border-slate-800/60 pt-14">
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {COMMON_NAV.map(item => (
                <NavLink key={item.href} {...item} collapsed={false} onClick={() => setMobileOpen(false)} />
              ))}
              {roleNav.map(item => (
                <NavLink key={item.href} {...item} collapsed={false} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen sm:pt-0 pt-14 overflow-x-hidden">
        <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {tour.isActive && tour.step && tour.isReady && (
        <TourOverlay
          step={tour.step}
          index={tour.index}
          total={tour.total}
          ringClass="border-rose-500"
          buttonClass="bg-rose-600 hover:bg-rose-700"
          dotClass="bg-rose-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}

