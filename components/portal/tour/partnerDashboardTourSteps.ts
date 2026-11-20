import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the partner portal dashboard (matched via TourTarget ids).
 */
const ROUTE = '/partner/dashboard';

export const PARTNER_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-alerts',
    route: ROUTE,
    title: 'Clients that need attention',
    body: 'Any referred client with an overdue filing or an expiring certificate shows up here first, so you know who to follow up with.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your key numbers at a glance',
    body: 'Active clients, open leads, pending payout, and open tasks — click any card to jump straight there.',
  },
  {
    id: 'dash-readiness',
    route: ROUTE,
    title: 'Your partner readiness checklist',
    body: 'Agreement, welcome kit, training, and portal access — finish these to unlock full partner benefits.',
  },
  {
    id: 'dash-tabs',
    route: ROUTE,
    title: 'Overview, Onboarding, and Resources',
    body: 'Switch between your account overview, your step-by-step onboarding checklist, and pitch decks or training material in Resources.',
  },
  {
    id: 'dash-partner-details',
    route: ROUTE,
    title: 'Your partner profile',
    body: 'Contact details, partner type, commission terms, and your assigned relationship manager — all in one place. Your Partner ID is here if support ever asks for it.',
  },
  {
    id: 'dash-earnings-summary',
    route: ROUTE,
    title: 'Earnings summary',
    body: 'Total earned vs. pending payout at a glance. Click through to see the full commission history for every conversion.',
  },
  {
    id: 'dash-performance',
    route: ROUTE,
    title: 'Your partner tier and performance',
    body: 'See your current tier (Silver/Gold/Platinum), how many more clients you need for the next one, and your conversion rate.',
  },
];
