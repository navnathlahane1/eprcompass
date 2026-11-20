'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import InboxBell from '@/components/inbox/InboxBell';
import InboxBanners from '@/components/inbox/InboxBanners';
import FeatureRequestCapture from '@/components/portal/FeatureRequestCapture';
import { usePortalTour, type TourStep } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortalNavLink {
  label: string;
  href: string;
  /** Optional SVG path data for a 24×24 viewBox icon */
  iconPath?: string;
}

export interface PortalNavSection {
  title?: string;
  links: PortalNavLink[];
}

export type PortalAccent = 'blue' | 'indigo' | 'violet' | 'teal' | 'emerald';

export interface PortalShellProps {
  children: React.ReactNode;
  portalName: string;
  portalTagline?: string;
  loginPath: string;
  storageKey: string;
  accent: PortalAccent;
  navSections: PortalNavSection[];
  /** User display name (full name or email) */
  userName?: string | null;
  /** Company or organisation name */
  companyName?: string | null;
  /** Short role label shown under the user's name */
  roleLabel?: string | null;
  /** Product-tour steps (nav walkthrough + optional page deep-dive). Omit to disable the tour. */
  tourSteps?: TourStep[];
}

// ─── Brand accent map ─────────────────────────────────────────────────────────

const COMPASS_ACCENT: {
  logoText: string;
  logoBg: string;
  activeLink: string;
  activeLinkBg: string;
  activeBar: string;
  hoverLink: string;
  avatarBg: string;
  avatarText: string;
  tagPill: string;
  tourRing: string;
  tourButton: string;
  tourDot: string;
} = {
  logoText: 'text-[#3f1b66]',
  logoBg: 'bg-[#f0e6fa]',
  activeLink: 'text-[#3f1b66] font-semibold',
  activeLinkBg: 'bg-[#f0e6fa]',
  activeBar: 'bg-[#e98200]',
  hoverLink: 'hover:bg-[#f0e6fa] hover:text-[#3f1b66]',
  avatarBg: 'bg-[#f0e6fa]',
  avatarText: 'text-[#3f1b66]',
  tagPill: 'bg-[#f0e6fa] text-[#3f1b66]',
  tourRing: 'border-[#3f1b66]',
  tourButton: 'bg-[#3f1b66] hover:bg-[#28104f]',
  tourDot: 'bg-[#e98200]',
};

// Keep the existing portal accent prop for callers, but use one EPR Compass
// palette across every signed-in workspace.
const ACCENT: Record<PortalAccent, typeof COMPASS_ACCENT> = {
  blue: COMPASS_ACCENT,
  indigo: COMPASS_ACCENT,
  violet: COMPASS_ACCENT,
  teal: COMPASS_ACCENT,
  emerald: COMPASS_ACCENT,
};

// ─── Supabase browser client ──────────────────────────────────────────────────

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Default nav icon (document) ─────────────────────────────────────────────

const DEFAULT_ICON = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';

// ─── PortalShell ─────────────────────────────────────────────────────────────

