import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the Knowledge Hub dashboard (matched via TourTarget ids).
 */
const ROUTE = '/knowledge/dashboard';

export const KNOWLEDGE_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your library at a glance',
    body: 'See how many items, documents, training materials, and categories you have — all updated live as your team uploads.',
  },
  {
    id: 'dash-recent-items',
    route: ROUTE,
    title: 'Recently added',
    body: 'The newest documents and training materials your team has uploaded, with who added them and when. Click any item to open it.',
  },
];
