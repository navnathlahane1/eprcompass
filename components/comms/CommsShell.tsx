'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { COMMS_TOUR_STEPS } from '@/components/portal/tour/commsTourSteps';
import { COMMS_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/commsDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const STORAGE_KEY = 'comms-sidebar-collapsed';

const NAV = [
  {
    href: '/comms/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/comms/vault',
    label: 'Account Vault',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    vaultOnly: true,
  },
  {
    href: '/comms/studio',
    label: 'Content Studio',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    href: '/comms/analytics',
    label: 'Analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    href: '/comms/studio/schedule',
    label: 'Publish Queue',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    queueOnly: true,
  },
  {
    href: '/comms/rbac',
    label: 'Permissions Matrix',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    adminOnly: true,
  },
];

const PHASE_PLACEHOLDERS: { label: string; phase: string; icon: string }[] = [];


const PORTAL_LINKS = [
  { label: 'Admin Panel', href: '/admin/dashboard', color: 'text-rose-400' },
];

interface Props {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail?: string;
  canAccessRbac?: boolean;
  canAccessVault?: boolean;
  canAccessQueue?: boolean;
}

export default function CommsShell({ children, userName, userRole, userEmail, canAccessRbac, canAccessVault, canAccessQueue }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tour = usePortalTour({
    steps: interleaveDeepDive(COMMS_TOUR_STEPS, { '/comms/dashboard': COMMS_DASHBOARD_TOUR_STEPS }),
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

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  async function handleLogout() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; Max-Age=0; path=/';
    router.push('/comms/login');
  }

  const initials = (userName || userEmail || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const roleLabel = userRole.replace(/^comms_/, '').replace(/_/g, ' ');

  const sidebar = (
    <aside className={`flex flex-col h-full bg-[#0c1022] border-r border-slate-800/60 transition-all duration-200 ${collapsed ? 'w-[58px]' : 'w-[230px]'}`}>

      {/* Header */}
      <div className={`flex items-center h-14 border-b border-slate-800/60 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={32} height={32} className="h-7 w-7 shrink-0 rounded-full object-contain" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">Comms Studio</p>
              <p className="text-[10px] text-slate-500 truncate">Marketing Command Centre</p>
            </div>
          </div>
        )}
        {collapsed && (
          <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={32} height={32} className="h-7 w-7 rounded-full object-contain" />
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
        {(NAV as Array<{ href: string; label: string; icon: string; adminOnly?: boolean; vaultOnly?: boolean; queueOnly?: boolean }>).filter(n => {
          if (n.adminOnly && !canAccessRbac)  return false;
          if (n.vaultOnly && !canAccessVault) return false;
          if (n.queueOnly && !canAccessQueue) return false;
          return true;
        }).map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              data-tour-id={href}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-emerald-400" />}
              <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {!collapsed && <span className="flex-1 truncate text-xs">{label}</span>}
            </Link>
          );
        })}

        {/* Phase 2/3 placeholders */}
        {!collapsed && (
          <div className="mt-2 space-y-0.5">
            {PHASE_PLACEHOLDERS.map(({ label, phase, icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 cursor-not-allowed select-none">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-800" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className="flex-1 truncate">{label}</span>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-slate-800/80 text-slate-600">{phase}</span>
              </div>
            ))}
          </div>
        )}

        {/* Portal quick-links */}
        {!collapsed && (
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Portals</p>
            {PORTAL_LINKS.map(({ label, href, color }) => (
              <Link key={href} href={href} target="_blank" rel="noopener"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition">
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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-[10px] font-bold text-emerald-300 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName || userEmail || 'User'}</p>
              <p className="text-[10px] capitalize text-slate-500">{roleLabel}</p>
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-[10px] font-bold text-emerald-300 select-none" title={userName}>
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
        <header className="flex md:hidden items-center h-14 px-4 border-b border-slate-800/60 bg-[#0c1022]/95 backdrop-blur-sm shrink-0">
          <button onClick={() => setMobileOpen(true)} className="mr-3 text-slate-500 hover:text-slate-200 transition" aria-label="Open menu">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={32} height={32} className="mr-2 h-7 w-7 rounded-full object-contain" />
          <span className="text-sm font-bold text-slate-100">Comms Studio</span>
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
          ringClass="border-emerald-500"
          buttonClass="bg-emerald-600 hover:bg-emerald-700"
          dotClass="bg-emerald-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
