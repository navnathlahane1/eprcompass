import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the client portal dashboard (matched via TourTarget ids).
 */
const ROUTE = '/portal/dashboard';

export const CLIENT_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up your account',
    body: 'This checklist shows exactly what\'s left before your account is fully set up — company profile, documents, credentials, and more.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Shortcuts to your company profile, contacts, and full activity history.',
  },
  {
    id: 'dash-epr-progress',
    route: ROUTE,
    title: 'Track your EPR progress by category',
    body: 'See how much you\'ve filed against your target for each waste category — plastic, e-waste, battery, and tyre.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your key numbers at a glance',
    body: 'Compliance score, pending documents, outstanding payments, and open services — updated live.',
  },
];
