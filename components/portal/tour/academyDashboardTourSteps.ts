import type { TourStep } from '@/components/portal/tour/usePortalTour';

/**
 * Extra deep-dive steps appended after the sidebar walkthrough, highlighting
 * real elements on the Academy portal dashboard (matched via TourTarget ids).
 *
 * The dashboard shown depends on the logged-in user's role (Manager, Program
 * Manager, Trainer, or Partner Trainer) — each variant reuses the same
 * data-tour-id values on its analogous section, so this single array works
 * for whichever one is actually rendered. AcademyShell already skips a step
 * if its target isn't present in the DOM.
 */
const ROUTE = '/academy/dashboard';

export const ACADEMY_DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'dash-setup-guide',
    route: ROUTE,
    title: 'Finish setting up your workspace',
    body: 'This checklist shows what\'s left before you\'re fully set up — reviewing programs, assigning trainers, and more.',
  },
  {
    id: 'dash-summary-cards',
    route: ROUTE,
    title: 'Your key numbers at a glance',
    body: 'Programs, sessions, registrations, and completion rates — updated live so you always know where things stand.',
  },
  {
    id: 'dash-primary-list',
    route: ROUTE,
    title: 'What needs your attention',
    body: 'Your upcoming sessions, programs, or active batch — the main list of work in progress, one click away from full detail.',
  },
  {
    id: 'dash-quick-actions',
    route: ROUTE,
    title: 'Jump straight into common tasks',
    body: 'Shortcuts to the things you\'ll do most often, like marking attendance, issuing certificates, or logging awareness activity.',
  },
];
