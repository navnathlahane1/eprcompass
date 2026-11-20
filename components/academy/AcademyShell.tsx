'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { usePortalTour } from '@/components/portal/tour/usePortalTour';
import TourOverlay from '@/components/portal/tour/TourOverlay';
import { ACADEMY_TOUR_STEPS, ACADEMY_TOUR_STEP_GROUP } from '@/components/portal/tour/academyTourSteps';
import { ACADEMY_DASHBOARD_TOUR_STEPS } from '@/components/portal/tour/academyDashboardTourSteps';
import { interleaveDeepDive } from '@/components/portal/tour/tourTypes';

const STORAGE_KEY  = 'academy-sidebar-collapsed';
const OPEN_GRP_KEY = 'academy-open-groups';

import type { AcademyRole } from '@/lib/academy/access';

// ── Icons ─────────────────────────────────────────────────────────────────────
const I = {
  dashboard:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  programs:      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  sessions:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  trainers:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  registrations: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  calendar:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  marketplace:   'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  certifications:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  events:        'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  compliance:    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  institutions:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  campaigns:     'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  evidence:      'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  lms:           'M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  reports:       'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  settings:      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  chevronDown:   'M19 9l-7 7-7-7',
  collapse:      'M15 18l-6-6 6-6',
  expand:        'M9 18l6-6-6-6',
  menu:          'M4 6h16M4 12h16M4 18h16',
  logout:        'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  ai:            'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2m-4 0H9m4 0v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4m4 0H9',
  revenue:       'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  attendance:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  learners:      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  assessments:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  finance:       'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  live:          'M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  upgrade:       'M5 10l7-7m0 0l7 7m-7-7v18',
  cockpit:       'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  placement:     'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  content:       'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  bell:          'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
};

// ── Nav definition ─────────────────────────────────────────────────────────────
// `roles` = which roles see this entry. Omit to show to everyone.
type SubItem  = { href: string; label: string; icon: string };
type NavLeaf  = { type: 'leaf';  href: string; label: string; icon: string; badge?: boolean; roles?: AcademyRole[] };
type NavGroup = { type: 'group'; id: string;   label: string; icon: string; items: (SubItem & { roles?: AcademyRole[] })[]; roles?: AcademyRole[] };
type NavDiv   = { type: 'divider'; id: string };
type NavEntry = NavLeaf | NavGroup | NavDiv;

const ALL_ROLES: AcademyRole[] = ['academy_director', 'academy_manager', 'training_program_manager', 'trainer', 'guest_trainer', 'partner_trainer', 'learner', 'admin'];
const LEARNER_ONLY: AcademyRole[] = ['learner'];
const DIRECTOR_MANAGER: AcademyRole[] = ['academy_director', 'academy_manager', 'admin'];
const DIRECTOR_ONLY: AcademyRole[] = ['academy_director', 'admin'];
const PROGRAM_AND_ABOVE: AcademyRole[] = ['academy_director', 'academy_manager', 'training_program_manager', 'admin'];
const TRAINER_AND_ABOVE: AcademyRole[] = ['academy_director', 'academy_manager', 'training_program_manager', 'trainer', 'admin'];
const PARTNER_TRAINER_ONLY: AcademyRole[] = ['partner_trainer'];
const INTERNAL_AND_PARTNER: AcademyRole[] = ['academy_director', 'academy_manager', 'training_program_manager', 'trainer', 'partner_trainer', 'admin'];

