import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the IAM (Access Manager) dashboard (matched via TourTarget ids).
 */
const ROUTE = '/iam/dashboard';

export const IAM_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up Access Manager',
    body: 'This checklist tracks what\'s left to do before your IAM workspace is fully configured — reviewing users and more.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your platform at a glance',
    body: 'Total users, new signups this week, banned accounts, and active portals — all updated live.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Create a user, manage compliance managers, review banned accounts, or check the audit log — all one click away.',
  },
];
