'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { TASK_MANAGER_TOUR_STEPS } from '@/components/portal/tour/taskManagerTourSteps';
import { TASK_MANAGER_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/taskManagerDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY = 'taskmanager-sidebar-collapsed';

interface NavItem {
  href: string; label: string; icon: string;
  badge?: keyof BadgeCounts; accent?: boolean;
}
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Command Center',
    items: [
      {
        href: '/taskmanager/dashboard', label: 'Dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        badge: 'warnings',
      },
      {
        href: '/taskmanager/warnings', label: 'Early Warnings', accent: true,
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        badge: 'warnings',
      },
      {
        href: '/taskmanager/breach-predict', label: 'Breach Predictor',
        icon: 'M9 17l3-3 3 3M9 7l3 3 3-3M3 12h18',
        badge: 'overdue_tasks',
      },
      {
        href: '/taskmanager/digest', label: 'Weekly Digest',
        icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
      },
    ],
  },
  {
    label: 'Task Management',
    items: [
      {
        href: '/taskmanager/sixty-days-project', label: '60 Days Project',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        accent: true,
      },
      {
        href: '/taskmanager/projects', label: 'Projects',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      },
      {
        href: '/taskmanager/projects/my-tasks', label: 'My Tasks',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      },
      {
        href: '/taskmanager/tasks', label: 'Operational Tasks',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        badge: 'overdue_tasks',
      },
      {
        href: '/taskmanager/epr-tasks', label: 'EPR Compliance',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3-5a1 1 0 11-2 0 1 1 0 012 0z',
        badge: 'overdue_epr',
      },
      {
        href: '/taskmanager/epr-tasks?tab=oversight', label: 'EPR Oversight',
        icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
        badge: 'at_risk_oversight',
      },
      {
        href: '/taskmanager/filings', label: 'Filing SLAs',
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        badge: 'overdue_filings',
      },
      {
        href: '/taskmanager/escalations', label: 'Escalations',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        badge: 'escalations',
      },
    ],
  },
  {
    label: 'Client Management',
    items: [
      {
        href: '/taskmanager/clients', label: 'Client Health',
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      },
      {
        href: '/taskmanager/onboarding', label: 'Onboarding Pipeline',
        icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      },
      {
        href: '/taskmanager/renewals', label: 'Certificate Renewals',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      },
      {
        href: '/taskmanager/calendar', label: 'Regulatory Calendar',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        href: '/taskmanager/team', label: 'Team Performance',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        href: '/taskmanager/compliance-intel', label: 'Compliance Intel',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
      {
        href: '/taskmanager/exposure', label: 'EC Liability Exposure',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        href: '/taskmanager/recyclers', label: 'Recycler Network',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      },
      {
        href: '/taskmanager/partners', label: 'Partner Network',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        href: '/taskmanager/reports', label: 'Management Reports',
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        href: '/taskmanager/automation', label: 'Automation Rules',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      },
    ],
  },
];

const PORTAL_LINKS = [
  { label: 'Admin Panel',      href: '/admin/dashboard',      color: 'bg-rose-500' },
  { label: 'Manager Portal',   href: '/manager/dashboard',    color: 'bg-teal-500' },
  { label: 'Client Portal',    href: '/portal/dashboard',     color: 'bg-blue-500' },
  { label: 'Access Manager',   href: '/iam/dashboard',        color: 'bg-violet-500' },
];

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface BadgeCounts {
  warnings: number;
  overdue_tasks: number;
  overdue_epr: number;
  overdue_filings: number;
  escalations: number;
  at_risk_oversight: number;
}

interface Props {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail?: string;
}