const NAV: NavEntry[] = [
  { type: 'leaf', href: '/academy/dashboard', label: 'Academy Dashboard', icon: I.dashboard },
  { type: 'leaf', href: '/academy/calendar',  label: 'Training Calendar',  icon: I.calendar  },

  { type: 'divider', id: 'd1' },

  // Learner self-service (only for learner role)
  { type: 'leaf', href: '/academy/learners/my', label: 'My Learning', icon: I.learners, roles: LEARNER_ONLY },

  {
    type: 'group', id: 'programs', label: 'Programs', icon: I.programs, roles: PROGRAM_AND_ABOVE,
    items: [
      { href: '/academy/programs',        label: 'All Programs',   icon: I.programs      },
      { href: '/academy/programs/create', label: 'Create Program', icon: I.sessions,      roles: DIRECTOR_MANAGER },
      { href: '/academy/sessions',        label: 'Sessions',       icon: I.sessions      },
      { href: '/academy/registrations',   label: 'Registrations',  icon: I.registrations, roles: DIRECTOR_MANAGER },
      { href: '/academy/attendance',      label: 'Attendance',     icon: I.attendance    },
    ],
  },

  // Trainer & guest trainer see sessions/attendance as top-level leaves
  { type: 'leaf', href: '/academy/profile',   label: 'My Profile',   icon: I.trainers,   roles: ['trainer', 'guest_trainer', 'partner_trainer'] },
  { type: 'leaf', href: '/academy/sessions',  label: 'My Sessions',  icon: I.sessions,   roles: ['trainer', 'guest_trainer', 'partner_trainer'] },
  { type: 'leaf', href: '/academy/attendance',label: 'Attendance',   icon: I.attendance, roles: ['trainer'] },

  { type: 'leaf', href: '/academy/marketplace', label: 'Training Marketplace', icon: I.marketplace, roles: DIRECTOR_MANAGER },
  { type: 'leaf', href: '/academy/lms',          label: 'Learning Hub (LMS)',   icon: I.lms         },

  { type: 'divider', id: 'd2' },

  {
    type: 'group', id: 'trainers-mgmt', label: 'Trainers & Faculty', icon: I.trainers, roles: DIRECTOR_MANAGER,
    items: [
      { href: '/academy/trainers',         label: 'Trainer Directory',  icon: I.trainers      },
      { href: '/academy/trainers/reviews', label: 'Pending Reviews',    icon: I.assessments,  roles: ['academy_director', 'admin'] as AcademyRole[] },
    ],
  },
  { type: 'leaf', href: '/academy/certifications', label: 'Certifications',      icon: I.certifications, roles: PROGRAM_AND_ABOVE },
  { type: 'leaf', href: '/academy/events',         label: 'Events & Conferences',icon: I.events,         roles: DIRECTOR_MANAGER },

  { type: 'divider', id: 'd3' },

  {
    type: 'group', id: 'compliance', label: 'EPR Compliance', icon: I.compliance, roles: PROGRAM_AND_ABOVE,
    items: [
      { href: '/academy/compliance', label: 'Awareness Programs',  icon: I.compliance },
      { href: '/academy/campaigns',  label: 'Awareness Campaigns', icon: I.campaigns,  roles: DIRECTOR_MANAGER },
      { href: '/academy/evidence',   label: 'Evidence Repository', icon: I.evidence   },
    ],
  },

  { type: 'leaf', href: '/academy/institutions', label: 'Edu Institutions', icon: I.institutions, roles: DIRECTOR_MANAGER },

  { type: 'divider', id: 'd3b' },

  {
    type: 'group', id: 'partners', label: 'Partner Program', icon: I.trainers, roles: DIRECTOR_MANAGER,
    items: [
      { href: '/academy/partners',           label: 'Partner Directory',   icon: I.trainers      },
      { href: '/academy/partners/create',    label: 'Onboard Partner',     icon: I.sessions,      roles: DIRECTOR_ONLY },
      { href: '/academy/partner-training',   label: 'Partner Training',    icon: I.lms            },
      { href: '/academy/t3',                 label: 'T3 Certification',    icon: I.certifications },
      { href: '/academy/partners/revenue',   label: 'Revenue & Payouts',   icon: I.revenue,       roles: DIRECTOR_ONLY },
      { href: '/academy/partners/referrals', label: 'Referral Tracking',   icon: I.marketplace   },
      { href: '/academy/partners/assets',    label: 'Marketing Assets',    icon: I.evidence      },
    ],
  },

  // Partner trainer self-service section
  { type: 'divider', id: 'd3c', },
  {
    type: 'group', id: 'my-partner', label: 'My Partner Profile', icon: I.trainers, roles: PARTNER_TRAINER_ONLY,
    items: [
      { href: '/academy/partners/my',            label: 'My Profile',        icon: I.trainers      },
      { href: '/academy/partners/my/earnings',   label: 'My Earnings',       icon: I.revenue       },
      { href: '/academy/partners/my/referrals',  label: 'My Referrals',      icon: I.marketplace   },
      { href: '/academy/partners/my/assets',     label: 'My Assets',         icon: I.evidence      },
    ],
  },
  { type: 'leaf', href: '/academy/certifications', label: 'My Certifications', icon: I.certifications, roles: PARTNER_TRAINER_ONLY },
  { type: 'leaf', href: '/academy/lms',             label: 'Learning Hub',       icon: I.lms,            roles: PARTNER_TRAINER_ONLY },

  { type: 'divider', id: 'd-learners' },
  {
    type: 'group', id: 'learners-enrollment', label: 'Learners & Enrollment', icon: I.learners, roles: DIRECTOR_MANAGER,
    items: [
      { href: '/academy/learners',        label: 'Learner CRM',      icon: I.learners      },
      { href: '/academy/enrollment',      label: 'Enrollment Queue', icon: I.registrations, roles: DIRECTOR_MANAGER },
      { href: '/academy/enrollment/bulk', label: 'Bulk Enrollment',  icon: I.registrations, roles: DIRECTOR_MANAGER },
      { href: '/academy/upgrades',        label: 'Upgrade Pipeline', icon: I.upgrade,       roles: DIRECTOR_MANAGER },
    ],
  },

  { type: 'divider', id: 'd-assess' },
  {
    type: 'group', id: 'assessments', label: 'Assessments', icon: I.assessments, roles: TRAINER_AND_ABOVE,
    items: [
      { href: '/academy/assessments',        label: 'All Assessments',  icon: I.assessments },
      { href: '/academy/assessments/create', label: 'Create Assessment',icon: I.sessions,    roles: PROGRAM_AND_ABOVE },
      { href: '/academy/assessments/grades', label: 'Grade Book',       icon: I.reports      },
    ],
  },

  { type: 'divider', id: 'd-certs2' },
  {
    type: 'group', id: 'certificates', label: 'Certificates', icon: I.certifications, roles: PROGRAM_AND_ABOVE,
    items: [
      { href: '/academy/certificates',       label: 'Certificate Registry', icon: I.certifications },
      { href: '/academy/certifications',     label: 'Legacy Certs',         icon: I.certifications },
      { href: '/academy/certificates/issue', label: 'Issue Certificate',    icon: I.sessions,       roles: DIRECTOR_MANAGER },
    ],
  },

  { type: 'divider', id: 'd-comms' },
  {
    type: 'group', id: 'communications', label: 'Communications', icon: I.bell, roles: DIRECTOR_MANAGER,
    items: [
      { href: '/academy/communications',              label: 'Comms Hub',    icon: I.bell      },
      { href: '/academy/communications/broadcast',    label: 'Broadcast',    icon: I.campaigns  },
      { href: '/academy/communications/templates',    label: 'Templates',    icon: I.evidence   },
      { href: '/academy/communications/automations',  label: 'Automations',  icon: I.ai         },
    ],
  },

  { type: 'divider', id: 'd-finance' },
  {
    type: 'group', id: 'finance', label: 'Finance', icon: I.finance, roles: DIRECTOR_ONLY,
    items: [
      { href: '/academy/finance',             label: 'Finance Dashboard', icon: I.finance       },
      { href: '/academy/finance/invoices',    label: 'Invoices',          icon: I.evidence      },
      { href: '/academy/finance/emi',         label: 'EMI Tracker',       icon: I.registrations },
      { href: '/academy/finance/promo-codes', label: 'Promo Codes',       icon: I.marketplace   },
    ],
  },

  { type: 'divider', id: 'd-content' },
  {
    type: 'group', id: 'content', label: 'Content & Curriculum', icon: I.content, roles: PROGRAM_AND_ABOVE,
    items: [
      { href: '/academy/content',           label: 'Content Library', icon: I.content   },
      { href: '/academy/content/resources', label: 'Resource Hub',    icon: I.evidence  },
      { href: '/academy/feedback',          label: 'Feedback & NPS',  icon: I.reports,   roles: DIRECTOR_MANAGER },
    ],
  },

  { type: 'divider', id: 'd-live' },
  {
    type: 'group', id: 'live', label: 'Live Sessions', icon: I.live, roles: TRAINER_AND_ABOVE,
    items: [
      { href: '/academy/live', label: 'Control Room', icon: I.live },
    ],
  },

  { type: 'divider', id: 'd-placement' },
  {
    type: 'group', id: 'placement', label: 'Placement & Alumni', icon: I.placement, roles: DIRECTOR_MANAGER,
    items: [
      { href: '/academy/placement',              label: 'Placement Dashboard', icon: I.placement      },
      { href: '/academy/placement/jobs',         label: 'Job Board',           icon: I.marketplace    },
      { href: '/academy/placement/applications', label: 'Applications',        icon: I.registrations  },
      { href: '/academy/alumni',                 label: 'Alumni Directory',    icon: I.learners        },
    ],
  },

  { type: 'divider', id: 'd4' },

  {
    type: 'group', id: 'analytics', label: 'Analytics & Reports', icon: I.reports, roles: DIRECTOR_MANAGER,
    items: [
      { href: '/academy/reports',            label: 'Reports',          icon: I.reports,    roles: DIRECTOR_ONLY },
      { href: '/academy/reports/compliance', label: 'Compliance Report',icon: I.compliance                      },
      { href: '/academy/reports/revenue',    label: 'Revenue Report',   icon: I.revenue,    roles: DIRECTOR_ONLY },
    ],
  },

  {
    type: 'group', id: 'ai', label: 'AI Tools', icon: I.ai, roles: PROGRAM_AND_ABOVE,
    items: [
      { href: '/academy/ai/planner',     label: 'AI Training Planner',   icon: I.ai },
      { href: '/academy/ai/content',     label: 'AI Content Generator',  icon: I.ai },
      { href: '/academy/ai/advisor',     label: 'AI Compliance Advisor', icon: I.ai },
      { href: '/academy/ai/recommender', label: 'AI Recommendations',    icon: I.ai },
    ],
  },

  { type: 'leaf', href: '/academy/team-members', label: 'Academy Users', icon: I.learners, roles: DIRECTOR_ONLY },
  { type: 'leaf', href: '/academy/user-requests', label: 'Request Users', icon: I.trainers, roles: DIRECTOR_ONLY },
  { type: 'leaf', href: '/academy/cockpit', label: 'Director Cockpit', icon: I.cockpit, roles: DIRECTOR_ONLY },

  { type: 'divider', id: 'd5' },
  { type: 'leaf', href: '/academy/performance', label: 'Performance Evaluation', icon: I.reports, roles: DIRECTOR_ONLY },
  { type: 'leaf', href: '/academy/settings',    label: 'Settings',              icon: I.settings, roles: DIRECTOR_ONLY },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function Icon({ d, className = 'h-4 w-4' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function roleAllowed(roles: AcademyRole[] | undefined, userRole: string): boolean {
  if (!roles) return true;
  return roles.includes(userRole as AcademyRole);
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail: string;
}

export default function AcademyShell({ children, userName, userRole, userEmail }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  const [collapsed,  setCollapsed]  = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const tour = usePortalTour({
    steps: interleaveDeepDive(ACADEMY_TOUR_STEPS, { '/academy/dashboard': ACADEMY_DASHBOARD_TOUR_STEPS }),
    storageKey: STORAGE_KEY,
  });

  useEffect(() => {
    const c = localStorage.getItem(STORAGE_KEY);
    if (c !== null) setCollapsed(c === '1');
    const g = localStorage.getItem(OPEN_GRP_KEY);
    if (g) { try { setOpenGroups(JSON.parse(g)); } catch {} }
  }, []);

  // Make sure the sidebar is actually visible — and the right accordion group
  // expanded — while the tour is highlighting a nav item.
  useEffect(() => {
    if (!tour.isActive || !tour.step) return;
    if (collapsed) setCollapsed(false);
    if (window.innerWidth < 768) setMobileOpen(true);
    const groupId = ACADEMY_TOUR_STEP_GROUP[tour.step.id];
    if (groupId) setOpenGroups((prev) => (prev[groupId] ? prev : { ...prev, [groupId]: true }));
  }, [tour.isActive, tour.step, collapsed]);

  // Auto-skip a step if its target isn't in the current DOM (e.g. role-gated
  // nav item not rendered for this user)
  useEffect(() => {
    if (!tour.isActive || !tour.step || !tour.isReady) return;
    const stepId = tour.step.id;
    if (document.querySelector(`[data-tour-id="${stepId}"]`)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(`[data-tour-id="${stepId}"]`)) tour.next();
    }, 400);
    return () => clearTimeout(t);
  }, [tour.isActive, tour.step, tour.next]);

  function toggleCollapse() {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(OPEN_GRP_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await sb.auth.signOut();
    } finally {
      router.push('/academy/login');
    }
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/academy/dashboard' && pathname.startsWith(href + '/'));
  }

  function renderEntry(entry: NavEntry) {
    if (entry.type === 'divider') {
      return <div key={entry.id} className="my-2 border-t border-white/5" />;
    }

    if (entry.type === 'leaf') {
      if (!roleAllowed(entry.roles, userRole)) return null;
      const active = isActive(entry.href);
      return (
        <Link
          key={entry.href}
          href={entry.href}
          data-tour-id={entry.href}
          onClick={() => setMobileOpen(false)}
          title={collapsed ? entry.label : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group
            ${active
              ? 'bg-indigo-600/25 text-indigo-300 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.3)]'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
        >
          <span className={`shrink-0 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
            <Icon d={entry.icon} />
          </span>
          {!collapsed && <span className="truncate">{entry.label}</span>}
          {!collapsed && entry.badge && (
            <span className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-indigo-500/30 px-1 text-[10px] font-bold text-indigo-300">!</span>
          )}
        </Link>
      );
    }

    if (entry.type === 'group') {
      if (!roleAllowed(entry.roles, userRole)) return null;

      // Filter sub-items by role
      const visibleItems = entry.items.filter(it => roleAllowed(it.roles, userRole));
      if (visibleItems.length === 0) return null;

      const open      = openGroups[entry.id] ?? false;
      const anyActive = visibleItems.some(it => isActive(it.href));

      if (collapsed) {
        return (
          <div key={entry.id} className="relative">
            <button
              title={entry.label}
              className={`flex w-full items-center justify-center rounded-lg px-3 py-2.5 transition-all duration-150
                ${anyActive ? 'bg-indigo-600/25 text-indigo-300' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
            >
              <Icon d={entry.icon} />
            </button>
          </div>
        );
      }

      return (
        <div key={entry.id}>
          <button
            onClick={() => toggleGroup(entry.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
              ${anyActive ? 'text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            <span className={`shrink-0 ${anyActive ? 'text-indigo-400' : 'text-slate-500'}`}>
              <Icon d={entry.icon} />
            </span>
            <span className="flex-1 truncate text-left">{entry.label}</span>
            <span className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>
              <Icon d={I.chevronDown} className="h-3 w-3" />
            </span>
          </button>

          {open && (
            <div className="mt-0.5 ml-4 space-y-0.5 border-l border-white/5 pl-3">
              {visibleItems.map(sub => {
                const active = isActive(sub.href);
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    data-tour-id={sub.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150
                      ${active
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                  >
                    <Icon d={sub.icon} className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  const ROLE_LABELS: Record<string, string> = {
    academy_director:         'Academy Director',
    academy_manager:          'Academy Manager',
    training_program_manager: 'Program Manager',
    trainer:                  'Trainer',
    guest_trainer:            'Guest Trainer',
    partner_trainer:          'Partner Trainer',
    learner:                  'Learner',
    admin:                    'System Admin',
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0a0e1a] border-r border-white/[0.06]">
      {/* Brand */}
      <div className={`flex items-center gap-3 border-b border-white/[0.06] px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
        <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={40} height={40} className="h-9 w-9 shrink-0 rounded-full object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight">EPR Academy</p>
            <p className="text-[10px] text-slate-500 leading-tight">Training & Certification</p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={tour.start}
            title="Take a tour of this portal"
            className="hidden sm:flex ml-auto shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-slate-600 transition hover:bg-white/5 hover:text-slate-400"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tour
          </button>
        )}
        <button
          onClick={toggleCollapse}
          className={`shrink-0 rounded-md p-1 text-slate-600 transition hover:bg-white/5 hover:text-slate-400 ${collapsed ? 'ml-auto' : ''}`}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <Icon d={collapsed ? I.expand : I.collapse} className="h-4 w-4" />
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <span className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">
            {ROLE_LABELS[userRole] ?? userRole}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {NAV.map(renderEntry)}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] p-3">
        {!collapsed ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                {(userName || userEmail || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{userName || 'Academy User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white/5 hover:text-rose-400 disabled:opacity-50"
            >
              <Icon d={I.logout} className="h-3.5 w-3.5 shrink-0" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex w-full items-center justify-center rounded-lg p-2.5 text-slate-600 transition hover:bg-white/5 hover:text-rose-400"
          >
            <Icon d={I.logout} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#060910] text-slate-100">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-[60px]' : 'w-[240px]'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] z-50">{sidebarContent}</aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0a0e1a] px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300"
          >
            <Icon d={I.menu} className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="EPR Compass" width={32} height={32} className="h-7 w-7 shrink-0 rounded-full object-contain" />
            <span className="text-sm font-bold text-white">EPR Academy</span>
          </div>
          <span className="ml-auto text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">
            {ROLE_LABELS[userRole] ?? userRole}
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {tour.isActive && tour.step && tour.isReady && (
        <TourOverlay
          step={tour.step}
          index={tour.index}
          total={tour.total}
          ringClass="border-indigo-500"
          buttonClass="bg-indigo-600 hover:bg-indigo-700"
          dotClass="bg-indigo-500"
          onNext={tour.next}
          onBack={tour.back}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}
