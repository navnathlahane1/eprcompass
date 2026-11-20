import type { SetupStep } from './SetupGuideWidget';

// ─── Client Portal (EPR Producer / Importer / Brand Owner) ────────────────────
export function buildClientSetupSteps(data: {
  hasProfile: boolean;
  hasEprCertificates: boolean;
  hasDocuments: boolean;
  hasFilings: boolean;
  hasContacts: boolean;
  hasCredentials: boolean;
  hasDataProfile: boolean;
  hasProducts: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Company Profile',
      description: 'Add your company name, CIN, GSTIN, PAN, registered address, and authorised signatory.',
      href: '/portal/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'credentials',
      label: 'Add EPR Portal Credentials',
      description: 'Store your CPCB / State Board login credentials securely for filing use.',
      href: '/portal/epr-credentials',
      done: data.hasCredentials,
      required: true,
    },
    {
      id: 'certificates',
      label: 'Upload EPR Certificates',
      description: 'Upload your existing EPR registration certificates (Plastic, E-Waste, Battery, Tyre).',
      href: '/portal/certificates',
      done: data.hasEprCertificates,
      required: true,
    },
    {
      id: 'data_profile',
      label: 'Fill Product & Packaging Data',
      description: 'Enter plastic packaging quantities, product categories, import/export volumes, and targets.',
      href: '/portal/data-profile',
      done: data.hasDataProfile,
      required: true,
    },
    {
      id: 'documents',
      label: 'Upload KYC & Compliance Documents',
      description: 'Upload PAN, GST certificate, incorporation certificate, and any board resolutions.',
      href: '/portal/documents',
      done: data.hasDocuments,
    },
    {
      id: 'filings',
      label: 'Review EPR Filing Calendar',
      description: 'Check due dates for quarterly and annual EPR filings and set reminders.',
      href: '/portal/epr-tasks',
      done: data.hasFilings,
    },
    {
      id: 'contacts',
      label: 'Add Team Members',
      description: 'Invite colleagues (finance, compliance, logistics) who need portal access.',
      href: '/portal/contacts',
      done: data.hasContacts,
    },
    {
      id: 'products',
      label: 'Add Product & Import-Export Details',
      description: 'Register product SKUs, packaging types, and import/export data for EPR target calculations.',
      href: '/portal/data-profile?category=products',
      done: data.hasProducts,
    },
  ];
}

// ─── Compliance Manager Portal ─────────────────────────────────────────────────
export function buildManagerSetupSteps(data: {
  hasProfile: boolean;
  hasClients: boolean;
  hasCompletedTask: boolean;
  hasChangedPassword: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Your Manager Profile',
      description: 'Add your full name, designation, contact number, and profile photo.',
      href: '/manager/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'password',
      label: 'Change Default Password',
      description: 'Set a strong, unique password for your manager account.',
      href: '/manager/change-password',
      done: data.hasChangedPassword,
      required: true,
    },
    {
      id: 'clients',
      label: 'Review Assigned Clients',
      description: "Check each client's compliance status, open filings, and pending documents.",
      href: '/manager/clients',
      done: data.hasClients,
      required: true,
    },
    {
      id: 'tasks',
      label: 'Review & Assign EPR Tasks',
      description: 'Open the task manager and assign compliance tasks to your clients.',
      href: '/manager/epr-tasks',
      done: data.hasCompletedTask,
    },
    {
      id: 'filings',
      label: 'Check Filing Deadlines',
      description: 'Review the filing calendar for all assigned clients for the current quarter.',
      href: '/manager/filings',
      done: false,
    },
  ];
}

