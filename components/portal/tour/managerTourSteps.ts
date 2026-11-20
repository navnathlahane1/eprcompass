import type { TourStep } from '@/components/portal/tour/usePortalTour';

export const MANAGER_TOUR_STEPS: TourStep[] = [
  {
    id: '/manager/dashboard',
    title: 'Dashboard',
    body: 'Your daily overview — see overdue tasks, upcoming filing deadlines, and client alerts at a glance.',
  },
  {
    id: '/manager/clients',
    title: 'My Clients',
    body: 'Check the compliance status, open filings, and pending documents for every client assigned to you.',
  },
  {
    id: '/manager/filings',
    title: 'Filings',
    body: 'Track EPR filing due dates for your clients so nothing gets submitted late.',
  },
  {
    id: '/manager/tasks',
    title: 'Tasks',
    body: 'Your general task list — review what is pending and mark items complete as you finish them.',
  },
  {
    id: '/manager/epr-tasks',
    title: 'EPR Tasks',
    body: 'Compliance tasks tied directly to EPR filings — assign them to the right client and track progress.',
  },
];