export default function PortalShell({
  children,
  portalName,
  portalTagline,
  loginPath,
  storageKey,
  accent,
  navSections,
  userName,
  companyName,
  roleLabel,
  tourSteps = [],
}: PortalShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const a = ACCENT[accent];

  // Sidebar collapse — hydration-safe localStorage read
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tour = usePortalTour({ steps: tourSteps, storageKey });

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, [storageKey]);

  // Make sure the sidebar is actually visible while the tour is highlighting a nav item
  useEffect(() => {
    if (!tour.isActive) return;
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem(storageKey, 'false');
    }
    if (window.innerWidth < 768) setMobileOpen(true);
  }, [tour.isActive, collapsed, storageKey]);

  // Some tour steps (e.g. dashboard deep-dive) only exist on one page — skip
  // past them automatically if their target isn't there once we've navigated
  // to the right page (tour.isReady guards against skipping while mid-navigation).
  useEffect(() => {
    if (!tour.isActive || !tour.step || !tour.isReady) return;
    const stepId = tour.step.id;
    if (document.querySelector(`[data-tour-id="${stepId}"]`)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(`[data-tour-id="${stepId}"]`)) tour.next();
    }, 400);
    return () => clearTimeout(t);
  }, [tour.isActive, tour.step, tour.isReady, tour.next]);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(storageKey, String(next));
  }

  async function handleSignOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    // Clear the manual access-token cookie used by server layouts
    document.cookie = 'sb-access-token=; Max-Age=0; Path=/; SameSite=Lax';
    router.push(loginPath);
  }

  // Initials from display name
  const displayName = companyName || userName || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Sidebar width classes
  const sidebarWidth = mounted ? (collapsed ? 'w-[58px]' : 'w-[240px]') : 'w-[240px]';

  // ─── Sidebar ────────────────────────────────────────────────────────────────

  const sidebar = (
    <aside
      className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-200 flex-shrink-0 ${sidebarWidth}`}
    >
      {/* Header */}
      <div
        className={`flex items-center h-14 border-b border-slate-100 px-3 flex-shrink-0 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={36} height={36} className="h-8 w-8 shrink-0 rounded-full object-contain" />
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${a.logoText}`}>{portalName}</p>
              {portalTagline && (
                <p className="text-[10px] text-slate-400 truncate">{portalTagline}</p>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={36} height={36} className="h-8 w-8 rounded-full object-contain" />
        )}
        {!collapsed && (
          <button
            onClick={handleToggle}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Collapse sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={handleToggle}
          className="flex items-center justify-center py-2.5 text-slate-400 hover:text-slate-600 transition"
          aria-label="Expand sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && !collapsed && (
              <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.links.map(({ label, href, iconPath }) => {
                const active = pathname === href || (href !== loginPath.replace('/login', '/dashboard') && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    data-tour-id={href}
                    title={collapsed ? label : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? `${a.activeLinkBg} ${a.activeLink}`
                        : `text-slate-600 ${a.hoverLink}`
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  >
                    {active && !collapsed && (
                      <span className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r ${a.activeBar}`} />
                    )}
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 shrink-0 ${active ? a.logoText : 'text-slate-400'}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath || DEFAULT_ICON} />
                    </svg>
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: user info + sign out */}
      <div className="flex-shrink-0 border-t border-slate-100 p-2 space-y-1">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${a.avatarBg} text-[10px] font-bold ${a.avatarText} select-none`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700 truncate">{displayName}</p>
                {roleLabel && (
                  <p className="text-[10px] text-slate-400 capitalize">{roleLabel}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center py-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${a.avatarBg} text-[10px] font-bold ${a.avatarText} select-none`}
                title={displayName}
              >
                {initials}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="flex w-full items-center justify-center rounded-lg py-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        )}
      </div>
    </aside>
  );

  // ─── Top bar (mobile + desktop breadcrumb) ───────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col h-screen">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex flex-col h-full w-[240px]">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-500 hover:text-slate-700 transition"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="md:hidden flex items-center gap-2">
              <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={32} height={32} className="h-7 w-7 rounded-full object-contain" />
              <span className={`text-sm font-bold ${a.logoText}`}>{portalName}</span>
            </div>
          </div>

          {/* Desktop: portal name in topbar */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{portalName}</span>
          </div>

          {/* Right: user chip + sign-out */}
          <div className="flex items-center gap-2">
            {tourSteps.length > 0 && (
              <button
                onClick={tour.start}
                title="Take a tour of this portal"
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Take a tour
              </button>
            )}
            <InboxBell />
            {!collapsed && (
              <span className={`hidden sm:inline text-[11px] font-semibold px-2.5 py-1 rounded-full ${a.tagPill}`}>
                {roleLabel || 'Portal'}
              </span>
            )}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full ${a.avatarBg} text-[10px] font-bold ${a.avatarText} select-none`}
              title={displayName}
            >
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </header>

        {/* Inbox banners */}
        <InboxBanners />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6">{children}</div>
        </main>
      </div>

      <FeatureRequestCapture portalName={portalName} />

      {tour.isActive && tour.step && tour.isReady && (
        <TourOverlay
          step={tour.step}
          index={tour.index}
          total={tour.total}
          ringClass={a.tourRing}
          buttonClass={a.tourButton}
          dotClass={a.tourDot}
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}

