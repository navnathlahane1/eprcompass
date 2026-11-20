'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { TENDERING_TOUR_STEPS } from '@/components/portal/tour/tenderingTourSteps';
import { TENDERING_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/tenderingDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY  = 'tendering-sidebar-collapsed';
const OPEN_GRP_KEY = 'tendering-open-groups';

// ── Icons (SVG path strings) ──────────────────────────────────────────────────
const ICONS = {
  dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  myTenders:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  bids:         'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  calendar:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  pipeline:     'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12',
  allTenders:   'M4 6h16M4 10h16M4 14h16M4 18h7',
  newTender:    'M12 4v16m8-8H4',
  shortlisted:  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  submitted:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  bidMgmt:      'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  bidTracker:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  technical:    'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  financial:    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  vendors:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  contracts:    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  documents:    'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  analytics:    'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  compliance:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  settings:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  tender:       'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  chevronDown:  'M19 9l-7 7-7-7',
  chevronRight: 'M9 5l7 7-7 7',
  collapse:     'M15 18l-6-6 6-6',
  expand:       'M9 18l6-6-6-6',
  menu:         'M4 6h16M4 12h16M4 18h16',
  logout:       'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

// ── Nav types ─────────────────────────────────────────────────────────────────
type SubItem  = { href: string; label: string; icon: string };
type NavLeaf  = { type: 'leaf';    href: string; label: string; icon: string; managerOnly?: boolean };
type NavGroup = { type: 'group';   id: string;   label: string; icon: string; items: SubItem[]; managerOnly?: boolean };
type NavDiv   = { type: 'divider'; id: string };
type NavEntry = NavLeaf | NavGroup | NavDiv;

const NAV: NavEntry[] = [
  // ── All roles ──────────────────────────────────────────────────────────────
  { type: 'leaf',    href: '/tendering/dashboard',  label: 'Dashboard',  icon: ICONS.dashboard  },
  { type: 'leaf',    href: '/tendering/my-tenders', label: 'My Tenders', icon: ICONS.myTenders  },
  { type: 'leaf',    href: '/tendering/bids',       label: 'Bids',       icon: ICONS.bids       },
  { type: 'leaf',    href: '/tendering/calendar',   label: 'Calendar',   icon: ICONS.calendar   },

  // ── Manager-only sections ──────────────────────────────────────────────────
  { type: 'divider', id: 'd1' },
  {
    type: 'group', id: 'pipeline', label: 'Tender Pipeline', icon: ICONS.pipeline, managerOnly: true,
    items: [
      { href: '/tendering/tenders',             label: 'All Tenders',  icon: ICONS.allTenders  },
      { href: '/tendering/tenders/new',         label: 'New Tender',   icon: ICONS.newTender   },
      { href: '/tendering/tenders/shortlisted', label: 'Shortlisted',  icon: ICONS.shortlisted },
      { href: '/tendering/tenders/submitted',   label: 'Submitted',    icon: ICONS.submitted   },
    ],
  },
  {
    type: 'group', id: 'bidmgmt', label: 'Bid Management', icon: ICONS.bidMgmt, managerOnly: true,
    items: [
      { href: '/tendering/bid-tracker',             label: 'Bid Tracker',     icon: ICONS.bidTracker },
      { href: '/tendering/evaluation/technical',    label: 'Technical Eval',  icon: ICONS.technical  },
      { href: '/tendering/evaluation/financial',    label: 'Financial Eval',  icon: ICONS.financial  },
    ],
  },
  { type: 'leaf', href: '/tendering/vendors',   label: 'Vendors',   icon: ICONS.vendors,   managerOnly: true },
  { type: 'leaf', href: '/tendering/contracts', label: 'Contracts', icon: ICONS.contracts, managerOnly: true },
  { type: 'leaf', href: '/tendering/documents', label: 'Documents', icon: ICONS.documents, managerOnly: true },
  { type: 'divider', id: 'd2' },
  { type: 'leaf', href: '/tendering/govt-tenders',           label: 'Govt Tenders',      icon: ICONS.allTenders, managerOnly: true },
  { type: 'leaf', href: '/tendering/recycler-subscriptions', label: 'Subscriptions',     icon: ICONS.vendors,    managerOnly: true },
  { type: 'leaf', href: '/tendering/filing-requests',        label: 'Filing Requests',   icon: ICONS.contracts,  managerOnly: true },
  { type: 'divider', id: 'd2b' },
  { type: 'leaf', href: '/tendering/analytics',  label: 'Analytics',   icon: ICONS.analytics,  managerOnly: true },
  { type: 'leaf', href: '/tendering/compliance', label: 'Compliance',  icon: ICONS.compliance, managerOnly: true },
  { type: 'leaf', href: '/tendering/settings',   label: 'Settings',    icon: ICONS.settings,   managerOnly: true },
];

// Maps a sub-item href to the id of the group it lives in, so the tour can
// auto-expand the right accordion group before highlighting a nested step.
const SUBITEM_GROUP: Record<string, string> = {};
for (const entry of NAV) {
  if (entry.type === 'group') {
    for (const sub of entry.items) {
      SUBITEM_GROUP[sub.href] = entry.id;
    }
  }
}

function getDefaultOpenGroups(pathname: string): Set<string> {
  const defaults = new Set<string>();
  for (const item of NAV) {
    if (item.type === 'group') {
      if (item.items.some(s => pathname.startsWith(s.href))) {
        defaults.add(item.id);
      }
    }
  }
  return defaults;
}

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'h-4 w-4'} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

interface Props {
  children:  React.ReactNode;
  userName:  string;
  userRole:  string;
  userEmail?: string;
}

export default function TenderingShell({ children, userName, userRole, userEmail }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const isManager   = userRole === 'tendering_manager' || userRole === 'admin';

  const [collapsed,  setCollapsed]  = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const tour = usePortalTour({
    steps: interleaveDeepDive(TENDERING_TOUR_STEPS, { '/tendering/dashboard': TENDERING_DASHBOARD_TOUR_STEPS }),
    storageKey: STORAGE_KEY,
  });

  // Make sure the sidebar (and, if needed, the accordion group) is visible
  // while the tour is highlighting a nav item.
  useEffect(() => {
    if (!tour.isActive) return;
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) setMobileOpen(true);
    const stepId = tour.step?.id;
    const groupId = stepId ? SUBITEM_GROUP[stepId] : undefined;
    if (groupId) {
      setOpenGroups((prev) => {
        if (prev.has(groupId)) return prev;
        const next = new Set(prev);
        next.add(groupId);
        return next;
      });
    }
  }, [tour.isActive, tour.step, collapsed]);

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);

    const storedGroups = localStorage.getItem(OPEN_GRP_KEY);
    if (storedGroups) {
      try {
        const parsed: string[] = JSON.parse(storedGroups);
        const merged = new Set([...parsed, ...Array.from(getDefaultOpenGroups(pathname))]);
        setOpenGroups(merged);
      } catch {
        setOpenGroups(getDefaultOpenGroups(pathname));
      }
    } else {
      setOpenGroups(getDefaultOpenGroups(pathname));
    }
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      for (const item of NAV) {
        if (item.type === 'group' && item.items.some(s => pathname.startsWith(s.href))) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, [pathname]);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(OPEN_GRP_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  async function handleLogout() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; Max-Age=0; path=/';
    router.push('/tendering/login');
  }

  const initials = (userName || userEmail || 'T')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const sidebar = (
    <aside className={`flex flex-col h-full bg-slate-900 border-r border-amber-900/30 transition-all duration-200 ${collapsed ? 'w-[58px]' : 'w-[240px]'}`}>

      {/* Header */}
      <div className={`flex items-center h-14 border-b border-amber-900/30 px-3 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40">
              <Icon path={ICONS.tender} className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">Tendering Portal</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{userRole.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40">
            <Icon path={ICONS.tender} className="h-3.5 w-3.5 text-amber-400" />
          </div>
        )}
        {!collapsed && (
          <button onClick={handleToggle} aria-label="Collapse sidebar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition">
            <Icon path={ICONS.collapse} className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={handleToggle} aria-label="Expand sidebar"
          className="flex items-center justify-center py-2 text-slate-600 hover:text-slate-300 transition">
          <Icon path={ICONS.expand} className="h-4 w-4" />
        </button>
      )}

      {!collapsed && (
        <button onClick={tour.start} title="Take a tour of this portal"
          className="hidden sm:flex mx-3 mt-2 items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:border-slate-700 hover:text-slate-300 transition">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Take a tour
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700/50">
        {NAV.map((entry) => {
          if (entry.type === 'divider') {
            if (collapsed) return null;
            return <div key={entry.id} className="my-2 border-t border-slate-800/60" />;
          }

          if (entry.type === 'leaf') {
            if (entry.managerOnly && !isManager) return null;
            const active = pathname === entry.href || (entry.href !== '/tendering' && pathname.startsWith(entry.href + '/'));
            return (
              <Link key={entry.href} href={entry.href}
                data-tour-id={entry.href}
                title={collapsed ? entry.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                {active && !collapsed && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-amber-400" />}
                <Icon path={entry.icon} className={`h-4 w-4 shrink-0 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                {!collapsed && <span className="flex-1 truncate text-xs">{entry.label}</span>}
              </Link>
            );
          }

          if (entry.type === 'group') {
            if (entry.managerOnly && !isManager) return null;
            const isOpen    = openGroups.has(entry.id);
            const anyActive = entry.items.some(s => pathname.startsWith(s.href));

            if (collapsed) {
              return (
                <div key={entry.id} className="relative">
                  <button title={entry.label}
                    className={`relative flex w-full items-center justify-center rounded-lg px-2 py-2 transition-colors ${
                      anyActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500 hover:bg-slate-800/70 hover:text-slate-300'
                    }`}
                  >
                    <Icon path={entry.icon} className="h-4 w-4" />
                    {anyActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-amber-400" />}
                  </button>
                </div>
              );
            }

            return (
              <div key={entry.id}>
                <button onClick={() => toggleGroup(entry.id)}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    anyActive && !isOpen
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  {anyActive && !isOpen && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-amber-400" />}
                  <Icon path={entry.icon} className={`h-4 w-4 shrink-0 ${anyActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="flex-1 truncate text-xs text-left">{entry.label}</span>
                  <Icon path={isOpen ? ICONS.chevronDown : ICONS.chevronRight} className="h-3 w-3 text-slate-600 shrink-0" />
                </button>
                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-800/60 pl-3">
                    {entry.items.map(sub => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                      return (
                        <Link key={sub.href} href={sub.href}
                          data-tour-id={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className={`relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                            subActive
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                          }`}
                        >
                          {subActive && <span className="absolute -left-3 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-r bg-amber-400" />}
                          <Icon path={sub.icon} className={`h-3.5 w-3.5 shrink-0 ${subActive ? 'text-amber-400' : 'text-slate-600'}`} />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800/60 p-2 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 text-[10px] font-bold text-amber-300 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{userName || userEmail || 'Tendering'}</p>
              <p className="text-[10px] capitalize text-slate-500">{userRole.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition">
              <Icon path={ICONS.logout} className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 text-[10px] font-bold text-amber-300 select-none" title={userName}>
                {initials}
              </div>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="flex w-full items-center justify-center rounded-lg py-2 text-slate-600 hover:bg-slate-800 hover:text-rose-400 transition">
              <Icon path={ICONS.logout} className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#020817] text-slate-100">
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col h-screen shrink-0 transition-all duration-200 ${
        mounted ? (collapsed ? 'w-[58px]' : 'w-[240px]') : 'w-[240px]'
      }`}>
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col h-full w-[240px]">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex md:hidden items-center h-14 px-4 border-b border-amber-900/20 bg-slate-900/95 backdrop-blur-sm shrink-0">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
            className="mr-3 text-slate-500 hover:text-slate-200 transition">
            <Icon path={ICONS.menu} className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-slate-100">Tendering Portal</span>
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
          ringClass="border-amber-500"
          buttonClass="bg-amber-600 hover:bg-amber-700"
          dotClass="bg-amber-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
