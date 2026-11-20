// EPR Compliance Courses — for producers, importers, brand owners & consultants
// 8 waste categories × 3 course types = 24 courses
// Target audience: companies with EPR obligations under Indian law

export const EPR_CATEGORIES = [
  {
    id: 'plastic',
    label: 'Plastic Packaging EPR',
    shortLabel: 'Plastic',
    icon: '🧴',
    regulation: 'Plastic Waste Management (PWM) Rules 2016 & 2022',
    wasteType: 'Plastic Waste',
    who: 'Producers, importers, brand owners of plastic-packaged goods',
    tagline: 'Meet your PWM targets, file returns and trade EPR credits confidently',
    color: 'blue',
  },
  {
    id: 'ewaste',
    label: 'E-Waste EPR',
    shortLabel: 'E-Waste',
    icon: '💻',
    regulation: 'E-Waste (Management) Rules 2022',
    wasteType: 'Electronic & Electrical Equipment',
    who: 'Manufacturers and importers of EEE (ITEW, CEEW, solar panels)',
    tagline: 'Register, set EPR targets and manage e-waste compliance end to end',
    color: 'cyan',
  },
  {
    id: 'battery',
    label: 'Battery Waste EPR',
    shortLabel: 'Battery',
    icon: '🔋',
    regulation: 'Battery Waste Management Rules 2022',
    wasteType: 'Battery Waste',
    who: 'Manufacturers and importers of batteries and battery-powered products',
    tagline: 'Navigate battery EPR targets, credits and annual return filings',
    color: 'amber',
  },
  {
    id: 'tyre',
    label: 'Tyre Waste EPR',
    shortLabel: 'Tyre',
    icon: '⭕',
    regulation: 'Tyre Waste Management Rules (upcoming) / MoEFCC Notifications',
    wasteType: 'Tyre Waste',
    who: 'Tyre manufacturers, importers and fleet operators',
    tagline: 'Get ahead of tyre EPR rules before enforcement tightens',
    color: 'orange',
  },
  {
    id: 'elv',
    label: 'ELV EPR',
    shortLabel: 'ELV',
    icon: '🚗',
    regulation: 'Vehicle Scrapping Policy 2021 / MoRTH Guidelines',
    wasteType: 'End-of-Life Vehicles',
    who: 'Vehicle manufacturers (OEMs), importers and fleet operators',
    tagline: 'Comply with ELV scrapping mandates and OEM EPR obligations',
    color: 'rose',
  },
  {
    id: 'usedoil',
    label: 'Used Oil EPR',
    shortLabel: 'Used Oil',
    icon: '🛢️',
    regulation: 'Hazardous Waste Rules / CPCB Used Oil Guidelines',
    wasteType: 'Used Oil',
    who: 'Lubricant manufacturers, importers and large industrial consumers',
    tagline: 'Manage used oil take-back obligations and compliance reporting',
    color: 'yellow',
  },
  {
    id: 'cdwaste',
    label: 'C&D Waste EPR',
    shortLabel: 'C&D Waste',
    icon: '🏗️',
    regulation: 'Construction & Demolition Waste Management Rules 2016',
    wasteType: 'Construction & Demolition Waste',
    who: 'Developers, contractors, urban local bodies and demolition firms',
    tagline: 'Comply with C&D waste rules and unlock green building credits',
    color: 'lime',
  },
  {
    id: 'nonferrous',
    label: 'Non-Ferrous Materials EPR',
    shortLabel: 'Non-Ferrous',
    icon: '⚙️',
    regulation: 'Hazardous & Other Wastes (M&TBM) Rules',
    wasteType: 'Non-Ferrous Scrap',
    who: 'Manufacturers using non-ferrous metals: Al, Cu, Zn, Ni, Pb',
    tagline: 'Understand your EPR obligations for non-ferrous material flows',
    color: 'violet',
  },
];

export const EPR_COURSE_TYPES = [
  {
    type: 'Workshop',
    slug_suffix: 'awareness',
    level: 'Beginner',
    tagline: 'Awareness workshop — get the full regulatory picture',
    price: 0,
    priceLabel: 'Free',
    duration: '1 Day',
    sessions: 2,
    format: 'Online Live',
    badge: 'FREE WORKSHOP',
    badgeColor: 'emerald',
    description: 'A focused 1-day awareness workshop on EPR obligations for your waste category. Covers the regulatory framework, CPCB portal overview, target-setting basics, and key compliance deadlines. No prior knowledge needed.',
    includes: [
      'Live online sessions (recording for 7 days)',
      'Regulatory summary slides & reference PDF',
      'Compliance checklist for your waste category',
      'Q&A with an EPR Compass expert',
      'Certificate of participation',
    ],
    audience: ['New to EPR compliance', 'Legal / compliance teams getting a first overview', 'Consultants needing a refresher'],
  },
  {
    type: 'Certification',
    slug_suffix: 'certification',
    level: 'Intermediate',
    tagline: 'Certification course — build full compliance capability',
    price: 2999,
    priceLabel: '₹2,999',
    duration: '4 Weeks',
    sessions: 8,
    format: 'Online Live',
    badge: 'CERTIFICATION',
    badgeColor: 'amber',
    description: 'An 8-session certification programme covering every aspect of EPR compliance for this waste category: registration, annual targets, EPR credit procurement, Form I & II filing, PRO partnerships, and audit readiness.',
    includes: [
      '8 live online sessions (recorded, lifetime access)',
      'Full module workbook with filing templates',
      'CPCB portal walkthrough with screen recordings',
      'EPR target calculation worksheet',
      'MCQ assessment (50 questions)',
      'Printed certificate of completion',
      'Private learner community access',
    ],
    audience: ['In-house EPR compliance managers', 'Consultants handling EPR filings for clients', 'Legal teams building compliance SOPs'],
  },
  {
    type: 'Mastery',
    slug_suffix: 'consulting',
    level: 'Advanced',
    tagline: 'Consulting mastery — lead EPR strategy & advise clients',
    price: 15000,
    priceLabel: '₹15,000',
    duration: '8 Weeks',
    sessions: 12,
    format: 'Online Live + 1:1 Mentoring',
    badge: 'CONSULTING MASTERY',
    badgeColor: 'violet',
    description: 'Advanced 12-session consulting-level programme. Covers multi-client EPR advisory, complex filing scenarios, EPR credit trading strategy, regulatory risk management, and building a consulting practice for this waste category.',
    includes: [
      '12 live sessions (recorded, lifetime access)',
      'Advanced case studies & multi-client templates',
      '2 × 1:1 mentoring sessions with an EPR Compass expert',
      'Capstone project: full EPR compliance plan for a client',
      'Agency-grade pitch deck & proposal templates',
      'Certificate of Mastery + CEPC directory listing',
      'Priority Slack support for 90 days',
    ],
    audience: ['EPR consultants scaling their practice', 'Agencies building an EPR compliance service line', 'CEPC programme graduates going deeper'],
  },
];

