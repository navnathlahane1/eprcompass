import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the CEPC consultant portal dashboard (matched via TourTarget ids).
 */
const ROUTE = '/cepc/dashboard';

export const CEPC_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your key numbers at a glance',
    body: 'Leads submitted, accepted, converted, and commission pending — your performance snapshot.',
  },
  {
    id: 'dash-submit-lead',
    route: ROUTE,
    title: 'Submit a new lead',
    body: 'Refer a prospective client here — fill in their details and the waste categories they need help with.',
  },
  {
    id: 'dash-my-leads',
    route: ROUTE,
    title: 'Track your submitted leads',
    body: 'See the status of every lead you have referred, from Submitted through to Converted.',
  },
];
