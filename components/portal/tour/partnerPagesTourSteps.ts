import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Deep-dive steps for individual Partner Portal pages beyond the dashboard,
 * highlighting real elements on each page (matched via TourTarget ids).
 * Keyed by the page's own sidebar href in buildPartnerPortalTour's deepDive map.
 */

export const PARTNER_CLIENTS_STEPS: TourStep[] = [
  {
    id: 'clients-summary-cards',
    route: '/partner/clients',
    title: 'Your client book at a glance',
    body: 'Total clients, how many are active, and how many are renewing in the next 60 days.',
  },
  {
    id: 'clients-table',
    route: '/partner/clients',
    title: 'Every client you have referred',
    body: 'Waste categories, compliance status, renewal date, and onboarding progress for each one. Click a company name to open its full record.',
  },
];

export const PARTNER_LEADS_STEPS: TourStep[] = [
  {
    id: 'leads-add-action',
    route: '/partner/leads',
    title: 'Submit a new lead',
    body: 'Refer a prospect here — company, contact details, waste categories, and services they need. Starts them at the "New" stage.',
  },
  {
    id: 'leads-summary-cards',
    route: '/partner/leads',
    title: 'Your pipeline at a glance',
    body: 'Total leads, how many are still active, how many converted, and your overall conversion rate.',
  },
  {
    id: 'leads-table',
    route: '/partner/leads',
    title: 'Track every lead through its stage',
    body: 'Click a row to expand it and see contact details, services of interest, and your notes. Use the stage filter to focus on one part of the pipeline.',
  },
];

export const PARTNER_FILINGS_STEPS: TourStep[] = [
  {
    id: 'filings-summary-cards',
    route: '/partner/filings',
    title: 'Filing status across your clients',
    body: 'How many filings are overdue, in progress, or completed — across every client you have referred.',
  },
  {
    id: 'filings-table',
    route: '/partner/filings',
    title: 'Every filing, by client',
    body: 'Service type, waste category, status, and due date for each of your clients\' EPR filings. Overdue ones are called out in red.',
  },
];

export const PARTNER_DOCUMENTS_STEPS: TourStep[] = [
  {
    id: 'documents-grid',
    route: '/partner/documents',
    title: 'Materials shared with you',
    body: 'Partner agreements, compliance guides, and co-branded marketing material from our team. Click Download to save a copy.',
  },
];

export const PARTNER_MY_DOCUMENTS_STEPS: TourStep[] = [
  {
    id: 'docs-upload-action',
    route: '/partner/my-documents',
    title: 'Upload a document',
    body: 'Add your own files here — partner agreement, KYC, certificates. You can optionally share a document with specific people by email.',
  },
  {
    id: 'docs-tabs',
    route: '/partner/my-documents',
    title: 'My Uploads vs. Shared with Me',
    body: 'Switch between documents you have uploaded and documents other people have shared with you.',
  },
];

export const PARTNER_COMMISSIONS_STEPS: TourStep[] = [
  {
    id: 'commissions-summary-cards',
    route: '/partner/commissions',
    title: 'Your earnings at a glance',
    body: 'Total paid out, pending payout, and the total revenue you have generated across all referred clients.',
  },
  {
    id: 'commissions-table',
    route: '/partner/commissions',
    title: 'Commission history, month by month',
    body: 'Revenue, rate, commission earned, and payment status for every client, broken down by billing period.',
  },
  {
    id: 'commissions-renewals',
    route: '/partner/commissions',
    title: 'Renewals and at-risk revenue',
    body: 'See which clients are renewing in the next 90 days and your estimated commission from each — scroll down for at-risk clients too.',
  },
];

export const PARTNER_TASKS_STEPS: TourStep[] = [
  {
    id: 'tasks-summary-cards',
    route: '/partner/tasks',
    title: 'Your task load at a glance',
    body: 'Open, in progress, done, and overdue counts across every task assigned to you.',
  },
  {
    id: 'tasks-filter-tabs',
    route: '/partner/tasks',
    title: 'Filter by Active, Completed, or All',
    body: 'Switch views to focus on what still needs doing or review what you have already finished.',
  },
  {
    id: 'tasks-list',
    route: '/partner/tasks',
    title: 'Check off tasks as you go',
    body: 'Click the checkbox to mark a task done, or use the status dropdown to move it between Open, In Progress, Done, or Cancelled.',
  },
];

