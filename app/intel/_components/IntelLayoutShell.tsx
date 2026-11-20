'use client';

import { useEffect, useState } from 'react';
import { CommandPalette } from './CommandPalette';
import { OpenCommandPaletteButton } from './OpenCommandPaletteButton';
import { IntelSearch } from './IntelSearch';
import IntelSidebar from './IntelSidebar';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { INTEL_TOUR_STEPS } from '@/components/portal/tour/intelTourSteps';
import { INTEL_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/intelDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY = 'intel-sidebar-collapsed';

interface IntelLayoutShellProps {
  children: React.ReactNode;
}

export default function IntelLayoutShell({ children }: IntelLayoutShellProps) {
  // Default to expanded; useEffect reads localStorage after hydration
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const tour = usePortalTour({
    steps: interleaveDeepDive(INTEL_TOUR_STEPS, { '/intel': INTEL_DASHBOARD_TOUR_STEPS }),
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
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  // Sidebar width: collapsed = 56px (w-14), expanded = 220px (w-[220px])
  const sidebarWidth = collapsed ? 'ml-14' : 'ml-[220px]';

  return (
    <>
      {/* ⌘K command palette — always mounted */}
      <CommandPalette />

      {/* Left sidebar */}
      <IntelSidebar collapsed={collapsed} onToggle={handleToggle} />

      {/* Main content area — shifts right with sidebar */}
      <div
        className={`flex min-h-screen flex-col bg-[#020817] transition-all duration-200 ${
          mounted ? sidebarWidth : 'ml-[220px]'
        }`}
      >
        {/* ── Sticky top bar ────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#020817]/95 backdrop-blur-sm">
          <div className="flex h-11 items-center justify-between gap-3 px-5">
            {/* Left: ⌘K hint */}
            <div className="flex items-center gap-2">
              <OpenCommandPaletteButton />
            </div>

            {/* Right: search + quick actions */}
            <div className="flex items-center gap-2">
              <IntelSearch />
              <button
                type="button"
                onClick={tour.start}
                title="Take a tour of this portal"
                className="hidden items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-slate-600 hover:text-slate-200 sm:flex"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Take a tour
              </button>
              <a
                href="/intel/field-explainer"
                className="hidden items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-slate-600 hover:text-slate-200 sm:flex"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Field Guide
              </a>
            </div>
          </div>
        </div>

        {/* ── Page content ──────────────────────────────────────────────────── */}
        <main className="flex-1">
          {children}
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
    </>
  );
}
