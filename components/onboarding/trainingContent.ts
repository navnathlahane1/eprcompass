// All onboarding training content lives here.
// Edit this file to update copy without touching UI components.

export type BadgeColor = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'violet';

export type TrainingSection =
  | { type: 'p';       text: string }
  | { type: 'info';    text: string }
  | { type: 'h';       text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'metrics'; items: { label: string; value: string }[] }
  | { type: 'steps';   items: { n: number; title: string; badge?: string; desc: string }[] }
  | { type: 'badges';  items: { label: string; color: BadgeColor }[] }
  | { type: 'tiers';   items: { num: string; name: string; type: string; hi?: boolean }[] }
  | { type: 'cards';   items: { title: string; tag: string; desc: string }[] }
  | { type: 'levels';  items: { name: string; desc: string; color: string }[] };

export interface ModuleConfig {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  heading: string;
  sections: TrainingSection[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface PortalTrainingConfig {
  portalLabel: string;
  accent: 'indigo' | 'violet' | 'teal' | 'rose';
  completionApiUrl: string;
  storageKey: string;
  modules: ModuleConfig[];
  quiz: QuizQuestion[];
}

// ─── PARTNER PORTAL ───────────────────────────────────────────────────────────

export const PARTNER_TRAINING: PortalTrainingConfig = {
  portalLabel: 'Partner Portal',
  accent: 'indigo',
  completionApiUrl: '/api/partner/training/onboarding',
  storageKey: 'partner-onboarding-v1',
  modules: [
    {
      id: 'intro',
      title: 'What is EPR & your role',
      subtitle: '2 min read',
      tag: 'Introduction',
      heading: 'Welcome to EPR Compass — your role as a partner',
      sections: [
        { type: 'p', text: 'EPR (Extended Producer Responsibility) is a government mandate requiring all companies that import or sell products with plastic packaging, e-waste, batteries, or tyres to register with CPCB and file annual compliance reports. Non-compliant companies face heavy fines.' },
        { type: 'p', text: 'As a Channel Partner, your role is simple: refer businesses who need EPR compliance to EPR Compass — and earn a commission on every client that converts. You don\'t need to be an EPR expert. Just identify businesses who need compliance and connect them to the team.' },
        { type: 'info', text: 'You earn commission (Revenue Share — 20%) every time a business you referred signs up and pays for EPR services. The more clients you refer, the higher your partner tier and commission rate.' },
        { type: 'h', text: 'Your 5 partner tiers:' },
        { type: 'tiers', items: [
          { num: 'Tier 1', name: 'Direct Sales Power', type: 'EHS, CA/CS, ISO, ESG Consultants', hi: true },
          { num: 'Tier 2', name: 'Trusted Advisors', type: 'Regulators, Lawyers, Supply Chain, CSR' },
          { num: 'Tier 3', name: 'Networked Influencers', type: 'Alumni, NGOs, Industry Bodies' },
          { num: 'Tier 4', name: 'Regional Specialists', type: 'City/Cluster-specific operators' },
          { num: 'Tier 5', name: 'Emerging / Digital', type: 'Tech, Academia, Freelancers' },
        ]},
        { type: 'bullets', items: [
          'Tier 1 partners (EHS, CA/CS, ISO consultants) have the highest revenue potential.',
          'Tier 2 (lawyers, supply chain, CSR) have high influence and medium-high reach.',
          'Your tier is shown in My Profile under "Outreach Tier".',
        ]},
      ],
    },
    {
      id: 'dashboard',
      title: 'Dashboard & account setup',
      subtitle: '3 min read',
      tag: 'Getting started',
      heading: 'Dashboard & 7-step account setup',
      sections: [
        { type: 'p', text: 'When you log in, you land on your Dashboard. At the top you see 4 live metrics. Below that is the Account Setup checklist — a 7-step process you must complete to fully activate your account.' },
        { type: 'h', text: '4 dashboard metrics:' },
        { type: 'metrics', items: [
          { label: 'Active clients', value: 'Clients referred through you' },
          { label: 'Open leads', value: 'Referrals currently in pipeline' },
          { label: 'Pending payout', value: 'Commission awaiting payment' },
          { label: 'Open tasks', value: 'Actions needing your attention' },
        ]},
        { type: 'h', text: 'Partner Readiness milestones (must all be green):' },
        { type: 'badges', items: [
          { label: 'Agreement Signed', color: 'gray' },
          { label: 'Welcome Kit Sent', color: 'gray' },
          { label: 'Training Completed', color: 'gray' },
          { label: 'Portal Access Granted', color: 'gray' },
        ]},
        { type: 'h', text: 'Your 7 account setup steps:' },
        { type: 'steps', items: [
          { n: 1, title: 'Sign NDA', badge: 'Required', desc: 'Must be signed before any program details or client data are shared with you.' },
          { n: 2, title: 'Complete partner profile', desc: 'Add company name, partner type, state, city, and contact details.' },
          { n: 3, title: 'Sign partnership agreement', badge: 'Required', desc: 'Review and sign the EPR Compass partner agreement to activate your account.' },
          { n: 4, title: 'Complete onboarding training', badge: 'Required', desc: 'Finish all modules in this training to mark this step complete.' },
          { n: 5, title: 'Receive partner kit', desc: 'Brochures, pitch decks, and rate cards dispatched after signing.' },
          { n: 6, title: 'Submit first client referral', desc: 'Refer your first client to start earning commission on every conversion.' },
          { n: 7, title: 'Activate client portal access', desc: 'Once active, your referred clients can directly use the EPR portal under your account.' },
        ]},
        { type: 'info', text: 'Steps 1 (NDA), 3 (Partnership Agreement), and 4 (Training) are marked Required — your account will not be fully active until all three are completed.' },
      ],
    },
    {
      id: 'leads',
      title: 'My leads — submitting referrals',
      subtitle: '3 min read',
      tag: 'Core task',
      heading: 'My leads — how to submit & track referrals',
      sections: [
        { type: 'p', text: 'My Leads is your most important daily screen. Every business you refer to EPR Compass starts here as a lead. You add them, and the EPR Compass team contacts them and converts them into paying clients.' },
        { type: 'info', text: 'To submit a lead: click + Add Lead at the top right of My Leads. Fill in company name, contact person name, and phone number. That\'s it — the team does the rest.' },
        { type: 'h', text: '4 lead metrics on your screen:' },
        { type: 'metrics', items: [
          { label: 'Total', value: 'All referrals ever submitted' },
          { label: 'Active', value: 'Being processed by the team' },
          { label: 'Converted', value: 'Became a paying client' },
          { label: 'Conv. rate', value: 'Converted ÷ Total leads' },
        ]},
        { type: 'h', text: 'Lead stages (filter by these):' },
        { type: 'badges', items: [
          { label: 'All stages', color: 'gray' },
          { label: 'In pipeline', color: 'amber' },
          { label: 'Converted', color: 'green' },
        ]},
        { type: 'h', text: 'Best practices:' },
        { type: 'bullets', items: [
          'Always include the direct contact person\'s name and number — leads without a contact take much longer to convert.',
          'Search for the company before adding to avoid duplicate leads in the system.',
          'Use the "All Stages" filter dropdown to see only active or converted leads.',
          'Once a lead converts, they appear in My Clients and your commission is updated in Commissions.',
          'Check My Leads daily — your conversion rate is visible and tracked by your relationship manager.',
        ]},
      ],
    },
    {
      id: 'clients',
      title: 'My clients & client filings',
      subtitle: '2 min read',
      tag: 'Tracking',
      heading: 'My clients & client filings',
      sections: [
        { type: 'p', text: 'Once a lead is converted and onboarded by the EPR Compass team, they appear in My Clients. You can then track their EPR filing status through Client Filings.' },
        { type: 'h', text: 'My clients — 3 metrics:' },
        { type: 'metrics', items: [
          { label: 'Total clients', value: 'All referred clients' },
          { label: 'Active', value: 'Currently being serviced' },
          { label: 'Renewing ≤ 60d', value: 'Contracts expiring soon' },
        ]},
        { type: 'h', text: 'Client filing statuses:' },
        { type: 'badges', items: [
          { label: 'Overdue', color: 'red' },
          { label: 'In progress', color: 'amber' },
          { label: 'Completed', color: 'green' },
        ]},
        { type: 'info', text: 'Compliance Health Centre (in the sidebar) gives you a quick view across all clients: green = Compliant, amber = Needs Attention, red = Overdue. If any client is red, contact your relationship manager immediately.' },
        { type: 'h', text: 'What to do:' },
        { type: 'bullets', items: [
          'Check Client Filings weekly — if a filing is Overdue, inform your RM immediately.',
          'Clients showing "Renewing ≤ 60d" are renewal opportunities — reach out to confirm they want to continue for another year.',
          'Your renewal commission depends on your commission structure shown in My Profile.',
          'Filing data appears only once clients have active EPR services — new clients may take a few days to show up.',
        ]},
      ],
    },
    {
      id: 'commissions',
      title: 'Commissions & earnings',
      subtitle: '2 min read',
      tag: 'Earnings',
      heading: 'Commissions & how you earn',
      sections: [
        { type: 'p', text: 'Every time a client you referred signs up and pays for EPR services, you earn a commission. Your current structure is Revenue Share — 20%, shown in My Profile under Partnership Details.' },
        { type: 'h', text: 'Earnings summary:' },
        { type: 'metrics', items: [
          { label: 'Total earned', value: 'All commissions to date' },
          { label: 'Pending payout', value: 'Earned but not yet paid' },
          { label: 'Commission type', value: 'Revenue Share — 20%' },
          { label: 'Conversion rate', value: 'Converted ÷ Total leads' },
        ]},
        { type: 'h', text: 'Partner performance levels:' },
        { type: 'levels', items: [
          { name: 'Silver Partner', desc: 'Current level. 11 more clients to reach Gold.', color: '#6B7280' },
          { name: 'Gold Partner', desc: 'Higher commission rates + priority RM support.', color: '#D97706' },
          { name: 'Platinum Partner', desc: 'Top tier — highest commissions + dedicated account manager.', color: '#7C3AED' },
        ]},
        { type: 'info', text: 'If the Commissions page shows "Partner profile not linked — contact support", submit a request through Help. Do not wait — unlinked profiles do not track commissions correctly.' },
        { type: 'bullets', items: [
          'Click "View commission history" in the Earnings Summary to see a full payout log.',
          'Commissions are paid out on a schedule set by your relationship manager.',
          'The higher your conversion rate, the faster you move up partner tiers.',
        ]},
      ],
    },
    {
      id: 'tools',
      title: 'Documents, calendar & referrals',
      subtitle: '2 min read',
      tag: 'Resources',
      heading: 'Documents, calendar & referrals',
      sections: [
        { type: 'h', text: 'Documents — your sales toolkit:' },
        { type: 'cards', items: [
          { title: 'Partner Agreement FY 2025-26', tag: 'Agreement', desc: 'Your signed agreement with EPR Compass.' },
          { title: 'EPR Compliance Overview — Plastic', tag: 'Guide', desc: 'Summary of EPR obligations — use this to explain EPR to clients.' },
          { title: 'Co-Branded Pitch Deck', tag: 'Marketing', desc: 'Present this in meetings with prospects to explain EPR solutions.' },
          { title: 'Commission Structure & Tiers', tag: 'Policy', desc: 'Full breakdown of how commissions work at each partner level.' },
          { title: 'Client Onboarding Checklist', tag: 'Template', desc: 'Hand this to new clients after they sign up.' },
          { title: 'CPCB Registration Process Flow', tag: 'Guide', desc: 'Explains the CPCB registration steps to share with clients.' },
        ]},
        { type: 'h', text: 'Deadline calendar:' },
        { type: 'p', text: 'The Calendar shows EPR filing deadlines for all your clients — colour-coded:' },
        { type: 'badges', items: [
          { label: 'Red — Overdue', color: 'red' },
          { label: 'Amber — Due within 7 days', color: 'amber' },
          { label: 'Blue — Upcoming', color: 'blue' },
        ]},
        { type: 'h', text: 'Referral link generator:' },
        { type: 'info', text: 'Go to Referrals in the sidebar and click Request Referral Link. Share this unique link with prospects. Any client who signs up through your link is automatically tracked to your account — commission is credited automatically.' },
        { type: 'bullets', items: [
          'Check the calendar every Monday for the week ahead.',
          'Share your referral link in WhatsApp, email, LinkedIn — anywhere your prospects are.',
          'Use the Co-Branded Pitch Deck from Documents in every client meeting.',
        ]},
      ],
    },
  ],
  quiz: [
    {
      question: 'What is the very first step you must complete in your account setup before anything else?',
      options: ['Submit your first client referral', 'Sign the NDA (Non-Disclosure Agreement)', 'Complete onboarding training', 'Request your referral link'],
      correct: 1,
      explanation: 'The NDA must be signed before any program details or client data are shared with you. It is marked as Required and is Step 1.',
    },
    {
      question: 'Where do you go in the portal to submit a new business referral?',
      options: ['My Clients — then click Add Client', 'Documents — download the referral form', 'My Leads — click + Add Lead', 'Referrals — click Request Referral Link'],
      correct: 2,
      explanation: 'Go to My Leads in the sidebar and click + Add Lead. Fill in the company name, contact person, and phone number.',
    },
    {
      question: 'What does "Pending Payout" mean on your dashboard?',
      options: ['Clients who haven\'t paid EPR Compass yet', 'Commission you have earned but not yet received', 'Leads that are still being processed by the team', 'Documents that need your signature'],
      correct: 1,
      explanation: 'Pending Payout is commission you have already earned from converted clients that is awaiting payment processing by EPR Compass.',
    },
    {
      question: 'What colour does the Compliance Health Centre show for a client who is overdue on their EPR filing?',
      options: ['Green — Compliant', 'Blue — In Progress', 'Amber — Needs Attention', 'Red — Overdue'],
      correct: 3,
      explanation: 'Red means Overdue. Amber means Needs Attention. Green means Compliant. Alert your relationship manager immediately if any client turns red.',
    },
    {
      question: 'How do you get your unique referral link to share with prospects?',
      options: ['It is automatically generated when you sign the NDA', 'Go to Referrals and click Request Referral Link', 'Download it from the Documents section', 'Your relationship manager emails it to you after training'],
      correct: 1,
      explanation: 'Go to Referrals in the sidebar and click the Request Referral Link button. Any client who signs up through your link is automatically tracked to your account.',
    },
  ],
};

// ─── CEPC PORTAL ──────────────────────────────────────────────────────────────

export const CEPC_TRAINING: PortalTrainingConfig = {
  portalLabel: 'CEPC Portal',
  accent: 'violet',
  completionApiUrl: '/api/cepc/training',
  storageKey: 'cepc-onboarding-v1',
  modules: [
    {
      id: 'intro',
      title: 'What is CEPC & your role',
      subtitle: '2 min read',
      tag: 'Introduction',
      heading: 'Welcome — your role as a CEPC Consultant',
      sections: [
        { type: 'p', text: 'CEPC (Certified EPR Partner Consultant) is EPR Compass\'s expert consultant programme. As a CEPC, your role is to identify businesses that need EPR compliance support, refer them to EPR Compass, and provide advisory support through your expertise.' },
        { type: 'p', text: 'Unlike a Channel Partner who only refers, a CEPC can also deliver compliance advisory services to clients — earning both referral commission and consulting fees.' },
        { type: 'info', text: 'You earn Revenue Share — 20% on every client that converts through your referral. Higher certification tiers unlock higher commission rates and exclusive client assignments.' },
        { type: 'h', text: 'Your 3 certification tiers:' },
        { type: 'tiers', items: [
          { num: 'Bootcamp', name: 'Entry Level', type: 'New consultants, basic EPR awareness', hi: true },
          { num: 'Associate', name: 'Intermediate', type: 'Completed CEPC training + 3 conversions' },
          { num: 'Expert', name: 'Advanced', type: 'Full certification + 10+ active clients' },
        ]},
        { type: 'bullets', items: [
          'Your certification tier is shown in your profile and on the leaderboard.',
          'Bootcamp → Associate upgrade happens automatically when you hit the conversion threshold.',
          'Expert tier requires certification assessment — your RM will guide you.',
        ]},
      ],
    },
    {
      id: 'dashboard',
      title: 'Dashboard & account setup',
      subtitle: '3 min read',
      tag: 'Getting started',
      heading: 'Dashboard & 5-step account setup',
      sections: [
        { type: 'p', text: 'When you log in, your Dashboard shows live performance metrics and an Account Setup checklist. Complete all required steps to fully activate your CEPC consultant account.' },
        { type: 'h', text: '4 dashboard metrics:' },
        { type: 'metrics', items: [
          { label: 'Referred leads', value: 'Total leads you have submitted' },
          { label: 'Converted', value: 'Leads that became paying clients' },
          { label: 'Pending payout', value: 'Commission awaiting payment' },
          { label: 'Commission earned', value: 'Total paid commissions to date' },
        ]},
        { type: 'h', text: 'Your 5 account setup steps:' },
        { type: 'steps', items: [
          { n: 1, title: 'Complete Consultant Profile', badge: 'Required', desc: 'Add your full name, phone number, state of operation, and bio.' },
          { n: 2, title: 'Confirm CEPC Certification Tier', badge: 'Required', desc: 'Your certification tier determines the services you can offer. Confirm or upgrade it.' },
          { n: 3, title: 'Set Your Service Region', desc: 'Specify the states and districts you actively serve for better lead matching.' },
          { n: 4, title: 'Submit Your First Lead', desc: 'Refer a company for EPR compliance. Every submitted lead earns you commission.' },
          { n: 5, title: 'Get Account Activated', desc: 'Once documents are verified, our team will activate your CEPC consultant account.' },
        ]},
        { type: 'info', text: 'Steps 1 (Profile) and 2 (Certification Tier) are Required. Your account won\'t be active until these and your onboarding training are complete.' },
      ],
    },
    {
      id: 'courses',
      title: 'My courses & certifications',
      subtitle: '2 min read',
      tag: 'Training',
      heading: 'My courses — training & certification',
      sections: [
        { type: 'p', text: 'My Courses shows all training programmes assigned to you by the EPR Compass academy team. Completing these courses builds your EPR expertise and earns you certification credits toward tier upgrades.' },
        { type: 'info', text: 'Go to My Courses in the sidebar to view all assigned training. Click "Start Module" on any course to begin. Your progress is tracked automatically.' },
        { type: 'h', text: 'Course delivery modes:' },
        { type: 'badges', items: [
          { label: 'Online Live', color: 'blue' },
          { label: 'Self-Paced', color: 'green' },
          { label: 'Recorded', color: 'violet' },
          { label: 'Classroom', color: 'gray' },
        ]},
        { type: 'h', text: 'My Certificates:' },
        { type: 'p', text: 'Completed courses generate digital certificates available in My Certificates. These are verifiable and can be shared with prospects to demonstrate your EPR expertise.' },
        { type: 'bullets', items: [
          'Check My Courses weekly for newly assigned training from your manager.',
          'Completing Bootcamp courses is required before you can refer clients independently.',
          'Your certification expiry date is shown in My Profile — renew before it lapses.',
          'Live sessions require prior registration — join the meeting link shown on the course card.',
        ]},
      ],
    },
    {
      id: 'leads',
      title: 'Referred leads & commissions',
      subtitle: '3 min read',
      tag: 'Core task',
      heading: 'Referring leads — your primary earning activity',
      sections: [
        { type: 'p', text: 'Every business you refer to EPR Compass becomes a lead in the system. The EPR Compass team handles conversion — you earn commission when they pay for services.' },
        { type: 'info', text: 'To refer a lead: go to Referred Leads in the sidebar and click + Add Lead. Enter the company name, contact person, phone, state, and the EPR services they need.' },
        { type: 'h', text: 'Lead stages:' },
        { type: 'badges', items: [
          { label: 'Submitted', color: 'gray' },
          { label: 'In Review', color: 'blue' },
          { label: 'Converted', color: 'green' },
          { label: 'Lost', color: 'red' },
        ]},
        { type: 'h', text: 'Commission structure:' },
        { type: 'metrics', items: [
          { label: 'Revenue share', value: '20% of first-year service fee' },
          { label: 'Paid when', value: 'Client pays EPR Compass' },
          { label: 'View earnings', value: 'My Commissions in sidebar' },
          { label: 'Payout schedule', value: 'Monthly — set by your RM' },
        ]},
        { type: 'bullets', items: [
          'Include the decision-maker\'s direct number — leads with a named contact convert 3× faster.',
          'Specify the waste category (Plastic, E-Waste, Battery, Tyre) to speed up team review.',
          'Track lead stage in Referred Leads — reach out to your RM if a lead is stuck in "In Review" for more than 5 days.',
          'Your conversion rate is visible on the Leaderboard — a high rate unlocks better tier benefits.',
        ]},
      ],
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard & performance',
      subtitle: '2 min read',
      tag: 'Performance',
      heading: 'Leaderboard — track & grow your ranking',
      sections: [
        { type: 'p', text: 'The Leaderboard ranks all CEPC consultants by conversion rate, total clients, and commissions earned. A higher rank unlocks faster tier upgrades, priority lead matching, and RM support.' },
        { type: 'h', text: 'Leaderboard metrics tracked:' },
        { type: 'metrics', items: [
          { label: 'Total leads', value: 'All referrals you have submitted' },
          { label: 'Converted', value: 'Leads that became paying clients' },
          { label: 'Conversion rate', value: 'Converted ÷ Total × 100%' },
          { label: 'Commission earned', value: 'Total revenue share paid' },
        ]},
        { type: 'h', text: 'Tier progression:' },
        { type: 'levels', items: [
          { name: 'Bootcamp', desc: 'Starting tier. Focus on completing courses and submitting your first 3 leads.', color: '#6B7280' },
          { name: 'Associate', desc: '3+ conversions unlocks this tier. Higher commission rate + co-branded materials.', color: '#7C3AED' },
          { name: 'Expert', desc: '10+ active clients + certification assessment. Highest commissions + dedicated RM.', color: '#D97706' },
        ]},
        { type: 'info', text: 'Check the Leaderboard monthly to see your rank vs. other consultants in your state. Use it as a motivational benchmark — the top 10% get exclusive EPR Compass promotions and bonus incentives.' },
      ],
    },
    {
      id: 'tools',
      title: 'Documents & tools',
      subtitle: '2 min read',
      tag: 'Resources',
      heading: 'Documents, announcements & support',
      sections: [
        { type: 'h', text: 'My Documents — your resource library:' },
        { type: 'cards', items: [
          { title: 'CEPC Agreement FY 2025-26', tag: 'Agreement', desc: 'Your signed consultant agreement with EPR Compass.' },
          { title: 'EPR Compliance Overview', tag: 'Guide', desc: 'Use this to explain EPR obligations to prospects during meetings.' },
          { title: 'CEPC Pitch Deck', tag: 'Marketing', desc: 'Co-branded presentation for client meetings.' },
          { title: 'Commission Structure', tag: 'Policy', desc: 'Full breakdown of how commissions work at each certification tier.' },
          { title: 'CPCB Registration Flow', tag: 'Guide', desc: 'Step-by-step CPCB process to share with interested clients.' },
        ]},
        { type: 'h', text: 'Announcements:' },
        { type: 'p', text: 'Check Announcements regularly for new EPR regulation updates, commission structure changes, and programme news from the EPR Compass team. Important updates are also sent by email and WhatsApp.' },
        { type: 'h', text: 'Help & support:' },
        { type: 'bullets', items: [
          'For portal issues, go to Help in the sidebar — most answers are in the FAQ section.',
          'For commission disputes, submit a request through Help and include your CEPC ID.',
          'For lead follow-up status, message your assigned Relationship Manager directly.',
          'For tier upgrade queries, use the Help section or speak to your RM.',
        ]},
      ],
    },
  ],
  quiz: [
    {
      question: 'What is your primary earning activity as a CEPC consultant?',
      options: ['Filing EPR returns for clients directly', 'Referring businesses that need EPR compliance to EPR Compass', 'Managing the EPR Compass admin portal', 'Downloading CPCB certificates on behalf of clients'],
      correct: 1,
      explanation: 'Your primary role is to refer businesses to EPR Compass. The team handles conversion — you earn 20% revenue share when the referred client pays for services.',
    },
    {
      question: 'Where do you go to submit a new client referral?',
      options: ['My Courses — click Add Client', 'My Certificates — download the referral form', 'Referred Leads — click + Add Lead', 'My Commissions — raise a new commission entry'],
      correct: 2,
      explanation: 'Go to Referred Leads in the sidebar and click + Add Lead. Fill in company name, contact person, phone, state, and services needed.',
    },
    {
      question: 'Which of the following automatically upgrades your tier from Bootcamp to Associate?',
      options: ['Completing all courses in My Courses', 'Reaching 3 converted clients through your referrals', 'Signing the CEPC agreement', 'Having an active referral link for 30 days'],
      correct: 1,
      explanation: 'The tier upgrade from Bootcamp to Associate is triggered automatically when you hit 3 converted clients. Higher tiers (Expert) require a certification assessment.',
    },
    {
      question: 'Where can you find the co-branded pitch deck to use in client meetings?',
      options: ['My Courses', 'My Documents → Shared with Me', 'Leaderboard → Resources tab', 'Referred Leads → Download pitch'],
      correct: 1,
      explanation: 'Go to My Documents in the sidebar. The Co-Branded Pitch Deck is in the Shared with Me section — uploaded by the EPR Compass team for your use.',
    },
    {
      question: 'What does "Pending Payout" mean on your dashboard?',
      options: ['Leads waiting to be reviewed by the team', 'Commission you have earned but have not yet received', 'Courses you have not yet started', 'Clients whose contract is expiring soon'],
      correct: 1,
      explanation: 'Pending Payout is commission you have already earned (from converted clients who have paid) that is awaiting payment processing on the next payout cycle.',
    },
  ],
};

// ─── RECYCLER PORTAL ──────────────────────────────────────────────────────────

export const RECYCLER_TRAINING: PortalTrainingConfig = {
  portalLabel: 'Recycler Portal',
  accent: 'teal',
  completionApiUrl: '/api/recycler-portal/training',
  storageKey: 'recycler-onboarding-v1',
  modules: [
    {
      id: 'intro',
      title: 'EPR & your role as a recycler',
      subtitle: '2 min read',
      tag: 'Introduction',
      heading: 'Welcome — your role in the EPR value chain',
      sections: [
        { type: 'p', text: 'EPR (Extended Producer Responsibility) requires companies that manufacture or import products with plastic packaging, e-waste, batteries, or tyres to ensure those materials are collected and recycled. Recyclers are the backbone of this system.' },
        { type: 'p', text: 'As a registered recycler on EPR Compass, you process waste and generate EPR credits that producers need to meet their compliance targets. You earn income by selling EPR credits and by winning tenders from producers who need waste processing.' },
        { type: 'info', text: 'Every tonne of waste you process and report generates EPR credits. You can sell these credits directly to producers on our platform, or trade them on the EPR credit marketplace for the best price.' },
        { type: 'h', text: 'Your waste categories determine your opportunities:' },
        { type: 'badges', items: [
          { label: 'Plastic Waste', color: 'blue' },
          { label: 'E-Waste', color: 'violet' },
          { label: 'Battery Waste', color: 'amber' },
          { label: 'Tyre Waste', color: 'gray' },
          { label: 'Oil Waste', color: 'green' },
        ]},
        { type: 'bullets', items: [
          'Your waste categories are set in My Profile — update them if you start processing new waste types.',
          'Tender matching is based on your waste categories and authorised states.',
          'EPR credit value varies by waste category — Plastic and E-Waste tend to have the highest demand.',
        ]},
      ],
    },
    {
      id: 'dashboard',
      title: 'Dashboard & account verification',
      subtitle: '3 min read',
      tag: 'Getting started',
      heading: 'Dashboard & account verification',
      sections: [
        { type: 'p', text: 'Your dashboard shows live summaries of tender matches, auctions, CPCB alerts, and pending requests. At the top is your Account Setup checklist — complete it to get verified and unlock all portal features.' },
        { type: 'h', text: '4 dashboard summary cards:' },
        { type: 'metrics', items: [
          { label: 'New Tender Matches', value: 'Tenders matched to your waste categories' },
          { label: 'Live Auctions', value: 'Ongoing auctions you can bid on' },
          { label: 'Unread CPCB Alerts', value: 'Compliance notifications requiring attention' },
          { label: 'Pending Requests', value: 'Corporate requests awaiting your response' },
        ]},
        { type: 'h', text: 'Verification status:' },
        { type: 'badges', items: [
          { label: 'PENDING — Documents being reviewed', color: 'gray' },
          { label: 'VERIFIED — Eligible to bid & trade', color: 'green' },
        ]},
        { type: 'h', text: 'Your account setup steps:' },
        { type: 'steps', items: [
          { n: 1, title: 'Complete Recycler Profile', badge: 'Required', desc: 'Add business name, state, city, contact details, and recycler code.' },
          { n: 2, title: 'Upload Authorisation Certificate', badge: 'Required', desc: 'Upload your CPCB/SPCB recycler authorisation certificate.' },
          { n: 3, title: 'Select Waste Categories', badge: 'Required', desc: 'Tell us which waste streams you process.' },
          { n: 4, title: 'Upload Supporting Documents', desc: 'Pollution control NOC, ISO certifications, and other required permits.' },
          { n: 5, title: 'Complete Onboarding Verification', desc: 'Our team verifies your documents. Track status in Onboarding.' },
          { n: 6, title: 'Complete Onboarding Training', desc: 'Finish this training to mark your account as fully onboarded.' },
        ]},
      ],
    },
    {
      id: 'tenders',
      title: 'Tenders & auctions',
      subtitle: '3 min read',
      tag: 'Core activity',
      heading: 'Tenders & live auctions — how to win business',
      sections: [
        { type: 'p', text: 'Tenders and auctions are how producers find recyclers to process their waste. You receive automatic alerts when a new tender or auction matches your waste categories and authorised states.' },
        { type: 'h', text: 'Tender Alerts:' },
        { type: 'info', text: 'Go to Tender Alerts in the sidebar to see all tenders matched to your profile. Click on any tender to view the full requirements, volume, price, and submission deadline.' },
        { type: 'h', text: 'Live Auctions:' },
        { type: 'p', text: 'Auctions are real-time competitive bidding events. Once an auction opens, you have a fixed window to submit your best price. The lowest qualified bid wins.' },
        { type: 'h', text: 'Auction types:' },
        { type: 'badges', items: [
          { label: 'Reverse Auction — lowest bid wins', color: 'blue' },
          { label: 'Forward Auction — highest bid wins', color: 'green' },
        ]},
        { type: 'h', text: 'Corporate Requests:' },
        { type: 'p', text: 'Producers can send direct processing requests to your recycler profile. These appear in Corporate Requests and include the waste type, volume, location, and target price.' },
        { type: 'bullets', items: [
          'Set your waste categories and authorised states accurately in My Profile — this determines which tenders you receive.',
          'Respond to corporate requests within 48 hours — delayed responses are marked as "no response" in your reputation score.',
          'Before bidding, confirm you have the capacity to process the stated volume within the timeline.',
          'Contracts from won tenders appear in Contracts — review them carefully before signing.',
        ]},
      ],
    },
    {
      id: 'credits',
      title: 'EPR credits & tonnage reporting',
      subtitle: '3 min read',
      tag: 'Revenue',
      heading: 'EPR credits — your primary revenue stream',
      sections: [
        { type: 'p', text: 'Every tonne of waste you process generates EPR credits (also called Extended Producer Responsibility certificates). These credits are bought by producers to prove they met their EPR targets, and you earn income by selling them.' },
        { type: 'info', text: 'To claim EPR credits: go to Tonnage Reporting and log the waste you have processed. Once verified, credits are issued to your account in EPR Credits & Trading, where you can sell them at market price.' },
        { type: 'h', text: 'Credit lifecycle:' },
        { type: 'steps', items: [
          { n: 1, title: 'Log tonnage', desc: 'Record processed waste in Tonnage Reporting — include the waste type and documentary evidence.' },
          { n: 2, title: 'Verification', desc: 'EPR Compass verifies the tonnage against your authorisation certificate capacity.' },
          { n: 3, title: 'Credits issued', desc: 'Verified tonnes generate credits in your EPR Credits & Trading account.' },
          { n: 4, title: 'Trade or sell', desc: 'List credits for sale on the marketplace or accept direct purchase requests.' },
        ]},
        { type: 'h', text: 'Credit financing:' },
        { type: 'p', text: 'Credit Financing (in the sidebar) lets you access advance payments against verified but unsold credits — useful for working capital while credits are being traded.' },
        { type: 'bullets', items: [
          'Log tonnage at least monthly — delayed reporting delays credit issuance.',
          'Upload all supporting evidence (weighbridge receipts, GRNs) when logging tonnage.',
          'Check Price Intelligence for real-time credit prices before selling.',
          'Credits expire if not sold within the compliance year — sell or use them before March 31.',
        ]},
      ],
    },
    {
      id: 'compliance',
      title: 'Compliance & certificates',
      subtitle: '2 min read',
      tag: 'Compliance',
      heading: 'Compliance, CPCB & certificate renewal',
      sections: [
        { type: 'p', text: 'As a recycler, staying compliant with CPCB and State Pollution Control Board (SPCB) requirements is essential to keep your authorisation active. The portal actively monitors your compliance status.' },
        { type: 'h', text: 'CPCB Alerts:' },
        { type: 'info', text: 'Go to CPCB Alerts in the sidebar to see all compliance notifications. Respond to alerts within the stated deadline — unresolved alerts can trigger authorisation suspension.' },
        { type: 'h', text: 'Certificate renewal:' },
        { type: 'p', text: 'Cert Renewal in the sidebar shows your authorisation certificate expiry date and sends reminders at 90, 60, and 30 days before expiry. Start the renewal process at least 60 days before expiry.' },
        { type: 'h', text: 'CPCB Returns:' },
        { type: 'p', text: 'Annual CPCB returns are mandatory. The portal tracks your return filing status and provides document templates. Go to CPCB Returns to submit your annual compliance report.' },
        { type: 'badges', items: [
          { label: 'Compliant', color: 'green' },
          { label: 'Action Required', color: 'amber' },
          { label: 'Overdue', color: 'red' },
        ]},
        { type: 'bullets', items: [
          'Check CPCB Alerts every Monday — new alerts can appear at any time.',
          'A red "Overdue" status on your certificate means you cannot bid on new tenders until resolved.',
          'Your compliance officer\'s contact is shown on your dashboard — call them for urgent compliance issues.',
          'Authorizations (in the sidebar) shows your state-wise operating permits — keep these updated.',
        ]},
      ],
    },
    {
      id: 'tools',
      title: 'Operations & tools',
      subtitle: '2 min read',
      tag: 'Resources',
      heading: 'Operations, documents & support',
      sections: [
        { type: 'h', text: 'Key operational tools:' },
        { type: 'cards', items: [
          { title: 'Collection Network', tag: 'Operations', desc: 'Manage upstream waste collection logistics and sourcing agreements.' },
          { title: 'Traceability Ledger', tag: 'Compliance', desc: 'Track waste from source to processing — required for CPCB audit trails.' },
          { title: 'Capacity Calendar', tag: 'Planning', desc: 'Log available processing capacity for each month so producers can plan with you.' },
          { title: 'Invoices', tag: 'Finance', desc: 'All credit sale invoices and tender payment invoices are generated here.' },
          { title: 'Contracts', tag: 'Legal', desc: 'All signed tender and processing agreements — keep these updated.' },
          { title: 'My Documents', tag: 'Files', desc: 'Your personal file storage — authorisation certs, NOCs, ISO certificates.' },
        ]},
        { type: 'h', text: 'Analytics:' },
        { type: 'p', text: 'Analytics in the sidebar shows your processing volume trends, credit generation rate, revenue breakdown, and auction win rate. Review it monthly to identify growth opportunities.' },
        { type: 'h', text: 'Service Requests:' },
        { type: 'info', text: 'If you have a problem with the portal, a credit dispute, or need operational support, go to Service Requests and submit a ticket. The EPR Compass team responds within 24 business hours.' },
        { type: 'bullets', items: [
          'Update your Capacity Calendar at the start of every month.',
          'Keep authorisation certificates in My Documents up to date — expired docs block tender bidding.',
          'Use Price Intelligence before every credit sale to ensure you are getting market rate.',
          'Check Analytics weekly to monitor your EPR credit generation vs. your annual target.',
        ]},
      ],
    },
  ],
  quiz: [
    {
      question: 'How do you earn EPR credits on the portal?',
      options: ['By winning auctions and paying a deposit', 'By logging processed waste tonnage in Tonnage Reporting and getting it verified', 'By completing all courses in My Courses', 'By uploading your authorisation certificate'],
      correct: 1,
      explanation: 'Credits are earned by logging processed waste in Tonnage Reporting. Once EPR Compass verifies the tonnage against your authorisation, credits are issued to your account for trading.',
    },
    {
      question: 'What does a "red" status on your compliance certificate mean?',
      options: ['Your certificate has been renewed and is active', 'Your certificate is overdue and you cannot bid on new tenders until resolved', 'A new CPCB alert has been assigned to you', 'Your capacity calendar is empty'],
      correct: 1,
      explanation: 'Red means Overdue. An overdue authorisation certificate blocks tender bidding and credit issuance until the renewal is completed. Start renewals at least 60 days before expiry.',
    },
    {
      question: 'Where do you go to respond to a producer who wants you to process their waste directly?',
      options: ['Tender Alerts — submit a bid', 'CPCB Alerts — reply to the alert', 'Corporate Requests — view and respond to the request', 'Buyer Network — message the producer'],
      correct: 2,
      explanation: 'Corporate Requests shows direct processing requests from producers. Click on a request to see details and respond within 48 hours — delays hurt your reputation score.',
    },
    {
      question: 'What should you do before selling EPR credits on the marketplace?',
      options: ['File your CPCB annual return first', 'Check Price Intelligence to see current market credit prices', 'Complete the Capacity Calendar for the current month', 'Upload the tonnage report to CPCB directly'],
      correct: 1,
      explanation: 'Always check Price Intelligence before selling. It shows real-time credit prices by waste category, so you can make an informed decision and get the best rate.',
    },
    {
      question: 'How often should you log tonnage in the Tonnage Reporting module?',
      options: ['Once a year, before March 31', 'At least monthly — delayed reporting delays credit issuance', 'Only when you win a tender', 'When your compliance officer asks you to'],
      correct: 1,
      explanation: 'Log tonnage at least monthly. Delayed reporting delays credit issuance, which delays your ability to trade credits. Upload all supporting evidence (weighbridge receipts, GRNs) when logging.',
    },
  ],
};

// ─── OPERATIONS PORTAL ────────────────────────────────────────────────────────

export const OPS_TRAINING: PortalTrainingConfig = {
  portalLabel: 'Operations Portal',
  accent: 'rose',
  completionApiUrl: '/api/ops/training',
  storageKey: 'ops-onboarding-v1',
  modules: [
    {
      id: 'welcome',
      title: 'Welcome to EPR Compass',
      subtitle: '3 min read',
      tag: 'Introduction',
      heading: 'What we do and how you fit in',
      sections: [
        { type: 'p', text: 'EPR Compass (EPR Compass) is India\'s leading EPR compliance platform. We help companies register with CPCB and stay compliant with Extended Producer Responsibility regulations — covering plastic waste, e-waste, batteries, and tyres.' },
        { type: 'p', text: 'As a WFH team member, you are a core part of our operations. Your work directly supports our clients, partners, and consultants in meeting India\'s environmental compliance requirements.' },
        { type: 'info', text: 'You work from home. This means your daily log, check-in, and task updates are your primary way of staying connected with the team. Be consistent and proactive.' },
        { type: 'h', text: 'Our core services:' },
        { type: 'cards', items: [
          { title: 'EPR Registration',      tag: 'Core',    desc: 'Help companies register with CPCB for plastic, e-waste, battery & tyre EPR obligations.' },
          { title: 'Annual Compliance',     tag: 'Filing',  desc: 'Prepare and file annual EPR returns on behalf of clients.' },
          { title: 'Partner Network',       tag: 'Channel', desc: 'Work with a network of 500+ consultants, CA firms, and ESG advisors across India.' },
          { title: 'Academy & Training',    tag: 'Edu',     desc: 'Train professionals on EPR compliance through our Academy platform.' },
        ]},
        { type: 'bullets', items: [
          'Clients range from small manufacturers to large listed companies.',
          'Our team spans sales, operations, compliance, marketing, and technology.',
          'We are a remote-first team — discipline and communication are non-negotiable.',
        ]},
      ],
    },
    {
      id: 'daily-routine',
      title: 'Your Daily Work Routine',
      subtitle: '4 min read',
      tag: 'Workflow',
      heading: 'How to structure your workday',
      sections: [
        { type: 'p', text: 'A consistent daily routine keeps you productive and keeps your manager informed. Follow these steps every working day.' },
        { type: 'steps', items: [
          { n: 1, title: 'Check In',        badge: '9:00 AM',  desc: 'Open the Operations Portal and click "Check In" in the sidebar. This records your start time. Do this before starting any work.' },
          { n: 2, title: 'Check Tasks',     badge: '9:15 AM',  desc: 'Open My Tasks and review your queue. Prioritize urgent items. Move tasks to "In Progress" as you start them.' },
          { n: 3, title: 'Do Your Work',    badge: 'All day',  desc: 'Work on your assigned tasks. If blocked, mark the task as "Blocked" and note why. Reach out to your manager immediately.' },
          { n: 4, title: 'Submit Daily Log', badge: '5:00 PM', desc: 'Before checking out, submit your Daily Log. Describe what you completed, any deliverables, and blockers. Be specific and honest.' },
          { n: 5, title: 'Check Out',       badge: '5:30 PM',  desc: 'Click "Check Out" in the sidebar. Your total hours are automatically calculated and logged for the day.' },
        ]},
        { type: 'info', text: 'Missing check-ins or daily logs — even once — will be flagged to your manager. Consistency builds trust with remote work.' },
        { type: 'h', text: 'What to include in your Daily Log:' },
        { type: 'bullets', items: [
          'Tasks Completed: List each thing you finished, with enough detail that someone else could verify it.',
          'Deliverables: Any files, links, or outputs you produced.',
          'Blockers: Anything that slowed you down or stopped you. Never hide a blocker.',
          'Hours Worked: Be accurate. This is used for payroll and performance tracking.',
        ]},
      ],
    },
    {
      id: 'tools',
      title: 'Tools & Resources',
      subtitle: '3 min read',
      tag: 'Tools',
      heading: 'Where to find everything you need',
      sections: [
        { type: 'p', text: 'The Operations Portal is your main workspace. Here is what each section does.' },
        { type: 'cards', items: [
          { title: 'Dashboard',    tag: 'Home',   desc: 'Your daily overview — check-in status, active tasks, EOD log status, and training progress.' },
          { title: 'My Tasks',     tag: 'Work',   desc: 'All tasks assigned to you or created by you. Update status as you work.' },
          { title: 'Daily Log',    tag: 'Log',    desc: 'Submit your end-of-day work summary here. Must be filled every working day.' },
          { title: 'Training',     tag: 'Learn',  desc: 'Complete your onboarding modules here. Required before you can access all features.' },
        ]},
        { type: 'h', text: 'Role-specific tools:' },
        { type: 'bullets', items: [
          'Proposal Executive → Proposals section for drafting and tracking client proposals.',
          'Compliance Doc Executive → Documents section with EPR compliance checklists.',
          'Market Research Executive → Research workspace + Intel Portal access.',
          'MIS & Reporting Executive → Reports section with CSV export of your activity data.',
          'Lead Gen / Appointment Setter → Lead pipeline and appointment calendar.',
          'CRM Data Executive → Data entry forms for leads and contacts.',
          'Customer Support Executive → Support queue for managing client queries.',
          'Virtual Assistant → Task queue and scheduling tools.',
        ]},
        { type: 'info', text: 'The Knowledge Hub (/knowledge) has all EPR regulatory guides, document templates, and process documentation. Bookmark it.' },
      ],
    },
    {
      id: 'communication',
      title: 'Communication Standards',
      subtitle: '3 min read',
      tag: 'Standards',
      heading: 'How we communicate as a remote team',
      sections: [
        { type: 'p', text: 'Remote work only works when communication is proactive, clear, and consistent. These are not suggestions — they are expectations.' },
        { type: 'steps', items: [
          { n: 1, title: 'Be Proactive',    desc: 'Don\'t wait for your manager to ask for an update. If something changes — a delay, a blocker, a new finding — communicate it immediately.' },
          { n: 2, title: 'Be Specific',     desc: 'Vague updates ("done some work") are not useful. Write specific, verifiable updates ("completed EPR registration data entry for 3 clients: Acme, Beta Corp, Delta Ltd").' },
          { n: 3, title: 'Use the Portal',  desc: 'All updates should be in the portal — tasks, daily logs, proposals. Don\'t keep work in email or WhatsApp only.' },
          { n: 4, title: 'Escalate Blockers', desc: 'If you are stuck, say so immediately. A blocker that sits for a day without being flagged is a problem. Mark the task "Blocked" and message your manager.' },
          { n: 5, title: 'Respect Hours',   desc: 'Work your assigned hours. Check in on time. Check out after logging. Don\'t ghost the team.' },
        ]},
        { type: 'info', text: 'Your manager can see your check-in time, daily log, and task activity. Transparency is how you build trust when working remotely.' },
        { type: 'h', text: 'Escalation path:' },
        { type: 'badges', items: [
          { label: 'You → Your Manager',        color: 'green' },
          { label: 'Manager → Head of Ops',     color: 'amber' },
          { label: 'Head of Ops → Leadership',  color: 'red'   },
        ]},
      ],
    },
    {
      id: 'epr-basics',
      title: 'EPR Basics for All Staff',
      subtitle: '4 min read',
      tag: 'Domain',
      heading: 'What is EPR and why does it matter?',
      sections: [
        { type: 'p', text: 'Even if your role is not directly in compliance, understanding EPR helps you do your job better. Here are the basics every EPR Compass team member should know.' },
        { type: 'info', text: 'EPR = Extended Producer Responsibility. It is a law that makes companies responsible for the waste their products generate after the consumer uses them.' },
        { type: 'h', text: 'Which waste categories does EPR cover in India?' },
        { type: 'badges', items: [
          { label: 'Plastic Waste',  color: 'blue'   },
          { label: 'E-Waste',        color: 'amber'  },
          { label: 'Battery Waste',  color: 'green'  },
          { label: 'Tyre Waste',     color: 'gray'   },
        ]},
        { type: 'p', text: 'Companies that import, manufacture, or sell products in these categories must register with CPCB (Central Pollution Control Board) and file annual compliance reports.' },
        { type: 'h', text: 'What happens if a company doesn\'t comply?' },
        { type: 'bullets', items: [
          'CPCB can issue penalty notices (up to ₹1 crore per violation).',
          'Companies can be blacklisted from government tenders.',
          'Bank accounts can be attached in severe cases.',
          'This is why our clients urgently need our services — the stakes are very high.',
        ]},
        { type: 'p', text: 'Our job is to make compliance easy, fast, and affordable for Indian companies. Every task you do — from data entry to research to proposals — contributes to this mission.' },
      ],
    },
  ],
  quiz: [
    {
      question: 'What is the first thing you should do when you start working each day?',
      options: [
        'Open your email',
        'Check in on the Operations Portal sidebar',
        'Start on your highest priority task',
        'Message your manager',
      ],
      correct: 1,
      explanation: 'Check In via the sidebar widget records your start time. This is mandatory every working day and must happen before you begin any work.',
    },
    {
      question: 'You are stuck on a task and cannot make progress. What should you do?',
      options: [
        'Wait until your daily log to mention it',
        'Skip the task and move to the next one',
        'Mark the task as "Blocked", note the reason, and immediately inform your manager',
        'Try again tomorrow',
      ],
      correct: 2,
      explanation: 'Blockers must be flagged immediately. Mark the task "Blocked" in the portal and notify your manager the same day. Never sit on a blocker.',
    },
    {
      question: 'Which government body do Indian companies register with for EPR compliance?',
      options: ['MoEF', 'CPCB', 'BIS', 'SEBI'],
      correct: 1,
      explanation: 'CPCB — Central Pollution Control Board — is the regulatory authority for EPR compliance in India. Companies must register on the CPCB EPR portal.',
    },
    {
      question: 'What must be in your Daily Log?',
      options: [
        'Just the number of hours worked',
        'A brief "worked on tasks" message',
        'Specific tasks completed, deliverables, blockers, and hours worked',
        'Only tasks that were completed fully',
      ],
      correct: 2,
      explanation: 'A good daily log includes: what you completed (specifically), any deliverables or links, blockers you encountered, and how many hours you worked.',
    },
    {
      question: 'Where should you go to find EPR document templates and regulatory guides?',
      options: [
        'Google',
        'Ask your manager via WhatsApp',
        'The Knowledge Hub at /knowledge',
        'The Admin Panel',
      ],
      correct: 2,
      explanation: 'The Knowledge Hub (/knowledge) contains all EPR document templates, regulatory guides, filing checklists, and process documentation maintained by the team.',
    },
  ],
};