export const EPR_CURRICULUM = {
  plastic: {
    Workshop: {
      modules: [
        { title: 'Session 1 — Regulatory Framework', topics: ['PWM Rules 2016 & 2022 overview', 'Who is a "producer" under PWM Rules', 'EPR targets by material category', 'Key timelines & compliance calendar', 'CPCB portal & State PCB registration basics'] },
        { title: 'Session 2 — Compliance Workflow & Credits', topics: ['Annual returns: Form I & Form II', 'EPR credit procurement from recyclers', 'Registered PRO partnerships', 'Common non-compliance issues', 'Q&A with live examples'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — PWM Rules Deep-Dive', topics: ['Applicability: who must register', 'Plastic categories: rigid, flexible, MLP', 'EPR targets by year (2024–2030 trajectory)', 'State-level PCB notifications', 'Common definitional disputes'] },
        { title: 'Module 2 — CPCB Portal Registration', topics: ['Step-by-step producer registration', 'Document checklist', 'Brand / SKU mapping', 'Annual plastic import/production declaration', 'Portal troubleshooting'] },
        { title: 'Module 3 — Target Setting & Gap Analysis', topics: ['EPR target calculation methodology', 'Category-wise target breakdown', 'Gap analysis: current vs required', 'Material flow mapping', 'Inventory documentation'] },
        { title: 'Module 4 — PRO Partnerships', topics: ['Selecting a CPCB-registered PRO', 'Agreement structure & SLAs', 'Price benchmarking for EPR credits', 'Multi-PRO diversification strategy', 'Credit certificate management'] },
        { title: 'Module 5 — EPR Credit Trading', topics: ['EPR credit marketplace overview', 'Buying credits directly from recyclers', 'Credit price drivers', 'Credit reconciliation & portal upload', 'Avoiding fraudulent certificates'] },
        { title: 'Module 6 — Form I & Form II Filing', topics: ['Form I: annual production/import declaration', 'Form II: EPR compliance report', 'Supporting document checklist', 'Common filing mistakes & corrections', 'Late filing penalties'] },
        { title: 'Module 7 — Audit Readiness', topics: ['CPCB & State PCB inspection preparation', 'Document management system', 'Third-party audit checklist', 'Show-cause notice response template', 'Board-level EPR reporting'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment (50 questions)', 'Practical: EPR target calculation exercise', 'Certificate award session', 'CEPC pathway briefing'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Multi-Category EPR Strategy', topics: ['Managing plastic + e-waste + battery EPR simultaneously', 'Shared compliance calendar', 'Common PRO leverage across categories', 'Regulatory risk matrix'] },
        { title: 'Module 2 — Advanced PWM Interpretation', topics: ['Grey area categories: composite packaging, biodegradables', 'Import vs manufacturing EPR nuances', 'B2B-only businesses: applicability analysis', 'State PCB variation handling'] },
        { title: 'Module 3 — EPR Credit Strategy', topics: ['Building a credit procurement desk', 'Annual credit budget planning', 'Price arbitrage across recycler types', 'Due diligence framework for recycler certificates', 'EPR credit futures: preparing for exchange-based trading'] },
        { title: 'Module 4 — Multi-Client Advisory', topics: ['Onboarding producers as EPR clients', 'Data room setup for EPR filings', 'SLA templates for compliance advisory', 'Billing models: retainer vs transaction fee', 'Client annual reporting workflow'] },
        { title: 'Module 5 — Regulatory Risk Management', topics: ['Show-cause notice strategy', 'Environmental compensation calculation & challenge', 'CPCB enforcement action response', 'Litigation strategy for EPR disputes', 'Director personal liability under PWM Rules'] },
        { title: 'Module 6 — EPR Policy Intelligence', topics: ['Tracking CPCB notifications & draft rules', 'Representing clients at consultation meetings', 'Industry association EPR committee work', 'Writing policy comments for regulatory submissions', 'Antidumping & EPR interaction for importers'] },
        { title: 'Module 7 — Business Development', topics: ['Identifying EPR compliance clients', 'Cold outreach templates for D2C & FMCG brands', 'Pricing EPR advisory services', 'Proposal & scope of work template', 'CEPC directory & profile optimisation'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full EPR compliance plan for a sample client', '1:1 review with an EPR Compass expert', 'Investor / board presentation practice'] },
        { title: 'Module 9 — PRO Business Building', topics: ['Starting a CPCB-registered PRO', 'Onboarding producer clients to your PRO', 'Recycler network curation & due diligence', 'PRO compliance & annual reporting', 'Revenue: credit margin + service fee'] },
        { title: 'Module 10 — Tech & Automation', topics: ['EPR compliance tracking tools', 'CRM for multi-client EPR management', 'Automated deadline reminders system', 'AI-assisted regulatory monitoring', 'Building proprietary EPR dashboards'] },
        { title: 'Module 11 — Advanced Case Studies', topics: ['Large FMCG brand EPR journey', 'D2C startup EPR from day one', 'Import business complexities', 'Enforcement action case study', 'EPR consulting agency success story'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone final submission', '1:1 exit review', 'CEPC certification pathway', 'Mastery certificate award'] },
      ],
    },
  },

  ewaste: {
    Workshop: {
      modules: [
        { title: 'Session 1 — E-Waste Rules Framework', topics: ['E-Waste Rules 2022: who must comply', 'ITEW, CEEW, solar module categories', 'EPR targets & deposit refund scheme', 'CPCB portal registration basics', 'State PCB role in e-waste compliance'] },
        { title: 'Session 2 — Compliance Workflow', topics: ['Producer registration walkthrough', 'Annual returns & credit procurement', 'Registered dismantler / recycler partnerships', 'Common compliance failures', 'Q&A'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — E-Waste Rules 2022 Deep-Dive', topics: ['Applicability categories: ITEW1–ITEW21, CEEW1–CEEW4', 'Deposit Refund Scheme (DRS) introduction', 'EPR targets by product category', 'Solar photovoltaic module obligations', 'State-level variations'] },
        { title: 'Module 2 — CPCB Portal Registration', topics: ['Producer registration step-by-step', 'Brand & model-level product mapping', 'Annual production/import declaration', 'Portal troubleshooting guide', 'Document checklist'] },
        { title: 'Module 3 — EPR Target Calculation', topics: ['Target methodology: collection vs channelisation', 'Category-wise target worksheet', 'Gap analysis from historical data', 'Multi-year target planning', 'Weighted average calculation'] },
        { title: 'Module 4 — Recycler & Dismantler Partnerships', topics: ['Finding CPCB-registered partners', 'Agreement structures & due diligence', 'Certificate verification process', 'Multi-vendor strategy', 'Partner audit checklist'] },
        { title: 'Module 5 — EPR Credit Procurement', topics: ['Credit types: collection, dismantling, recycling', 'Credit procurement portal workflow', 'Price benchmarks by material category', 'Bulk procurement agreements', 'Credit reconciliation'] },
        { title: 'Module 6 — Form I & II Filing', topics: ['Form I: annual declaration filing', 'Form II: EPR compliance report', 'Document uploads & certification', 'Common errors & corrections', 'Penalty provisions'] },
        { title: 'Module 7 — Audit Readiness', topics: ['CPCB inspection checklist', 'Document management best practices', 'Third-party audit workflow', 'Show-cause response strategy', 'Board EPR reporting template'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Target calculation practical exercise', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Multi-Category EPR Alignment', topics: ['E-waste + plastic + battery EPR together', 'Shared PRO leverage', 'Regulatory calendar management', 'Compliance risk matrix'] },
        { title: 'Module 2 — Advanced E-Waste Interpretation', topics: ['Grey area products: IoT devices, smart appliances', 'Import vs domestic manufacturing EPR treatment', 'B2B-only EEE applicability', 'CPCB policy evolution tracking'] },
        { title: 'Module 3 — DRS Strategy', topics: ['Deposit Refund Scheme implementation', 'Consumer take-back programme design', 'DRS accounting & refund management', 'Competitive advantage from DRS excellence'] },
        { title: 'Module 4 — Multi-Client Advisory', topics: ['Onboarding EEE manufacturers as EPR clients', 'Data room & document management', 'SLA templates & billing models', 'Annual compliance workflow for 10+ clients'] },
        { title: 'Module 5 — Regulatory Risk & Enforcement', topics: ['Handling CPCB show-cause notices', 'Environmental compensation challenge strategy', 'Director liability under E-Waste Rules', 'Import ban risk for non-compliant importers'] },
        { title: 'Module 6 — EPR Policy & Advocacy', topics: ['Tracking MoEFCC draft notifications', 'Industry consortium participation', 'Policy comments on draft e-waste rules', 'International standards alignment'] },
        { title: 'Module 7 — Business Development', topics: ['Identifying EEE brand EPR clients', 'Tech startup EPR onboarding', 'Proposal templates for e-waste compliance', 'CEPC profile optimisation'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full e-waste EPR plan for sample client', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — PRO Opportunity in E-Waste', topics: ['Launching an e-waste PRO', 'Channel partner network for collection', 'PRO compliance reporting', 'Revenue model: EEE producers as clients'] },
        { title: 'Module 10 — Tech & Automation', topics: ['E-waste compliance SaaS tools', 'Automated producer-recycler matching', 'RFID-based product tracking for DRS', 'AI regulatory monitoring systems'] },
        { title: 'Module 11 — Case Studies', topics: ['Apple, Samsung e-waste compliance India', 'D2C electronics startup EPR journey', 'Solar module EPR case study', 'Enforcement action response case'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },

  battery: {
    Workshop: {
      modules: [
        { title: 'Session 1 — Battery Waste Rules Framework', topics: ['Battery Waste Management Rules 2022: scope & applicability', 'Battery categories: portable, automotive, industrial, EV', 'EPR targets & timelines', 'Producer registration basics', 'Deposit Refund Scheme for batteries'] },
        { title: 'Session 2 — Compliance Workflow', topics: ['Annual return filing overview', 'Battery EPR credit procurement', 'Collection mechanism design', 'Common compliance pitfalls', 'Q&A'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Battery Waste Rules Deep-Dive', topics: ['Applicability by battery type', 'EPR targets: progressive targets to 2030', 'Deposit Refund Scheme mechanics', 'EV battery specific obligations', 'State variations'] },
        { title: 'Module 2 — CPCB Registration & Declaration', topics: ['Producer registration walkthrough', 'Battery type & chemistry declaration', 'Quantity-based target calculation', 'Annual import/production declaration', 'Document checklist'] },
        { title: 'Module 3 — Target Calculation & Planning', topics: ['Target calculation by battery type', 'Multi-year EPR target roadmap', 'Gap analysis: current vs required', 'Battery weight vs unit-based calculations', 'EV battery EPR planning'] },
        { title: 'Module 4 — Recycler & Dismantler Partnerships', topics: ['CPCB-registered battery recycler search', 'Agreement templates & due diligence', 'Lead-acid vs Li-ion recycler selection', 'Certificate verification protocol', 'Multi-partner strategy'] },
        { title: 'Module 5 — EPR Credit Procurement', topics: ['Credit types for battery EPR', 'Portal-based credit procurement', 'Price benchmarks: lead-acid vs Li-ion', 'Bulk procurement strategy', 'Reconciliation & upload'] },
        { title: 'Module 6 — Form I & II Filing', topics: ['Annual declaration: Form I', 'Compliance report: Form II', 'Supporting documentation', 'Common mistakes & remediation', 'Penalty provisions'] },
        { title: 'Module 7 — Audit Readiness', topics: ['CPCB inspection preparation', 'Battery-specific document management', 'Third-party audit process', 'Show-cause notice strategy', 'Board reporting template'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Target calculation practical', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Multi-Category EPR Strategy', topics: ['Battery + e-waste + plastic EPR together', 'OEM-level EPR coordination', 'Regulatory calendar alignment', 'Multi-category risk matrix'] },
        { title: 'Module 2 — EV Battery EPR Deep-Dive', topics: ['EV battery-specific EPR obligations', 'Battery passport requirements', 'Second-life battery EPR treatment', 'OEM take-back programme design', 'FAME scheme interaction'] },
        { title: 'Module 3 — DRS Strategy for Batteries', topics: ['DRS implementation planning', 'Consumer return incentive design', 'DRS fund accounting', 'Automotive dealer integration', 'DRS competitive benchmarking'] },
        { title: 'Module 4 — Multi-Client Advisory', topics: ['Onboarding battery brand clients', 'EV OEM EPR advisory', 'Data room for battery compliance', 'Billing models for battery EPR advisory'] },
        { title: 'Module 5 — Regulatory Risk Management', topics: ['Battery EPR enforcement landscape', 'Director liability for non-compliance', 'Import restriction risk for non-compliant importers', 'CPCB show-cause strategy'] },
        { title: 'Module 6 — Policy & Industry Advocacy', topics: ['Tracking Battery Waste Rules evolution', 'EV industry policy submissions', 'Industry association battery committee', 'International battery regulation alignment'] },
        { title: 'Module 7 — Business Development', topics: ['Target EPR clients: EV OEMs, electronics brands', 'Battery EPR consulting proposal templates', 'Pricing model for battery compliance advisory', 'CEPC profile for battery EPR'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full battery EPR compliance plan', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — PRO Opportunity in Battery EPR', topics: ['Battery PRO setup & CPCB registration', 'Collection network for batteries', 'Automotive dealer channel partnerships', 'Revenue model for battery PRO'] },
        { title: 'Module 10 — Tech & Tools', topics: ['Battery tracking software', 'QR-code-based battery take-back systems', 'AI for battery compliance monitoring', 'Automated EPR credit management'] },
        { title: 'Module 11 — Advanced Case Studies', topics: ['EV OEM battery EPR compliance', 'Consumer electronics battery EPR', 'Lead-acid battery producer compliance journey', 'Enforcement action case study'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },

  tyre: {
    Workshop: {
      modules: [
        { title: 'Session 1 — Tyre EPR Framework', topics: ['Current regulatory status of tyre EPR', 'Upcoming rules: CPCB notifications & draft rules', 'Who will be covered: OEMs, importers, dealers', 'EPR target design for tyres', 'Proactive compliance steps now'] },
        { title: 'Session 2 — Action Planning', topics: ['What tyre producers should do today', 'Recycler partnership strategy', 'End-of-life tyre data collection', 'Anticipated compliance timelines', 'Q&A'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Tyre Waste Regulatory Landscape', topics: ['Current hazardous waste rules for tyres', 'Draft Tyre Waste Management Rules overview', 'International tyre EPR models', 'CPCB\'s roadmap for tyre EPR', 'Industry association positions'] },
        { title: 'Module 2 — CPCB Registration Readiness', topics: ['Expected registration process', 'Document preparation: volumes, brand mapping', 'Data requirements for tyre EPR registration', 'State PCB engagement strategy', 'Proactive portal preparation'] },
        { title: 'Module 3 — Tyre Volume Accounting', topics: ['Production vs import quantity reporting', 'Tyre categorisation: passenger, commercial, OTR', 'Weight vs unit-based accounting', 'Waste tyre generation modelling', 'Data audit preparation'] },
        { title: 'Module 4 — End-of-Life Tyre Partnerships', topics: ['CPCB-registered recycler identification', 'Pyrolysis & crumb rubber processor selection', 'Agreement templates & due diligence', 'Certificate verification protocol', 'Aggregator network design'] },
        { title: 'Module 5 — EPR Target Strategy', topics: ['Anticipated target structure', 'Multi-year target roadmap', 'Gap analysis & budget planning', 'Credit procurement mechanics', 'Pricing benchmarks'] },
        { title: 'Module 6 — Annual Returns & Reporting', topics: ['Expected annual return format', 'Supporting documentation', 'Common reporting errors', 'Audit preparation', 'Penalty provisions under draft rules'] },
        { title: 'Module 7 — Proactive Compliance Programme', topics: ['Consumer tyre take-back programme design', 'Dealer channel collection', 'Branded recycling partnership', 'PR & CSR leverage from tyre EPR'], },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Tyre EPR action plan exercise', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Deep Regulatory Analysis', topics: ['Draft tyre rules clause-by-clause', 'Comparison with plastic/e-waste EPR', 'Risk map for tyre manufacturers', 'Regulatory timeline forecasting'] },
        { title: 'Module 2 — Multi-OEM Compliance Strategy', topics: ['Fleet-level tyre EPR planning', 'OEM vs replacement market split', 'Global tyre OEM EPR benchmarks', 'India-specific compliance calendar'] },
        { title: 'Module 3 — Recycler Ecosystem Development', topics: ['Building a preferred recycler panel', 'Pyrolysis park partnership model', 'Quality standards for tyre-derived products', 'Environmental due diligence framework'] },
        { title: 'Module 4 — Multi-Client Advisory', topics: ['Tyre brand EPR advisory onboarding', 'Fleet operator compliance programmes', 'Data room for tyre volume declaration', 'Billing model for tyre EPR consulting'] },
        { title: 'Module 5 — Regulatory Risk & Enforcement', topics: ['Anticipated enforcement timeline', 'Director liability under tyre EPR rules', 'Import restriction risk', 'Show-cause strategy template'] },
        { title: 'Module 6 — Policy Advocacy', topics: ['Participating in draft rules consultation', 'Industry body tyre EPR committee', 'Writing policy submissions', 'Shaping favourable EPR target design'] },
        { title: 'Module 7 — Business Development', topics: ['Identifying tyre brand EPR clients', 'Fleet operator compliance advisory', 'Proposal templates for tyre EPR', 'CEPC profile for tyre compliance'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full tyre EPR compliance plan', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — PRO Opportunity', topics: ['Tyre EPR PRO setup strategy', 'Collection network design', 'Revenue model for tyre PRO', 'CPCB registration process'] },
        { title: 'Module 10 — Technology & Data', topics: ['Tyre tracking through supply chain', 'QR code on tyre for EPR tracking', 'Data analytics for tyre waste forecasting', 'Automated compliance reporting'] },
        { title: 'Module 11 — Case Studies', topics: ['MRF, Apollo tyre EPR readiness', 'Michelin Europe tyre EPR model', 'Import tyre brand compliance journey', 'Fleet operator EPR case study'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },

  elv: {
    Workshop: {
      modules: [
        { title: 'Session 1 — ELV Policy & OEM Obligations', topics: ['Vehicle Scrapping Policy 2021 overview', 'OEM EPR obligations under MoRTH', 'AVSF & RVSF ecosystem roles', 'VAHAN portal basics', 'Applicable vehicle categories'] },
        { title: 'Session 2 — Compliance Workflow', topics: ['Scrapping certificate process', 'EPR target expectations for OEMs', 'Data reporting requirements', 'OEM take-back programme design overview', 'Q&A'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Vehicle Scrapping Policy Deep-Dive', topics: ['MoRTH Vehicle Scrapping Policy 2021', 'Mandatory fitness test amendments', 'End-of-life vehicle categories', 'OEM scrapping mandate timeline', 'Import vehicle applicability'] },
        { title: 'Module 2 — AVSF & RVSF Framework', topics: ['Authorised vs Registered facility types', 'AVSF licensing requirements', 'VAHAN integration & digital workflow', 'Scrapping certificate issuance process', 'Role of AVSFs in OEM EPR'] },
        { title: 'Module 3 — OEM EPR Obligations', topics: ['EPR targets for vehicle manufacturers', 'Phase-in timeline & category mapping', 'Data declaration to MoRTH', 'Credit mechanism for OEMs', 'Fleet operator obligations'] },
        { title: 'Module 4 — Compliance Data Management', topics: ['Vehicle end-of-life data collection', 'VAHAN API integration for OEMs', 'Annual declaration format & data fields', 'Third-party data audit', 'Document retention policy'] },
        { title: 'Module 5 — AVSF Partnership', topics: ['Finding CPCB-registered AVSFs', 'Agreement templates for OEMs', 'White-label scrapping programme', 'Consumer incentive structure', 'Certificate reconciliation'] },
        { title: 'Module 6 — Annual Returns & Reporting', topics: ['MoRTH annual return format', 'Supporting documentation', 'Common reporting mistakes', 'Audit preparation', 'Penalty provisions'] },
        { title: 'Module 7 — Compliance Calendar & SOPs', topics: ['Annual compliance calendar for vehicle OEMs', 'Internal SOP for EPR tracking', 'Board-level EPR reporting', 'Third-party audit readiness', 'Regulatory change monitoring'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Compliance calendar creation exercise', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Multi-Category EPR for OEMs', topics: ['Battery + ELV EPR for EV OEMs', 'Regulatory calendar management', 'Shared scrapping programme for battery + ELV', 'Risk matrix for large vehicle OEMs'] },
        { title: 'Module 2 — EV-Era ELV Strategy', topics: ['EV battery handling at end-of-life', 'Second-life battery vs scrapping decision', 'OEM take-back design for EV fleets', 'FAME policy interaction with ELV EPR'] },
        { title: 'Module 3 — National AVSF Network Strategy', topics: ['Building preferred AVSF panel for large OEMs', 'White-label AVSF development', 'Geographic coverage planning', 'AVSF performance SLAs & monitoring'] },
        { title: 'Module 4 — Multi-OEM Advisory', topics: ['Onboarding vehicle manufacturer clients', 'Data room for ELV compliance', 'Billing models for ELV EPR advisory', 'SLA templates for OEM clients'] },
        { title: 'Module 5 — Regulatory Risk Management', topics: ['ELV enforcement action response', 'Director liability for non-compliance', 'Import vehicle EPR complexities', 'Show-cause notice strategy'] },
        { title: 'Module 6 — Policy Advocacy', topics: ['MoRTH policy consultation participation', 'ELV EPR target design advocacy', 'Industry body vehicle scrapping committee', 'Writing submissions on ELV draft rules'] },
        { title: 'Module 7 — Business Development', topics: ['Vehicle OEM EPR advisory as a service', 'Dealer network compliance programmes', 'Proposal & SLA templates for ELV clients', 'CEPC profile for ELV compliance'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full ELV compliance plan for a sample OEM', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — PRO for ELV Sector', topics: ['ELV PRO setup strategy', 'Collection network for end-of-life vehicles', 'Revenue model: OEM clients + scrapping margin', 'CPCB/MoRTH registration requirements'] },
        { title: 'Module 10 — Tech & Data', topics: ['VAHAN API integration for compliance tracking', 'IoT vehicle end-of-life detection', 'Blockchain vehicle lifecycle data', 'AI for ELV volume forecasting'] },
        { title: 'Module 11 — Case Studies', topics: ['Maruti, Mahindra ELV compliance journey', 'CERO recycling model analysis', 'Import brand ELV compliance', 'ELV enforcement action case study'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },

  usedoil: {
    Workshop: {
      modules: [
        { title: 'Session 1 — Used Oil Regulatory Framework', topics: ['Hazardous Waste Rules applicability for used oil', 'CPCB used oil guidelines overview', 'Who must comply: lubricant manufacturers & large consumers', 'Collection obligations & take-back basics', 'Compliance calendar overview'] },
        { title: 'Session 2 — Compliance Workflow', topics: ['CPCB registration process', 'Annual return filing overview', 'Re-refiner partnership basics', 'Common compliance issues', 'Q&A'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Used Oil Regulatory Deep-Dive', topics: ['Hazardous Waste Rules: used oil provisions', 'CPCB used oil management guidelines', 'Applicability: lubricant producers vs consumers', 'State PCB authorisation requirements', 'Collection obligation calculations'] },
        { title: 'Module 2 — CPCB Registration', topics: ['Step-by-step registration process', 'Product category & volume declaration', 'Document checklist', 'Annual production/import declaration', 'Portal walkthrough'] },
        { title: 'Module 3 — Used Oil Volume Accounting', topics: ['Production vs import quantity tracking', 'Industrial consumer reporting obligations', 'Waste generation rate methodology', 'Inventory audit', 'Third-party verification'] },
        { title: 'Module 4 — Re-refiner & Collector Partnerships', topics: ['CPCB-registered re-refiner identification', 'Agreement templates & due diligence', 'Collection centre network selection', 'Certificate verification', 'Multi-vendor strategy'] },
        { title: 'Module 5 — EPR Credit Procurement', topics: ['Credit types for used oil', 'Portal-based procurement workflow', 'Price benchmarks', 'Bulk procurement strategy', 'Reconciliation & upload'] },
        { title: 'Module 6 — Annual Returns & Reporting', topics: ['Annual return format & fields', 'Supporting documentation', 'Common errors', 'Audit preparation', 'Penalty provisions'] },
        { title: 'Module 7 — Compliance SOPs & Audit Readiness', topics: ['Internal SOP for used oil tracking', 'CPCB inspection checklist', 'Third-party audit workflow', 'Board reporting template', 'Show-cause response strategy'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Compliance SOP creation exercise', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Multi-Category EPR Strategy', topics: ['Used oil + plastic + other EPR alignment', 'Shared compliance calendar', 'Cross-category PRO leverage', 'Regulatory risk matrix'] },
        { title: 'Module 2 — Advanced Compliance Interpretation', topics: ['Grey area applicability questions', 'Industrial consumer obligations', 'Import lubricant brand complexities', 'State PCB variation management'] },
        { title: 'Module 3 — Collection Programme Excellence', topics: ['Designing best-in-class take-back programme', 'Industrial partner integration', 'Consumer/dealer channel programme', 'Digital oil tracking implementation'] },
        { title: 'Module 4 — Multi-Client Advisory', topics: ['Onboarding lubricant brand clients', 'Industrial consumer compliance advisory', 'Data room for used oil compliance', 'Billing models for used oil advisory'] },
        { title: 'Module 5 — Regulatory Risk Management', topics: ['Used oil enforcement action strategy', 'Director liability', 'Environmental compensation challenges', 'Show-cause notice templates'] },
        { title: 'Module 6 — Policy Advocacy', topics: ['Tracking CPCB used oil rule evolution', 'Industry body participation', 'Policy submissions for used oil rules', 'International comparison research'] },
        { title: 'Module 7 — Business Development', topics: ['Target clients: lubricant companies', 'Industrial estate used oil compliance advisory', 'Proposal templates for used oil EPR', 'CEPC profile for hazardous waste compliance'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full used oil EPR compliance plan', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — PRO Opportunity', topics: ['Used oil EPR PRO setup', 'Collection network design', 'Industrial client acquisition', 'Revenue model for used oil PRO'] },
        { title: 'Module 10 — Tech & Automation', topics: ['Digital used oil tracking platforms', 'IoT sensors for used oil collection', 'AI monitoring of compliance deadlines', 'Automated certificate management'] },
        { title: 'Module 11 — Case Studies', topics: ['Major lubricant brand compliance journey', 'Industrial estate used oil programme', 'Import lubricant brand EPR', 'Enforcement case study'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },

  cdwaste: {
    Workshop: {
      modules: [
        { title: 'Session 1 — C&D Waste Rules Framework', topics: ['C&D Waste Management Rules 2016 overview', 'Who must comply: developers, contractors, ULBs', 'Waste segregation & processing obligations', 'Bulk waste generators: applicability', 'Compliance calendar'] },
        { title: 'Session 2 — Compliance Workflow', topics: ['Registration with local body', 'Waste management plan requirements', 'Processor empanelment', 'Annual reporting overview', 'Q&A'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — C&D Waste Rules Deep-Dive', topics: ['C&D Waste Management Rules 2016', 'State-level implementation regulations', 'Bulk generator definition & threshold', 'ULB obligations', 'Environmental clearance interaction'] },
        { title: 'Module 2 — Registration & Waste Management Plan', topics: ['Registration with ULB/state authority', 'Waste Management Plan (WMP) preparation', 'Quantity estimation methodology', 'Document checklist', 'Approval process'] },
        { title: 'Module 3 — Waste Quantification & Tracking', topics: ['C&D waste generation estimation', 'Segregation at source requirements', 'Digital waste tracking systems', 'Manifest & trip sheet management', 'Third-party verification'] },
        { title: 'Module 4 — Empanelled Processor Partnerships', topics: ['ULB-empanelled processor identification', 'Agreement templates', 'Recycled Concrete Aggregate (RCA) procurement for reuse', 'Certificate of disposal', 'Multi-project processor management'] },
        { title: 'Module 5 — On-Site Management SOPs', topics: ['Segregation: concrete, brick, metal, wood, asphalt', 'Waste storage area design', 'Dust suppression requirements', 'EHS compliance for demolition sites', 'Contractor SOP development'] },
        { title: 'Module 6 — Annual Returns & Reporting', topics: ['Annual return to ULB/authority', 'Data fields & documentation', 'Common reporting errors', 'Third-party audit', 'Penalty provisions'] },
        { title: 'Module 7 — Green Building Integration', topics: ['GRIHA & LEED C&D waste credits', 'Recycled content in construction', 'RCA specification in project specs', 'Compliance documentation for green ratings', 'ESG reporting for developers'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Waste Management Plan creation exercise', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Multi-Project Compliance Strategy', topics: ['Managing EPR across 20+ construction sites', 'Centralised compliance calendar', 'Shared processor contracts', 'Group-level C&D waste reporting'] },
        { title: 'Module 2 — Developer ESG Integration', topics: ['C&D waste in ESG reporting', 'Green building certifications leverage', 'Investor ESG disclosure on C&D waste', 'Circular economy KPIs for developers'] },
        { title: 'Module 3 — Supply Chain Circularity', topics: ['RCA procurement into new construction', 'Recycled steel & wood reuse framework', 'Procurement specifications for recycled C&D materials', 'Circular construction case studies'] },
        { title: 'Module 4 — Multi-Client Advisory', topics: ['Developer & contractor EPR advisory', 'ULB compliance programme design', 'Data room for multi-site C&D compliance', 'Billing model for C&D compliance advisory'] },
        { title: 'Module 5 — Regulatory Risk & Enforcement', topics: ['NGT orders on C&D waste', 'Municipal enforcement action response', 'Environmental compensation challenge', 'Director liability for large developers'] },
        { title: 'Module 6 — Policy Advocacy', topics: ['C&D waste rules revision process', 'Industry body representation', 'RERA C&D waste mandate advocacy', 'State policy participation'] },
        { title: 'Module 7 — Business Development', topics: ['Targeting real estate developer clients', 'Construction firm C&D compliance advisory', 'ULB consulting opportunities', 'CEPC profile for C&D compliance'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full C&D compliance plan for a developer project', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — C&D Compliance for Infrastructure', topics: ['NHAI & railway project C&D compliance', 'Smart city C&D waste integration', 'Public infrastructure EPR tracking', 'Government contractor compliance'] },
        { title: 'Module 10 — Tech & Platforms', topics: ['Digital C&D waste management platforms', 'IoT-based site waste tracking', 'AI waste volume estimation', 'RERA portal C&D waste reporting'] },
        { title: 'Module 11 — Case Studies', topics: ['Large developer C&D compliance journey', 'Smart city C&D waste programme', 'Infrastructure project C&D EPR', 'Enforcement action case study'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },

  nonferrous: {
    Workshop: {
      modules: [
        { title: 'Session 1 — Non-Ferrous EPR Framework', topics: ['Hazardous & Other Wastes Rules applicability', 'Non-ferrous material categories: Al, Cu, Zn, Ni, Pb', 'Producer obligations overview', 'CPCB registration basics', 'Compliance calendar overview'] },
        { title: 'Session 2 — Compliance Workflow', topics: ['Annual return filing overview', 'Recycler partnership basics', 'Scrap tracking requirements', 'Common compliance issues', 'Q&A'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Regulatory Deep-Dive', topics: ['Hazardous Waste Rules for non-ferrous producers', 'Metal categories: applicability analysis', 'Upcoming non-ferrous EPR framework', 'CPCB vs State PCB jurisdiction', 'Import vs domestic production treatment'] },
        { title: 'Module 2 — CPCB Registration', topics: ['Producer registration process', 'Metal type & volume declaration', 'Document checklist', 'Annual production/import declaration', 'Portal walkthrough'] },
        { title: 'Module 3 — Volume Accounting', topics: ['Non-ferrous material flow mapping', 'Scrap generation rate methodology', 'Category-wise quantity tracking', 'Third-party inventory audit', 'Data verification protocols'] },
        { title: 'Module 4 — Recycler Partnerships', topics: ['CPCB-registered secondary smelter identification', 'Agreement templates & due diligence', 'Certificate verification process', 'Multi-vendor strategy', 'Recycler audit checklist'] },
        { title: 'Module 5 — EPR Credit Procurement', topics: ['Credit mechanics for non-ferrous', 'Portal-based procurement workflow', 'Price benchmarks by metal type', 'Bulk procurement strategy', 'Reconciliation & upload'] },
        { title: 'Module 6 — Annual Returns & Reporting', topics: ['Annual return format', 'Supporting documentation', 'Common errors', 'Audit preparation', 'Penalty provisions'] },
        { title: 'Module 7 — Compliance SOPs & Audit Readiness', topics: ['Internal non-ferrous tracking SOP', 'CPCB inspection checklist', 'Third-party audit workflow', 'Board EPR reporting', 'Show-cause strategy'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Material flow mapping exercise', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Multi-Category EPR Alignment', topics: ['Non-ferrous + hazardous waste EPR together', 'Regulatory calendar management', 'Shared PRO strategy', 'Multi-category risk matrix'] },
        { title: 'Module 2 — Advanced Regulatory Interpretation', topics: ['Grey area applicability: secondary manufacturers', 'Import non-ferrous scrap obligations', 'LME pricing & compliance interaction', 'State PCB variation strategy'] },
        { title: 'Module 3 — Recycler Ecosystem Development', topics: ['Building preferred smelter panel', 'Quality standards for secondary metals', 'Environmental due diligence framework', 'Multi-metal recycler selection criteria'] },
        { title: 'Module 4 — Multi-Client Advisory', topics: ['Metal manufacturer EPR advisory', 'Cable & wire industry compliance', 'Automotive non-ferrous compliance', 'Billing models for non-ferrous advisory'] },
        { title: 'Module 5 — Regulatory Risk Management', topics: ['Enforcement action response', 'Director liability', 'Import restriction risk for non-compliant importers', 'Show-cause notice templates'] },
        { title: 'Module 6 — Policy Advocacy', topics: ['Non-ferrous EPR rule development participation', 'Industry body representation', 'Policy submissions on draft rules', 'International benchmarking'] },
        { title: 'Module 7 — Business Development', topics: ['Target clients: Al, Cu, Zn manufacturers', 'Cable & wire industry advisory', 'Automotive sector non-ferrous compliance', 'CEPC profile for hazardous waste compliance'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full non-ferrous EPR compliance plan', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — PRO Opportunity', topics: ['Non-ferrous EPR PRO setup strategy', 'Smelter network for PRO operations', 'Revenue model for non-ferrous PRO', 'CPCB registration requirements'] },
        { title: 'Module 10 — Tech & Tools', topics: ['Scrap tracking software', 'Blockchain metal provenance', 'AI for regulatory monitoring', 'Automated certificate management'] },
        { title: 'Module 11 — Case Studies', topics: ['Hindalco, Vedanta compliance journey', 'Cable manufacturer non-ferrous EPR', 'Import scrap business compliance', 'Enforcement action case study'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },
};

export const EPR_TESTIMONIALS = [
  { name: 'Amit Kapoor', role: 'EPR Compliance Head, FMCG Brand, Mumbai', text: 'The Certification course was exactly what our compliance team needed. Went from confused about PWM targets to filing Form II confidently in 4 weeks.' },
  { name: 'Sneha Reddy', role: 'EPR Consultant, Hyderabad', text: 'The Mastery course gave me everything to onboard my first 5 EPR clients. The proposal templates alone were worth ten times the fee.' },
  { name: 'Rahul Mehta', role: 'Regulatory Affairs, Electronics OEM', text: 'The E-Waste certification covered every corner of the 2022 rules. Our CPCB registration was done without a single back-and-forth.' },
  { name: 'Lakshmi Iyer', role: 'Sustainability Manager, Auto Parts Manufacturer', text: 'The Workshop was free and genuinely useful — not a sales pitch. Enrolled in Certification the same week.' },
];

export const EPR_FAQS = [
  { q: 'Who is this course designed for?', a: 'Producers, importers and brand owners with EPR obligations, in-house compliance managers, EPR consultants advising regulated businesses, and sustainability / legal teams building compliance SOPs.' },
  { q: 'Is this about compliance for producers or for recyclers?', a: 'This is for producers, importers and brand owners — companies that generate EPR obligations under India\'s waste rules. For recyclers wanting to build a business, see our Recycler Business Courses.' },
  { q: 'Do I need prior EPR knowledge?', a: 'Workshop is for complete beginners. Certification assumes basic business / compliance context. Mastery is for consultants or in-house managers who already handle some EPR work.' },
  { q: 'Is the course online?', a: 'Yes — all sessions are online live via Zoom/Google Meet, with recordings. Mastery includes 1:1 video call sessions with an EPR Compass expert.' },
  { q: 'What payment options are available?', a: 'All major Indian payment options via Razorpay: UPI, debit/credit cards, net banking, and EMI on Certification & Mastery.' },
  { q: 'Is GST applicable?', a: 'Yes — 18% GST is added at checkout.' },
  { q: 'Can I get a refund?', a: 'Full refund within 7 days of purchase if no sessions attended. After that, deferred enrollment to next cohort is available.' },
  { q: 'Who teaches the courses?', a: 'Courses are delivered by the EPR Compass training team, with category-specific guidance and practical examples.' },
];

export function buildEprSlug(categoryId, type) {
  const suffix = { Workshop: 'awareness', Certification: 'certification', Mastery: 'consulting' }[type];
  return `${categoryId}-epr-${suffix}`;
}

export function resolveEprSlug(slug) {
  const suffixMap = { awareness: 'Workshop', certification: 'Certification', consulting: 'Mastery' };
  const suffix = Object.keys(suffixMap).find(s => slug.endsWith(`-epr-${s}`));
  if (!suffix) return null;
  const categoryId = slug.slice(0, -(5 + suffix.length)); // strip '-epr-{suffix}' (5 = len('-epr-'))
  const category = EPR_CATEGORIES.find(c => c.id === categoryId);
  const courseType = EPR_COURSE_TYPES.find(t => t.type === suffixMap[suffix]);
  if (!category || !courseType) return null;
  const curriculum = EPR_CURRICULUM[categoryId]?.[courseType.type];
  return { category, courseType, curriculum };
}

