import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the main admin dashboard (matched via TourTarget ids).
 */
const ROUTE = '/admin/dashboard';

export const ADMIN_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-alerts-strip',
    route: ROUTE,
    title: 'What needs your attention right now',
    body: 'Overdue filings, deadlines in the next 7 days, overdue invoices, and high-risk recyclers — the things worth checking first every day.',
  },
  {
    id: 'dash-kpi-bar',
    route: ROUTE,
    title: 'Business health at a glance',
    body: 'Active clients, revenue, leads, and overdue items with month-over-month deltas, so you can spot trends without digging into reports.',
  },
  {
    id: 'dash-revenue-leads',
    route: ROUTE,
    title: 'Revenue and lead trends',
    body: 'Track billed vs. collected revenue with a short-term forecast, alongside your lead funnel and conversion by source.',
  },
  {
    id: 'dash-deadlines-activity',
    route: ROUTE,
    title: 'Upcoming deadlines and recent activity',
    body: 'The next filings due, the latest activity logged across clients and partners, and AI-generated insights — all in one place.',
  },
];
