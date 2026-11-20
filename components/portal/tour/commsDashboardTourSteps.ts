import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the Marketing Command Centre dashboard (matched via TourTarget ids).
 */
const ROUTE = '/comms/dashboard';

export const COMMS_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Shortcuts to the three places you\'ll spend most of your time — the Account Vault, Content Studio, and Analytics.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your content pipeline at a glance',
    body: 'Total accounts, content items in review, ready to publish, and already published — updated live as your team works.',
  },
  {
    id: 'dash-recent-content',
    route: ROUTE,
    title: 'Recent content',
    body: 'The latest posts your team has drafted or scheduled, with their platform and status. Click any item to open it in the studio.',
  },
];
