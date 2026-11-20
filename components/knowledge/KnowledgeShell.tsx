'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { KNOWLEDGE_TOUR_STEPS } from '@/components/portal/tour/knowledgeTourSteps';
import { KNOWLEDGE_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/knowledgeDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const STORAGE_KEY = 'knowledge-sidebar-collapsed';

const NAV = [
  {
    href: '/knowledge/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/knowledge/library',
    label: 'Library',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    href: '/knowledge/upload',
    label: 'Upload',
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    contributeOnly: true,
  },
  {
    href: '/knowledge/categories',
    label: 'Categories',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    manageOnly: true,
  },
  {
    href: '/knowledge/shared-documents',
    label: 'Shared Documents',
    icon: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 14a3 3 0 100-6 3 3 0 000 6zm12 8a3 3 0 100-6 3 3 0 000 6zM8.59 12.51l6.83 3.98M15.41 7.51L8.59 11.49',
    shareOnly: true,
  },
];

const PORTAL_LINKS = [
  { label: 'Admin Panel', href: '/admin/dashboard', color: 'text-rose-400' },
];

interface Props {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail?: string;
  canContribute?: boolean;
  canManageAll?: boolean;
  canShareDocuments?: boolean;
}

export default function KnowledgeShell({ children, userName, userRole, userEmail, canContribute, canManageAll, canShareDocuments }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tour = usePortalTour({
    steps: interleaveDeepDive(KNOWLEDGE_TOUR_STEPS, { '/knowledge/dashboard': KNOWLEDGE_DASHBOARD_TOUR_STEPS }),
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
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) setMobileOpen(true);
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
    router.push('/knowledge/login');
  }

  const initials = (userName || userEmail || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const roleLabel = userRole.replace(/^knowledge_/, '').replace(/_/g, ' ');

  const sidebar = (
    <aside className={`flex flex-col h-full bg-[#0c1022] border-r border-slate-800/60 transition-all duration-200 ${collapsed ? 'w-[58px]' : 'w-[230px]'}`}>

      {/* Header */}
      <div className={`flex items-center h-14 border-b border-slate-800/60 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/40">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">Knowledge Hub</p>
              <p className="text-[10px] text-slate-500 truncate">Document & Training Library</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/40">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

      {!collapsed && (
        <button
          onClick={tour.start}
          title="Take a tour of this portal"
          className="hidden sm:flex mx-3 mt-2 items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:border-slate-700 hover:text-slate-300 transition"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Take a tour
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {(NAV as Array<{ href: string; label: string; icon: string; contributeOnly?: boolean; manageOnly?: boolean; shareOnly?: boolean }>).filter(n => {
          if (n.contributeOnly && !canContribute) return false;
          if (n.manageOnly && !canManageAll) return false;
          if (n.shareOnly && !canShareDocuments) return false;
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
                active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-cyan-400" />}
              <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {!collapsed && <span className="flex-1 truncate text-xs">{label}</span>}
            </Link>
          );
        })}

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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/15 text-[10px] font-bold text-cyan-300 select-none">
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/15 text-[10px] font-bold text-cyan-300 select-none" title={userName}>
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
          <span className="text-sm font-bold text-slate-100">Knowledge Hub</span>
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
          ringClass="border-cyan-500"
          buttonClass="bg-cyan-600 hover:bg-cyan-700"
          dotClass="bg-cyan-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