// ─── Recycler Portal (/recycler) ───────────────────────────────────────────────
export function buildRecyclerSetupSteps(data: {
  hasProfile: boolean;
  hasCpcbCert: boolean;
  hasCapacity: boolean;
  hasWasteCategories: boolean;
  hasDocuments: boolean;
  hasBankDetails: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Recycler Profile',
      description: 'Add company name, contact person, state, city, and registration details.',
      href: '/recycler/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'cpcb_cert',
      label: 'Upload CPCB / State Board Certificate',
      description: 'Upload your valid recycler authorisation certificate with expiry date.',
      href: '/recycler/documents',
      done: data.hasCpcbCert,
      required: true,
    },
    {
      id: 'waste_categories',
      label: 'Set Waste Categories',
      description: 'Specify which waste types you handle: Plastic, E-Waste, Battery, Tyre, Oil.',
      href: '/recycler/profile',
      done: data.hasWasteCategories,
      required: true,
    },
    {
      id: 'capacity',
      label: 'Add Processing Capacity',
      description: 'Enter your annual processing capacity in MT/PA and current utilisation.',
      href: '/recycler/dashboard',
      done: data.hasCapacity,
      required: true,
    },
    {
      id: 'documents',
      label: 'Upload Compliance Documents',
      description: 'Upload ISO certifications, pollution control board NOC, and other permits.',
      href: '/recycler/documents',
      done: data.hasDocuments,
    },
    {
      id: 'bank_details',
      label: 'Add Bank Details for EPR Credit Payments',
      description: 'Provide verified bank account details to receive EPR credit transfer payments.',
      href: '/recycler/profile',
      done: data.hasBankDetails,
    },
  ];
}

// ─── Recycler Portal (/recycler-portal) ───────────────────────────────────────
export function buildRecyclerPortalSetupSteps(data: {
  hasProfile: boolean;
  hasCertificate: boolean;
  hasWasteCategories: boolean;
  hasOnboardingDone: boolean;
  hasDocuments: boolean;
  trainingCompleted?: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Recycler Profile',
      description: 'Add your business name, state, city, contact details, and recycler code.',
      href: '/recycler-portal/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'certificate',
      label: 'Upload Authorisation Certificate',
      description: 'Upload your CPCB/SPCB recycler authorisation certificate to get verified.',
      href: '/recycler-portal/my-documents',
      done: data.hasCertificate,
      required: true,
    },
    {
      id: 'waste_categories',
      label: 'Select Waste Categories',
      description: 'Tell us which waste streams you process so we can match you with relevant tenders.',
      href: '/recycler-portal/profile',
      done: data.hasWasteCategories,
      required: true,
    },
    {
      id: 'documents',
      label: 'Upload Supporting Documents',
      description: 'Upload pollution control NOC, ISO certifications, and any other required permits.',
      href: '/recycler-portal/my-documents',
      done: data.hasDocuments,
    },
    {
      id: 'onboarding',
      label: 'Complete Onboarding Verification',
      description: 'Our team will verify your documents. Track the status in the onboarding section.',
      href: '/recycler-portal/onboarding',
      done: data.hasOnboardingDone,
    },
    {
      id: 'training',
      label: 'Complete Onboarding Training',
      description: 'Finish all portal training modules and pass the quiz to fully activate your account.',
      href: '/recycler-portal/training',
      done: !!data.trainingCompleted,
      required: true,
    },
    {
      id: 'tenders',
      label: 'Browse Available Tenders',
      description: 'Explore live EPR tenders and auctions matched to your waste categories.',
      href: '/recycler-portal/tenders',
      done: false,
    },
  ];
}

// ─── CEPC Consultant Portal (/cepc) ───────────────────────────────────────────
export function buildCepcSetupSteps(data: {
  hasProfile: boolean;
  hasCertificationTier: boolean;
  hasState: boolean;
  hasSubmittedLead: boolean;
  isActive: boolean;
  trainingCompleted?: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Consultant Profile',
      description: 'Add your full name, phone number, state of operation, and bio.',
      href: '/cepc/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'certification',
      label: 'Confirm CEPC Certification Tier',
      description: 'Your certification tier determines the services you can offer. Confirm or upgrade it.',
      href: '/cepc/dashboard',
      done: data.hasCertificationTier,
      required: true,
    },
    {
      id: 'training',
      label: 'Complete Onboarding Training',
      description: 'Finish all training modules and pass the quiz to activate your consultant account.',
      href: '/cepc/training',
      done: !!data.trainingCompleted,
      required: true,
    },
    {
      id: 'region',
      label: 'Set Your Service Region',
      description: 'Specify the states and districts you actively serve for better lead matching.',
      href: '/cepc/profile',
      done: data.hasState,
    },
    {
      id: 'first_lead',
      label: 'Submit Your First Lead',
      description: 'Refer a company for EPR compliance. Every submitted lead earns you commission.',
      href: '/cepc/dashboard',
      done: data.hasSubmittedLead,
    },
    {
      id: 'activation',
      label: 'Get Account Activated',
      description: 'Once documents are verified, our team will activate your CEPC consultant account.',
      href: '/cepc/dashboard',
      done: data.isActive,
    },
  ];
}