export default function TaskManagerShell({ children, userName, userRole, userEmail }: Props) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed]   = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges]         = useState<BadgeCounts>({ warnings: 0, overdue_tasks: 0, overdue_epr: 0, overdue_filings: 0, escalations: 0, at_risk_oversight: 0 });

  const tour = usePortalTour({
    steps: interleaveDeepDive(TASK_MANAGER_TOUR_STEPS, { '/taskmanager/dashboard': TASK_MANAGER_DASHBOARD_TOUR_STEPS }),
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

  // Auto-skip a step if its target isn't in the current DOM
  useEffect(() => {
    if (!tour.isActive || !tour.step || !tour.isReady) return;
    const stepId = tour.step.id;
    if (document.querySelector(`[data-tour-id="${stepId}"]`)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(`[data-tour-id="${stepId}"]`)) tour.next();
    }, 400);
    return () => clearTimeout(t);
  }, [tour.isActive, tour.step, tour.next]);

  // Poll warning counts every 90s
  useEffect(() => {
    async function fetchBadges() {
      try {
        const [overviewRes, oversightRes] = await Promise.all([
          fetch('/api/taskmanager/overview?counts_only=1'),
          fetch('/api/taskmanager/epr-oversight?fy=2026-27'),
        ]);
        const d  = overviewRes.ok  ? await overviewRes.json()  : {};
        const od = oversightRes.ok ? await oversightRes.json() : {};
        setBadges({
          warnings:          (d.critical_count ?? 0) + (d.urgent_count ?? 0),
          overdue_tasks:     d.overdue_portal_tasks ?? 0,
          overdue_epr:       d.overdue_epr          ?? 0,
          overdue_filings:   d.overdue_filings       ?? 0,
          escalations:       d.active_escalations    ?? 0,
          at_risk_oversight: od.summary?.at_risk      ?? 0,
        });
      } catch {}
    }
    fetchBadges();
    const id = setInterval(fetchBadges, 90_000);
    return () => clearInterval(id);
  }, []);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  async function handleLogout() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; Max-Age=0; path=/';
    router.push('/taskmanager/login');
  }

  const initials = (userName || userEmail || 'T')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const totalAlerts = badges.warnings + badges.overdue_tasks + badges.overdue_epr + badges.overdue_filings + badges.escalations + badges.at_risk_oversight;

  const sidebar = (
    <aside className={`flex flex-col h-full bg-[#0c1022] border-r border-orange-900/30 transition-all duration-200 ${collapsed ? 'w-[58px]' : 'w-[234px]'}`}>

      {/* Brand header */}
      <div className={`flex items-center h-14 border-b border-orange-900/30 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={32} height={32} className="h-7 w-7 shrink-0 rounded-full object-contain" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">Task Manager</p>
              <p className="text-[10px] text-slate-500 truncate">Cross-portal task control</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="relative flex h-7 w-7 items-center justify-center">
            <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={32} height={32} className="h-7 w-7 rounded-full object-contain" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                {totalAlerts > 9 ? '9+' : totalAlerts}
              </span>
            )}
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={tour.start}
              title="Take a tour of this portal"
              className="hidden sm:flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tour
            </button>
            <button onClick={handleToggle} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition" aria-label="Collapse">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      {collapsed && (
        <button onClick={handleToggle} className="flex items-center justify-center py-2 text-slate-600 hover:text-slate-300 transition" aria-label="Expand">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_GROUPS.map(({ label: groupLabel, items }) => (
          <div key={groupLabel} className="mb-1">
            {/* Group label */}
            {!collapsed && (
              <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-700">
                {groupLabel}
              </p>
            )}
            {collapsed && <div className="h-px mx-2 my-2 bg-slate-800/80" />}

            {items.map(({ href, label, icon, badge, accent }) => {
              const active    = pathname === href || pathname.startsWith(href + '/');
              const badgeVal  = badge ? (badges[badge] ?? 0) : 0;
              const isWarning = href === '/taskmanager/warnings';
              const isEsc     = href === '/taskmanager/escalations';

              return (
                <Link
                  key={href}
                  href={href}
                  data-tour-id={href}
                  title={collapsed ? label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? isWarning ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-500/10 text-orange-200'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  {active && (
                    <span className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r ${isWarning ? 'bg-orange-400' : 'bg-orange-500'}`} />
                  )}
                  <div className="relative shrink-0">
                    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${active ? (isWarning ? 'text-orange-400' : 'text-orange-300') : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    {badgeVal > 0 && collapsed && (
                      <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full animate-pulse ${isEsc ? 'bg-orange-500' : 'bg-rose-500'}`} />
                    )}
                  </div>
                  {!collapsed && <span className="flex-1 truncate text-xs">{label}</span>}
                  {!collapsed && badgeVal > 0 && (
                    <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${isWarning || isEsc ? 'bg-orange-500' : 'bg-rose-500'}`}>
                      {badgeVal > 99 ? '99+' : badgeVal}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Portal quick-links */}
        {!collapsed && (
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Portals</p>
            {PORTAL_LINKS.map(({ label, href, color }) => (
              <Link
                key={href}
                href={href}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                {label}
                <svg viewBox="0 0 24 24" className="ml-auto h-3 w-3 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800/60 p-2 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/15 text-[10px] font-bold text-orange-300 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName || userEmail || 'Task Manager'}</p>
              <p className="text-[10px] capitalize text-slate-500">{userRole.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/15 text-[10px] font-bold text-orange-300 select-none" title={userName}>
                {initials}
              </div>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="flex w-full items-center justify-center rounded-lg py-2 text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#020817] text-slate-100">
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col h-screen shrink-0 transition-all duration-200 ${mounted ? (collapsed ? 'w-[58px]' : 'w-[234px]') : 'w-[234px]'}`}>
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col h-full w-[234px]">{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex md:hidden items-center h-14 px-4 border-b border-orange-900/20 bg-[#0c1022]/95 backdrop-blur-sm shrink-0">
          <button onClick={() => setMobileOpen(true)} className="mr-3 text-slate-500 hover:text-slate-200 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="flex-1 text-sm font-bold text-slate-100">Task Manager</span>
          {totalAlerts > 0 && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
              {totalAlerts > 99 ? '99+' : totalAlerts}
            </span>
          )}
        </header>

        {/* Desktop top-bar: alert summary strip */}
        {totalAlerts > 0 && (
          <div className="hidden md:flex items-center gap-3 h-9 px-5 border-b border-orange-500/20 bg-orange-500/5 shrink-0">
            <svg className="h-3.5 w-3.5 text-orange-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[11px] text-orange-300 font-medium">
              {totalAlerts} active alert{totalAlerts !== 1 ? 's' : ''} requiring attention
            </span>
            <Link href="/taskmanager/warnings" className="ml-auto text-[11px] text-orange-400 hover:text-orange-300 transition font-medium">
              View warnings →
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6">{children}</div>
        </main>
      </div>

      {tour.isActive && tour.step && tour.isReady && (
        <TourOverlay
          step={tour.step}
          index={tour.index}
          total={tour.total}
          ringClass="border-orange-500"
          buttonClass="bg-orange-600 hover:bg-orange-700"
          dotClass="bg-orange-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
