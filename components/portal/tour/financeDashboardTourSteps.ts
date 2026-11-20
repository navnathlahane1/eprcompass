import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the Finance portal dashboard (matched via TourTarget ids).
 */
const ROUTE = '/finance/dashboard';

export const FINANCE_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up Finance',
    body: 'This checklist tracks what\'s left before your finance workspace is fully configured — reviewing invoices, processing payments, and more.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your billing position at a glance',
    body: 'Total billed, collected, outstanding, and overdue amounts — updated live so you always know where cash stands.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Create an invoice, track payments, chase overdue accounts, or pull revenue reports — all one click away.',
  },
];