// ─── Partner Portal (/partner) ─────────────────────────────────────────────────
export function buildPartnerSetupSteps(data: {
  hasProfile: boolean;
  agreementSigned: boolean;
  trainingCompleted: boolean;
  kitSent: boolean;
  hasSubmittedLead: boolean;
  portalAccessEnabled: boolean;
  ndaSigned?: boolean;
}): SetupStep[] {
  return [
    {
      id: 'nda',
      label: 'Sign Non-Disclosure Agreement (NDA)',
      description: 'NDA must be signed before any program details or client data are shared with you.',
      href: '/partner/profile',
      done: !!data.ndaSigned,
      required: true,
    },
    {
      id: 'profile',
      label: 'Complete Partner Profile',
      description: 'Add your company name, partner type, state, city, and contact details.',
      href: '/partner/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'agreement',
      label: 'Sign Partnership Agreement',
      description: 'Review and sign the EPR Compass partner agreement to activate your account.',
      href: '/partner/dashboard',
      done: data.agreementSigned,
      required: true,
    },
    {
      id: 'training',
      label: 'Complete Onboarding Training',
      description: 'Finish the partner onboarding training modules to start referring clients.',
      href: '/partner/training',
      done: data.trainingCompleted,
      required: true,
    },
    {
      id: 'kit',
      label: 'Receive Partner Kit',
      description: 'Your partner kit (brochures, pitch decks, rate cards) will be dispatched after signing.',
      href: '/partner/dashboard',
      done: data.kitSent,
    },
    {
      id: 'first_lead',
      label: 'Submit First Client Referral',
      description: 'Refer your first client to start earning commission on every conversion.',
      href: '/partner/dashboard',
      done: data.hasSubmittedLead,
    },
    {
      id: 'portal_access',
      label: 'Activate Client Portal Access',
      description: 'Once active, your referred clients can directly use the EPR portal under your account.',
      href: '/partner/dashboard',
      done: data.portalAccessEnabled,
    },
  ];
}

// ─── Academy Portal — role-specific builders ───────────────────────────────────

export function buildAcademyDirectorSetupSteps(data: {
  hasFirstProgram: boolean;
  hasTrainer: boolean;
  hasCalendarEvent: boolean;
}): SetupStep[] {
  return [
    {
      id: 'program',
      label: 'Create Your First Training Program',
      description: 'Set up a program (certification, corporate, awareness) with schedule and capacity.',
      href: '/academy/programs',
      done: data.hasFirstProgram,
      required: true,
    },
    {
      id: 'trainer',
      label: 'Add a Trainer / Faculty Member',
      description: 'Onboard internal trainers or guest faculty and assign them to programs.',
      href: '/academy/trainers',
      done: data.hasTrainer,
      required: true,
    },
    {
      id: 'calendar',
      label: 'Schedule Sessions on the Calendar',
      description: 'Add upcoming session dates so participants can register and trainers are notified.',
      href: '/academy/calendar',
      done: data.hasCalendarEvent,
    },
    {
      id: 'certificates',
      label: 'Configure Certificate Templates',
      description: 'Set up digital certificate templates issued to participants on completion.',
      href: '/academy/certificates',
      done: false,
    },
  ];
}

export function buildAcademyManagerSetupSteps(data: {
  hasReviewedPrograms: boolean;
  hasAssignedTrainer: boolean;
}): SetupStep[] {
  return [
    {
      id: 'review_programs',
      label: 'Review Active Training Programs',
      description: 'Go through all active programs, check enrolment, and confirm session details.',
      href: '/academy/programs',
      done: data.hasReviewedPrograms,
      required: true,
    },
    {
      id: 'assign_trainer',
      label: 'Assign Trainers to Upcoming Sessions',
      description: 'Map trainers to their sessions so schedules are confirmed.',
      href: '/academy/sessions',
      done: data.hasAssignedTrainer,
      required: true,
    },
    {
      id: 'participants',
      label: 'Review Participant Registrations',
      description: 'Confirm participant lists for the next session and send reminders.',
      href: '/academy/participants',
      done: false,
    },
    {
      id: 'reports',
      label: 'Check Training Completion Reports',
      description: 'Review attendance and completion rates across all programs.',
      href: '/academy/reports',
      done: false,
    },
  ];
}

