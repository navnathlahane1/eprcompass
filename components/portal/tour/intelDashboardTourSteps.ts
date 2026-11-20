import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the Intel workspace home page (matched via TourTarget ids).
 */
const ROUTE = '/intel';

export const INTEL_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-kpi-strip',
    route: ROUTE,
    title: 'Your market intelligence at a glance',
    body: 'Companies tracked, pipeline value, hot leads, penalty opportunity, active sources, and enrichment coverage — the six numbers that summarize the whole workspace.',
  },
  {
    id: 'dash-modules',
    route: ROUTE,
    title: 'Jump into any module',
    body: 'Every part of Intel — Companies, Strategy Cockpit, Discovery Ops, Source Registry, and more — is one click away from here.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Quick links to the Strategy Cockpit',
    body: 'Shortcuts straight into market share, best plays, risk view, and the AI memo — the most-used cockpit canvases.',
  },
  {
    id: 'dash-waste-breakdown',
    route: ROUTE,
    title: 'Companies by waste category and certificate',
    body: 'See exactly how many companies fall into each waste category and certificate type, so you know where the opportunity is concentrated.',
  },
];