export const PARTNER_PROFILE_STEPS: TourStep[] = [
  {
    id: 'profile-identity',
    route: '/partner/profile',
    title: 'Your company and contact details',
    body: 'This is what our team and your referred clients see. Keep it current so support and referrals go smoothly.',
  },
  {
    id: 'profile-edit-action',
    route: '/partner/profile',
    title: 'Update your details',
    body: 'Edit your phone, address, city, and state directly here — no need to email support for basic changes.',
  },
  {
    id: 'profile-message-rm',
    route: '/partner/profile',
    title: 'Message your Relationship Manager',
    body: 'Have a question or need help? Send a message straight to your assigned RM from here.',
  },
];

export const PARTNER_COMPLIANCE_STEPS: TourStep[] = [
  {
    id: 'compliance-summary-strip',
    route: '/partner/compliance',
    title: 'Compliance health across your clients',
    body: 'How many of your referred clients are compliant, need attention, or are overdue — at a glance.',
  },
  {
    id: 'compliance-client-list',
    route: '/partner/compliance',
    title: 'Health status per client and category',
    body: 'Each client shows a status per waste category, with certificate numbers and expiry dates where available.',
  },
];

export const PARTNER_CALENDAR_STEPS: TourStep[] = [
  {
    id: 'calendar-grid',
    route: '/partner/calendar',
    title: 'Every deadline, on the calendar',
    body: 'Red means overdue, amber means due within 7 days, indigo is further out. Click any entry to see the details.',
  },
  {
    id: 'calendar-upcoming',
    route: '/partner/calendar',
    title: 'What\'s coming up in the next 60 days',
    body: 'A quick list view of upcoming deadlines across all your clients, so you don\'t have to scan the whole month.',
  },
];

export const PARTNER_REFERRALS_STEPS: TourStep[] = [
  {
    id: 'referrals-summary-cards',
    route: '/partner/referrals',
    title: 'Your referral link performance',
    body: 'Total clicks, conversions, and your conversion rate for the unique link below.',
  },
  {
    id: 'referrals-link-card',
    route: '/partner/referrals',
    title: 'Share your referral link',
    body: 'Copy your link or code, or share it directly over WhatsApp or email — commission is tracked automatically on conversion.',
  },
];

export const PARTNER_TRAINING_STEPS: TourStep[] = [
  {
    id: 'training-progress',
    route: '/partner/training',
    title: 'Your certification progress',
    body: 'Complete every assigned module to earn your Certified EPR Partner badge — this bar tracks how close you are.',
  },
  {
    id: 'training-programs',
    route: '/partner/training',
    title: 'Your assigned training programmes',
    body: 'Join live sessions, watch recorded content, and mark each module as started or complete as you work through it.',
  },
];

export const PARTNER_ANNOUNCEMENTS_STEPS: TourStep[] = [
  {
    id: 'announcements-list',
    route: '/partner/announcements',
    title: 'Official updates from our team',
    body: 'Policy changes, new features, and important notices — each one stays here for a year unless you delete it.',
  },
];

export const PARTNER_TEAM_STEPS: TourStep[] = [
  {
    id: 'team-add-action',
    route: '/partner/team',
    title: 'Add a team member',
    body: 'Invite a colleague with their own login and a scoped role — Sales, Compliance, Finance, or read-only Viewer.',
  },
  {
    id: 'team-members-list',
    route: '/partner/team',
    title: 'Manage your team',
    body: 'Change a member\'s role, suspend or reactivate their access, or remove them entirely.',
  },
  {
    id: 'team-activity-log',
    route: '/partner/team',
    title: 'Every action, logged',
    body: 'A running record of what each team member has done, for accountability and auditing.',
  },
];
