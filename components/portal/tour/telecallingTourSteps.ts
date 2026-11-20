import type { TourStep } from '@/components/portal/tour/usePortalTour';

export const TELECALLING_TOUR_STEPS: TourStep[] = [
  { id: '/telecalling/dashboard', title: 'Dashboard', body: 'Your daily overview — call targets, leads, and tasks that need attention.' },
  { id: '/telecalling/leads', title: 'My Leads', body: 'The leads assigned to you, ready to be called and worked.' },
  { id: '/telecalling/calls', title: 'Call Log', body: 'A record of every call made, with outcomes and notes for follow-up.' },
  { id: '/telecalling/followups', title: 'Follow-ups', body: 'Reminders for leads that need a follow-up call at a scheduled time.' },
  { id: '/telecalling/scripts', title: 'Scripts', body: 'Call scripts and talking points to guide conversations with leads.' },
  { id: '/telecalling/intelligence', title: 'Intelligence', body: 'Background information on a lead or company to help personalise your call.' },
  { id: '/telecalling/tasks', title: 'Tasks', body: 'Action items assigned to you that need to be completed.' },
  { id: '/telecalling/proposals', title: 'Proposals', body: 'Track proposals sent to leads and their current status.' },
  { id: '/telecalling/deals', title: 'Deals', body: 'Deals in progress, from first contact through to close.' },
  { id: '/telecalling/web-support', title: 'Web Support', body: 'Handle support queries coming in through the website chat or contact forms.' },
  { id: '/telecalling/team-lead/dashboard', title: 'Team Dashboard', body: 'An overview of your whole team’s call activity and performance.' },
  { id: '/telecalling/team-lead/agents', title: 'My Agents', body: 'The agents on your team and how each of them is performing.' },
  { id: '/telecalling/team-lead/analytics', title: 'Analytics', body: 'Team-wide metrics on calls, conversions, and targets.' },
  { id: '/telecalling/team-lead/leads', title: 'Team Leads', body: 'All leads assigned across your team, not just your own.' },
  { id: '/telecalling/team-lead/followups', title: 'Team Follow-ups', body: 'Follow-up reminders across the whole team, so nothing slips through.' },
  { id: '/telecalling/lead-gen', title: 'Lead Pipeline', body: 'The pipeline of leads being generated and qualified before assignment.' },
  { id: '/telecalling/appointments', title: 'Appointments', body: 'Scheduled appointments booked with leads or clients.' },
  { id: '/telecalling/crm-data', title: 'Data Entry', body: 'Enter and update CRM records directly from here.' },
  { id: '/telecalling/support', title: 'Support Queue', body: 'Incoming support requests waiting to be handled.' },
  { id: '/knowledge/dashboard', title: 'Knowledge Hub', body: 'Jump to the shared knowledge base for guides and reference material.' },
];
