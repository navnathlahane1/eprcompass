import type { TourStep } from '@/components/portal/tour/usePortalTour';

export const COMMS_TOUR_STEPS: TourStep[] = [
  { id: '/comms/dashboard', title: 'Dashboard', body: 'Your marketing command centre — a quick view of campaigns, content, and what needs attention.' },
  { id: '/comms/vault', title: 'Account Vault', body: 'Securely stored logins for social media and marketing accounts, shared safely across the team.' },
  { id: '/comms/studio', title: 'Content Studio', body: 'Create, edit, and organise marketing content — posts, graphics, and copy — in one workspace.' },
  { id: '/comms/analytics', title: 'Analytics', body: 'See how your content and campaigns are performing across channels.' },
  { id: '/comms/studio/schedule', title: 'Publish Queue', body: 'Everything scheduled to go live — check what is queued and when it will post.' },
  { id: '/comms/rbac', title: 'Permissions Matrix', body: 'Control which team members can access which comms tools and accounts.' },
];
