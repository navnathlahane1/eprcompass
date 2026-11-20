import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the legal portal dashboard (matched via TourTarget ids).
 */
const ROUTE = '/legal-portal/dashboard';

export const LEGAL_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your review workload at a glance',
    body: 'Total recyclers on the platform, and how many of their documents are pending, verified, or rejected.',
  },
  {
    id: 'dash-review-queue',
    route: ROUTE,
    title: 'Recyclers needing review',
    body: 'Every recycler with at least one pending document, sorted so you can see who to review next. Click Review to open their file.',
  },
];