export function buildAcademyTrainerSetupSteps(data: {
  hasProfile: boolean;
  hasUpcomingSession: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Trainer Profile',
      description: 'Add your bio, areas of expertise, certifications, and profile photo.',
      href: '/academy/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'sessions',
      label: 'Review Assigned Sessions',
      description: 'Check your upcoming training sessions, topics, and participant counts.',
      href: '/academy/sessions',
      done: data.hasUpcomingSession,
      required: true,
    },
    {
      id: 'materials',
      label: 'Upload Session Materials',
      description: 'Upload presentations, handouts, and reference material for your sessions.',
      href: '/academy/materials',
      done: false,
    },
    {
      id: 'attendance',
      label: 'Mark Attendance for Past Sessions',
      description: 'Ensure all completed sessions have attendance marked so certificates are issued.',
      href: '/academy/sessions',
      done: false,
    },
  ];
}

export function buildAcademyGuestTrainerSetupSteps(data: {
  hasProfile: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Guest Trainer Profile',
      description: 'Add your name, organisation, expertise, and contact details.',
      href: '/academy/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'session_details',
      label: 'Review Your Assigned Session',
      description: 'Check the session topic, date, time, venue/link, and participant list.',
      href: '/academy/sessions',
      done: false,
      required: true,
    },
    {
      id: 'materials',
      label: 'Upload Your Presentation',
      description: 'Upload your slides or handouts so they are ready before the session.',
      href: '/academy/materials',
      done: false,
    },
  ];
}

export function buildAcademyPartnerTrainerSetupSteps(data: {
  hasProfile: boolean;
  hasOrg: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Partner Trainer Profile',
      description: 'Add your name, partner organisation, expertise, and contact details.',
      href: '/academy/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'org',
      label: 'Verify Partner Organisation',
      description: 'Confirm your partner organisation details are correctly linked to your account.',
      href: '/academy/profile',
      done: data.hasOrg,
      required: true,
    },
    {
      id: 'sessions',
      label: 'Review Assigned Training Sessions',
      description: 'Check sessions assigned to you and confirm availability.',
      href: '/academy/sessions',
      done: false,
    },
  ];
}

// ─── Finance Portal (/finance) ─────────────────────────────────────────────────
export function buildFinanceSetupSteps(data: {
  hasReviewedInvoices: boolean;
  hasProcessedPayment: boolean;
}): SetupStep[] {
  return [
    {
      id: 'invoices',
      label: 'Review Outstanding Invoices',
      description: 'Check all open invoices and identify overdue amounts requiring follow-up.',
      href: '/finance/invoices',
      done: data.hasReviewedInvoices,
      required: true,
    },
    {
      id: 'collections',
      label: 'Review Pending Collections',
      description: 'Go through payments due in the next 7 days and send reminders.',
      href: '/finance/collections',
      done: false,
    },
    {
      id: 'payment',
      label: 'Process First Payment Record',
      description: 'Mark at least one payment as received or reconciled in the system.',
      href: '/finance/invoices',
      done: data.hasProcessedPayment,
    },
    {
      id: 'reports',
      label: 'Review Revenue Dashboard',
      description: 'Familiarise yourself with the MoM billing, collection rate, and DSO metrics.',
      href: '/finance/dashboard',
      done: false,
    },
  ];
}

