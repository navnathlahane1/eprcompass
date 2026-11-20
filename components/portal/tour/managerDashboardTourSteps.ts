import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the compliance manager dashboard (matched via TourTarget ids).
 */
const ROUTE = '/manager/dashboard';

export const MANAGER_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up your account',
    body: 'A quick checklist of what\'s left before you\'re fully set up — complete your profile, get clients assigned, and finish your first task.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your workload at a glance',
    body: 'Total and active clients, at-risk accounts, pending filings, docs awaiting review, and open tasks — click any card to jump straight there.',
  },
  {
    id: 'dash-recent-activity',
    route: ROUTE,
    title: 'Recent filing activity',
    body: 'The latest status changes across your assigned clients\' filings, so you can spot what moved without digging through each client.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Shortcuts to the things you\'ll check most often — your client list, all filings, at-risk clients, and overdue filings.',
  },
];
