import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the recycler-portal dashboard (matched via TourTarget ids).
 */
const ROUTE = '/recycler-portal/dashboard';

export const RECYCLER_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up your account',
    body: 'This checklist shows exactly what\'s left to do before you\'re fully verified — upload documents, set waste categories, and more.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your key numbers at a glance',
    body: 'These four cards update live: new tender matches, live auctions, unread CPCB alerts, and pending requests. Click any card to jump straight there.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Shortcuts to the things you\'ll do most often — browsing tenders, joining an auction, logging tonnage, or getting support.',
  },
];