// ─── IAM / Access Manager Portal (/iam) ───────────────────────────────────────
export function buildIamSetupSteps(data: {
  hasReviewedUsers: boolean;
}): SetupStep[] {
  return [
    {
      id: 'users',
      label: 'Review All Portal Users',
      description: 'Check the user list across all portals and confirm roles are correctly assigned.',
      href: '/iam/users',
      done: data.hasReviewedUsers,
      required: true,
    },
    {
      id: 'roles',
      label: 'Audit Role Permissions',
      description: 'Review each portal role and ensure permissions match current policy.',
      href: '/iam/users',
      done: false,
    },
    {
      id: 'audit_log',
      label: 'Review Recent Audit Log',
      description: 'Check the access audit log for any unusual permission changes or logins.',
      href: '/iam/dashboard',
      done: false,
    },
    {
      id: 'invite',
      label: 'Invite a New Team Member',
      description: 'Use IAM to create the first new portal user or reset an existing password.',
      href: '/iam/users',
      done: false,
    },
  ];
}

// ─── Task Manager Portal (/taskmanager) ───────────────────────────────────────
export function buildTaskManagerSetupSteps(data: {
  hasProfile: boolean;
  hasPendingTasks: boolean;
  hasCompletedTask: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Task Manager Profile',
      description: 'Set your full name, team, and notification preferences.',
      href: '/taskmanager/profile',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'pending_tasks',
      label: 'Review All Pending Tasks',
      description: 'Open the task queue and triage pending tasks by priority and SLA.',
      href: '/taskmanager/tasks',
      done: data.hasPendingTasks,
      required: true,
    },
    {
      id: 'complete_task',
      label: 'Complete Your First Task',
      description: 'Mark at least one task as done to confirm the workflow is working.',
      href: '/taskmanager/tasks',
      done: data.hasCompletedTask,
    },
    {
      id: 'sla',
      label: 'Review SLA & TAT Settings',
      description: 'Check the task turnaround time settings to ensure SLAs are correctly configured.',
      href: '/taskmanager/profile',
      done: false,
    },
  ];
}

// ─── Tendering Portal (/tendering) ─────────────────────────────────────────────
export function buildTenderingSetupSteps(data: {
  hasActiveTenders: boolean;
  hasReviewedDeadlines: boolean;
}): SetupStep[] {
  return [
    {
      id: 'review_tenders',
      label: 'Review Active Tenders',
      description: 'Check all active EPR tenders, their status, bid value, and submission deadlines.',
      href: '/tendering/tenders',
      done: data.hasActiveTenders,
      required: true,
    },
    {
      id: 'deadlines',
      label: 'Review Upcoming Deadlines',
      description: 'Identify tenders closing in the next 7 days and prioritise accordingly.',
      href: '/tendering/tenders',
      done: data.hasReviewedDeadlines,
      required: true,
    },
    {
      id: 'clients',
      label: 'Link Client Profiles to Tenders',
      description: 'Associate each tender with the correct client account for tracking.',
      href: '/tendering/tenders',
      done: false,
    },
    {
      id: 'reports',
      label: 'Review Win/Loss Dashboard',
      description: 'Check the tendering performance metrics: win rate, revenue won, and pipeline.',
      href: '/tendering/dashboard',
      done: false,
    },
  ];
}

// ─── Telecalling Portal (/telecalling) ─────────────────────────────────────────
export function buildTelecallerSetupSteps(data: {
  hasProfile: boolean;
  hasLeads: boolean;
  hasMadeCall: boolean;
  hasFollowup: boolean;
}): SetupStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete Agent Profile',
      description: 'Set your full name, team assignment, and contact details.',
      href: '/telecalling/settings',
      done: data.hasProfile,
      required: true,
    },
    {
      id: 'leads',
      label: 'Review Your Lead List',
      description: 'Check the leads assigned to you for today and this week.',
      href: '/telecalling/leads',
      done: data.hasLeads,
      required: true,
    },
    {
      id: 'first_call',
      label: 'Log Your First Call',
      description: 'Make and log a call in the system with a disposition and notes.',
      href: '/telecalling/calls',
      done: data.hasMadeCall,
    },
    {
      id: 'followup',
      label: 'Schedule a Follow-Up',
      description: 'Set a follow-up reminder for a promising lead.',
      href: '/telecalling/followups',
      done: data.hasFollowup,
    },
    {
      id: 'targets',
      label: 'Check Daily Call Targets',
      description: 'Review your call targets and how you track against the team leaderboard.',
      href: '/telecalling/dashboard',
      done: false,
    },
  ];
}

