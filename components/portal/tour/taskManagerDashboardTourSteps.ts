import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the Task Control Centre dashboard (matched via TourTarget ids).
 */
const ROUTE = '/taskmanager/dashboard';

export const TASK_MANAGER_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up your account',
    body: 'A short checklist of what\'s left before you\'re fully set up — complete your profile and work through your first task.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Severity at a glance',
    body: 'Critical/overdue, urgent (next 4 hours), due today, and total open tasks across every source. Click any card to filter the warnings list.',
  },
  {
    id: 'dash-workflow-funnel',
    route: ROUTE,
    title: 'Where clients are in the pipeline',
    body: 'Tracks every lead from first contact through proposal, invoicing, onboarding, and filing — so you can spot where things are stalling.',
  },
  {
    id: 'dash-critical-feed',
    route: ROUTE,
    title: 'Critical and overdue items',
    body: 'Everything that has already breached its deadline, pulled from operational tasks, filing SLAs, and EPR compliance tasks in one feed.',
  },
];
