import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the telecalling dashboard (matched via TourTarget ids).
 */
const ROUTE = '/telecalling/dashboard';

export const TELECALLING_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up your account',
    body: 'This checklist shows exactly what\'s left to do before you\'re fully set up — complete your profile, get assigned leads, and log your first call.',
  },
  {
    id: 'dash-daily-target',
    route: ROUTE,
    title: 'Track your daily calling target',
    body: 'See how many calls you\'ve made today against your target, your streak, and your contact rate — all updated live as you work.',
  },
  {
    id: 'dash-kpi-cards',
    route: ROUTE,
    title: 'Your key numbers at a glance',
    body: 'Calls today, connected calls, not-responded calls, and pending follow-ups — the four numbers that matter most for your day.',
  },
  {
    id: 'dash-calls-followups',
    route: ROUTE,
    title: 'Today\'s calls and upcoming follow-ups',
    body: 'A quick view of the calls you\'ve logged today and the follow-ups coming up next, so nothing slips through the cracks.',
  },
];
