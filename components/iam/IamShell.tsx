'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { IAM_TOUR_STEPS } from '@/components/portal/tour/iamTourSteps';
import { IAM_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/iamDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY = 'iam-sidebar-collapsed';

const NAV = [
  {
    href: '/iam/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/iam/tasks',
    label: 'Tasks',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    badge: true,
  },
  {
    href: '/iam/users',
    label: 'All Users',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    href: '/iam/managers',
    label: 'Managers',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    href: '/iam/create',
    label: 'Create User',
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  {
    href: '/iam/requests',
    label: 'User Requests',
    icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
    requestBadge: true,
  },
  {
    href: '/iam/recycler-approvals',
    label: 'Recycler Approvals',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    recyclerBadge: true,
  },
  {
    href: '/iam/audit',
    label: 'Audit Log',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
];

// Portal quick-links
const PORTAL_LINKS = [
  { label: 'EPR Portal',       href: '/portal/dashboard',          color: 'text-blue-400' },
  { label: 'Partner',          href: '/partner/dashboard',         color: 'text-indigo-400' },
  { label: 'CEPC',             href: '/cepc/dashboard',            color: 'text-violet-400' },
  { label: 'Recycler',         href: '/recycler/dashboard',        color: 'text-teal-400' },
  { label: 'Recycler Portal',  href: '/recycler-portal/dashboard', color: 'text-emerald-400' },
  { label: 'Telecalling',      href: '/telecalling',               color: 'text-orange-400' },
  { label: 'Admin Panel',      href: '/admin/dashboard',           color: 'text-rose-400' },
  { label: 'Academy',          href: '/academy/dashboard',         color: 'text-amber-400' },
  { label: 'Comms',            href: '/comms/dashboard',           color: 'text-pink-400' },
  { label: 'Finance',          href: '/finance/dashboard',         color: 'text-green-400' },
  { label: 'Manager',          href: '/manager/dashboard',         color: 'text-sky-400' },
  { label: 'Intel',            href: '/intel',                     color: 'text-purple-400' },
  { label: 'Task Manager',     href: '/taskmanager/dashboard',     color: 'text-lime-400' },
  { label: 'Tendering',        href: '/tendering/dashboard',       color: 'text-orange-300' },
  { label: 'Knowledge Hub',    href: '/knowledge/dashboard',       color: 'text-cyan-400' },
];

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
  );
}

interface Props {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail?: string;
}

export default function IamShell({ children, userName, userRole, userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taskBadge,            setTaskBadge]            = useState(0);
  const [recyclerPendingBadge, setRecyclerPendingBadge] = useState(0);
  const [requestPendingBadge,  setRequestPendingBadge]  = useState(0);

  const tour = usePortalTour({
    steps: interleaveDeepDive(IAM_TOUR_STEPS, { '/iam/dashboard': IAM_DASHBOARD_TOUR_STEPS }),
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

  useEffect(() => {
    const fetchBadge = () => {
      fetch('/api/iam/tasks?status=pending&countOnly=1')
        .then(r => r.ok ? r.json() : { count: 0 })
        .then((d: { count?: number }) => setTaskBadge(d.count ?? 0))
        .catch(() => {});
    };
    fetchBadge();
    const id = setInterval(fetchBadge, 90_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchRecyclerBadge = () => {
      fetch('/api/iam/recycler-approvals?status=PENDING')
        .then(r => r.ok ? r.json() : { total: 0 })
        .then((d: { total?: number }) => setRecyclerPendingBadge(d.total ?? 0))
        .catch(() => {});
    };
    fetchRecyclerBadge();
    const id = setInterval(fetchRecyclerBadge, 120_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchRequestBadge = () => {
      fetch('/api/iam/user-requests?status=pending&countOnly=1')
        .then(r => r.ok ? r.json() : { count: 0 })
        .then((d: { count?: number }) => setRequestPendingBadge(d.count ?? 0))
        .catch(() => {});
    };
    fetchRequestBadge();
    const id = setInterval(fetchRequestBadge, 90_000);
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
    router.push('/iam/login');
  }

  const initials = (userName || userEmail || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sidebar = (
    <aside className={`flex flex-col h-full bg-[#0c1022] border-r border-slate-800/60 transition-all duration-200 ${collapsed ? 'w-[58px]' : 'w-[230px]'}`}>

      {/* Header */}
      <div className={`flex items-center h-14 border-b border-slate-800/60 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-500/40">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">Access Manager</p>
              <p className="text-[10px] text-slate-500 truncate">Identity & Access Control</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-500/40">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={tour.start} title="Take a tour of this portal"
              className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
        {NAV.map(({ href, label, icon, badge: showBadge, recyclerBadge: showRecyclerBadge, requestBadge: showRequestBadge }: any) => {
          const active     = pathname === href || pathname.startsWith(href + '/');
          const badgeCount = showBadge ? taskBadge : showRecyclerBadge ? recyclerPendingBadge : showRequestBadge ? requestPendingBadge : 0;
          return (
            <Link
              key={href}
              href={href}
              data-tour-id={href}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-violet-500/15 text-violet-300' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-violet-400" />}
              <div className="relative shrink-0">
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${active ? 'text-violet-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {badgeCount > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                )}
              </div>
              {!collapsed && <span className="flex-1 truncate text-xs">{label}</span>}
              {!collapsed && badgeCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white bg-violet-600">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Portal quick-links section */}
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
                <span className={`h-1.5 w-1.5 rounded-full bg-current ${color}`} />
                {label}
                <svg viewBox="0 0 24 24" className="ml-auto h-3 w-3 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer: user + sign out */}
      <div className="border-t border-slate-800/60 p-2 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/15 text-[10px] font-bold text-violet-300 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName || userEmail || 'User'}</p>
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/15 text-[10px] font-bold text-violet-300 select-none" title={userName}>
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
          <span className="text-sm font-bold text-slate-100">Access Manager</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6">{children}</div>
        </main>
      </div>

      {tour.isActive && tour.step && tour.isReady && (
        <TourOverlay
          step={tour.step}
          index={tour.index}
          total={tour.total}
          ringClass="border-violet-500"
          buttonClass="bg-violet-600 hover:bg-violet-700"
          dotClass="bg-violet-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
