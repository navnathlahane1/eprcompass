import type { TourStep } from '@/components/portal/tour/usePortalTour';

export const IAM_TOUR_STEPS: TourStep[] = [
  { id: '/iam/dashboard', title: 'Dashboard', body: 'An overview of access-management activity across every portal — new users, pending requests, and recent changes.' },
  { id: '/iam/tasks', title: 'Tasks', body: 'Access-related tasks assigned to you, like approvals or account fixes that need action.' },
  { id: '/iam/users', title: 'All Users', body: 'The full directory of users across all portals — search, view, and manage any account.' },
  { id: '/iam/managers', title: 'Managers', body: 'A list of manager-level accounts and the teams or clients each one oversees.' },
  { id: '/iam/create', title: 'Create User', body: 'Set up a brand-new portal account and assign it the right role.' },
  { id: '/iam/requests', title: 'User Requests', body: 'Requests from staff for new accounts, role changes, or access — review and approve them here.' },
  { id: '/iam/recycler-approvals', title: 'Recycler Approvals', body: 'Recycler portal sign-ups waiting for verification before they can be approved.' },
  { id: '/iam/audit', title: 'Audit Log', body: 'A record of every access and permission change made across the portals, for accountability.' },
];
