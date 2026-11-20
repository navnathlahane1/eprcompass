import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the tendering dashboard (matched via TourTarget ids).
 */
const ROUTE = '/tendering/dashboard';

export const TENDERING_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up tendering',
    body: 'This checklist shows what\'s left before your pipeline is fully up and running — add active tenders and review upcoming deadlines.',
  },
  {
    id: 'dash-kpi-cards',
    route: ROUTE,
    title: 'Your pipeline at a glance',
    body: 'Total tenders, active bids, wins, losses, success rate, and contract value — the six numbers that summarize your tendering performance.',
  },
  {
    id: 'dash-status-breakdown',
    route: ROUTE,
    title: 'See where every tender stands',
    body: 'The status breakdown shows how your tenders are distributed across stages, and top categories shows where you win most often.',
  },
  {
    id: 'dash-recent-activity',
    route: ROUTE,
    title: 'Track recent tender activity',
    body: 'A running list of the latest tenders touched, with status and deadline — your quick way to catch up on what\'s moving.',
  },
];
