import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the Ops portal dashboard (matched via TourTarget ids).
 */
const ROUTE = '/ops/dashboard';

export const OPS_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your day at a glance',
    body: 'These cards show your check-in status, active tasks, daily log, and training progress — all updating in real time.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Shortcuts tailored to your role — the things you\'ll need to open most often are just one click away.',
  },
  {
    id: 'dash-training-reminder',
    route: ROUTE,
    title: 'Finish your onboarding training',
    body: 'This banner shows up until you\'ve completed training — it walks you through how to use the portal and your role.',
  },
];
