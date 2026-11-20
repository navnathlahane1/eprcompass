'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import InboxBell from '@/components/inbox/InboxBell';
import InboxBanners from '@/components/inbox/InboxBanners';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { MANAGER_TOUR_STEPS } from '@/components/portal/tour/managerTourSteps';
import { MANAGER_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/managerDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY = 'manager-sidebar-collapsed';

const NAV = [
  {
    href: '/manager/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/manager/clients',
    label: 'My Clients',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    href: '/manager/filings',
    label: 'Filings',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    href: '/manager/tasks',
    label: 'Tasks',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    href: '/manager/epr-tasks',
    label: 'EPR Tasks',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3-5a1 1 0 11-2 0 1 1 0 012 0zM9 11h6M9 15h4',
  },
];

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
  userEmail?: string;
}

export default function ManagerShell({ children, userName, userRole, userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  const tour = usePortalTour({
    steps: interleaveDeepDive(MANAGER_TOUR_STEPS, { '/manager/dashboard': MANAGER_DASHBOARD_TOUR_STEPS }),
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

  // Poll overdue task count every 2 minutes
  useEffect(() => {
    async function fetchOverdue() {
      try {
        const res = await fetch('/api/tasks?status=overdue&limit=50');
        if (res.ok) {
          const d = await res.json();
          setOverdueCount(d.summary?.overdue ?? 0);
        }
      } catch {}
    }
    fetchOverdue();
    const id = setInterval(fetchOverdue, 120_000);
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
    router.push('/manager/login');
  }

  const initials = (userName || userEmail || 'M')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sidebar = (
    <aside className={`flex flex-col h-full bg-[#0c1022] border-r border-slate-800/60 transition-all duration-200 ${collapsed ? 'w-[58px]' : 'w-[230px]'}`}>

      {/* Header */}
      <div className={`flex items-center h-14 border-b border-slate-800/60 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-500/40">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">Compliance Manager</p>
              <p className="text-[10px] text-slate-500 truncate">EPR Filing Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-500/40">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        {!collapsed && (
          <button onClick={handleToggle} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition" aria-label="Collapse">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={handleToggle} className="flex items-center justify-center py-2 text-slate-600 hover:text-slate-300 transition" aria-label="Expand">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const isTasks = href === '/manager/tasks';
          const showBadge = isTasks && overdueCount > 0;
          return (
            <Link
              key={href}
              href={href}
              data-tour-id={href}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-teal-500/15 text-teal-300' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-teal-400" />}
              <div className="relative shrink-0">
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${active ? 'text-teal-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {/* Overdue dot on icon when collapsed */}
                {showBadge && collapsed && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 truncate">{label}</span>
              )}
              {/* Overdue badge when expanded */}
              {!collapsed && showBadge && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {overdueCount > 9 ? '9+' : overdueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: user + sign out */}
      <div className="border-t border-slate-800/60 p-2 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/15 text-[10px] font-bold text-teal-300 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName || userEmail || 'Manager'}</p>
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/15 text-[10px] font-bold text-teal-300 select-none" title={userName}>
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
      <div className={`hidden md:flex flex-col h-screen shrink-0 transition-all duration-200 ${mounted ? (collapsed ? 'w-[58px]' : 'w-[230px]') : 'w-[230px]'}`}>
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col h-full w-[230px]">{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex md:hidden items-center h-14 px-4 border-b border-slate-800/60 bg-[#0c1022]/95 backdrop-blur-sm shrink-0">
          <button onClick={() => setMobileOpen(true)} className="mr-3 text-slate-500 hover:text-slate-200 transition" aria-label="Open menu">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="flex-1 text-sm font-bold text-slate-100">Compliance Manager</span>
          <InboxBell />
        </header>

        {/* Desktop topbar (bell only — no mobile duplicate) */}
        <div className="hidden md:flex items-center justify-between h-10 px-4 border-b border-slate-800/40 bg-[#020817] shrink-0">
          <button
            onClick={tour.start}
            title="Take a tour of this portal"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700/70 px-2.5 py-1 text-xs font-medium text-slate-500 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-300 transition"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Take a tour
          </button>
          <InboxBell />
        </div>

        {/* Inbox banners */}
        <InboxBanners />

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6">{children}</div>
        </main>
      </div>

      {tour.isActive && tour.step && tour.isReady && (
        <TourOverlay
          step={tour.step}
          index={tour.index}
          total={tour.total}
          ringClass="border-teal-500"
          buttonClass="bg-teal-600 hover:bg-teal-700"
          dotClass="bg-teal-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
