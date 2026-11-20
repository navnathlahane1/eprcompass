import type { TourStep } from '@/components/portal/tour/usePortalTour';

export const TASK_MANAGER_TOUR_STEPS: TourStep[] = [
  // Command Center
  {
    id: '/taskmanager/dashboard',
    title: 'Dashboard',
    body: 'Your command center — critical warnings, overdue tasks, and team performance at a glance.',
  },
  {
    id: '/taskmanager/warnings',
    title: 'Early Warnings',
    body: 'Clients showing early risk signs before a compliance item actually breaches — act on these first.',
  },
  {
    id: '/taskmanager/breach-predict',
    title: 'Breach Predictor',
    body: 'A forward-looking view of which filings or tasks are likely to miss their deadline so you can step in early.',
  },
  {
    id: '/taskmanager/digest',
    title: 'Weekly Digest',
    body: 'A rolled-up weekly summary of task and filing status across all managers and clients.',
  },
  // Task Management
  {
    id: '/taskmanager/sixty-days-project',
    title: '60 Days Project',
    body: 'Track work planned and executed across a rolling 60-day window.',
  },
  {
    id: '/taskmanager/projects',
    title: 'Projects',
    body: 'Every active project with its task breakdown, owners, and progress.',
  },
  {
    id: '/taskmanager/projects/my-tasks',
    title: 'My Tasks',
    body: 'The tasks assigned specifically to you, sorted by due date.',
  },
  {
    id: '/taskmanager/tasks',
    title: 'Operational Tasks',
    body: 'General day-to-day operational tasks that are not tied to a specific EPR filing.',
  },
  {
    id: '/taskmanager/epr-tasks',
    title: 'EPR Compliance',
    body: 'Tasks tied directly to EPR filings and compliance deadlines for each client.',
  },
  {
    id: '/taskmanager/epr-tasks?tab=oversight',
    title: 'EPR Oversight',
    body: 'A supervisory view of EPR compliance items that are at risk across managers.',
  },
  {
    id: '/taskmanager/filings',
    title: 'Filing SLAs',
    body: 'Track turnaround time against the promised filing SLA for each client submission.',
  },
  {
    id: '/taskmanager/escalations',
    title: 'Escalations',
    body: 'Issues that were escalated because they missed a deadline or need senior attention.',
  },
  // Client Management
  {
    id: '/taskmanager/clients',
    title: 'Client Health',
    body: 'An overall compliance health score for every client account.',
  },
  {
    id: '/taskmanager/onboarding',
    title: 'Onboarding Pipeline',
    body: 'Track new clients as they move through onboarding steps before going live.',
  },
  {
    id: '/taskmanager/renewals',
    title: 'Certificate Renewals',
    body: 'Upcoming EPR certificate renewals and how far in advance each one needs action.',
  },
  {
    id: '/taskmanager/calendar',
    title: 'Regulatory Calendar',
    body: 'All statutory EPR deadlines across clients in a single calendar view.',
  },
  // Intelligence
  {
    id: '/taskmanager/team',
    title: 'Team Performance',
    body: 'See how each manager or team member is performing against their task load.',
  },
  {
    id: '/taskmanager/compliance-intel',
    title: 'Compliance Intel',
    body: 'Aggregated compliance data and trends across all clients.',
  },
  {
    id: '/taskmanager/exposure',
    title: 'EC Liability Exposure',
    body: 'How much EPR credit or liability exposure the company currently carries.',
  },
  {
    id: '/taskmanager/recyclers',
    title: 'Recycler Network',
    body: 'Recycler partners available for sourcing EPR credit fulfilment.',
  },
  {
    id: '/taskmanager/partners',
    title: 'Partner Network',
    body: 'Partner organisations referring or supporting clients.',
  },
  {
    id: '/taskmanager/reports',
    title: 'Management Reports',
    body: 'Generate and download reports for leadership review.',
  },
  // Settings
  {
    id: '/taskmanager/automation',
    title: 'Automation Rules',
    body: 'Configure rules that automatically assign, escalate, or notify based on task conditions.',
  },
];
