// Career Transition & EPR Professional Development Programmes
// Target: EHS professionals, fresh graduates, working pros, corporate managers, entrepreneurs

export const CAREER_PROGRAMMES = [
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'ehs-to-epr',
    title: 'EHS to EPR — Career Transition Programme',
    shortTitle: 'EHS to EPR Transition',
    badge: 'CAREER TRANSITION',
    badgeColor: 'teal',
    icon: '🔄',
    tagline: 'Leverage your EHS expertise to become a highly paid EPR compliance consultant',
    targetAudience: 'Environment, Health & Safety (EHS) professionals with 2–15 years of experience',
    audienceProfiles: [
      'EHS officers at manufacturing companies',
      'Environment compliance managers at corporates',
      'Factory EHS auditors & inspectors',
      'ISO 14001 / OHSAS consultants wanting to expand',
      'PCB / CPCB regulatory officers transitioning to private sector',
    ],
    price: 9999,
    priceLabel: '₹9,999',
    duration: '6 Weeks',
    sessions: 10,
    format: 'Online Live + 1:1 Mentoring',
    level: 'Professional',
    description: 'A structured 6-week career transition programme for EHS professionals who want to pivot into India\'s booming EPR compliance sector. You already understand environmental regulations — this programme bridges the gap to EPR-specific rules, CPCB portal workflows, client management and business development.',
    whyNow: [
      'India\'s EPR market is growing 40% YoY with every new waste rule',
      'EHS professionals are uniquely positioned — regulatory background is your moat',
      'EPR consulting commands ₹60,000–₹3,00,000/month retainers',
      'Fewer than 2,000 trained EPR consultants for 80,000+ regulated businesses',
      'Get in before the market is crowded — early movers earn 5× more',
    ],
    curriculum: [
      {
        title: 'Week 1 — EPR Landscape for EHS Professionals',
        topics: [
          'How EPR differs from EHS — key mental model shifts',
          'India\'s EPR regulatory ecosystem: MoEFCC, CPCB, State PCBs',
          'All 5 EPR categories: plastic, e-waste, battery, tyre, used oil',
          'How your EHS skills directly map to EPR compliance work',
          'The EPR consultant opportunity: market size & income potential',
          'EHS vs EPR career ladder comparison',
        ],
      },
      {
        title: 'Week 2 — Core EPR Regulations',
        topics: [
          'PWM Rules 2016 & 2022 — plastic waste deep-dive',
          'E-Waste Management Rules 2022',
          'Battery Waste Management Rules 2022',
          'Tyre & Used Oil rules — current and upcoming',
          'CPCB portal: registration, filings, certificate management',
          'Multi-category EPR compliance calendar',
        ],
      },
      {
        title: 'Week 3 — EPR Compliance Delivery Skills',
        topics: [
          'EPR target calculation: methodology & worksheets',
          'Form I & Form II filing — live portal demonstration',
          'EPR credit procurement & PRO selection',
          'Annual return preparation: document checklist',
          'Audit support: inspection prep & show-cause responses',
          'Transferring your EHS audit skills to EPR compliance audits',
        ],
      },
      {
        title: 'Week 4 — Client Management & Advisory',
        topics: [
          'Structuring EPR advisory engagements',
          'Scoping a compliance mandate for a producer client',
          'SLA, deliverable and billing model templates',
          'Data management: handling client EPR data rooms',
          'Multi-client compliance calendar management',
          'From EHS employee to EPR consultant: mindset shift',
        ],
      },
      {
        title: 'Week 5 — Business Development',
        topics: [
          'Identifying your ideal EPR client profile',
          'Leveraging your EHS network for EPR leads',
          'Cold outreach scripts for D2C, FMCG, electronics brands',
          'Pricing your services: retainer vs project fee',
          'LinkedIn profile optimisation for EPR consulting',
          'Proposal template walkthrough: scope, timeline, fee',
        ],
      },
      {
        title: 'Week 6 — Launch & Capstone',
        topics: [
          'Capstone: full EPR compliance plan for a sample client',
          '1:1 mentoring session with an EPR Compass expert',
          'CEPC certification pathway briefing',
          'Setting up your EPR consulting practice: legal, GST, tools',
          'First 90-day action plan post-programme',
          'Certificate of Completion award',
        ],
      },
    ],
    outcomes: [
      'Confidently advise producers on EPR compliance across all waste categories',
      'File CPCB portal returns, Form I & Form II for clients',
      'Price, scope and win EPR consulting mandates',
      'Build a ₹1–3 lakh/month EPR consulting income within 6 months',
      'Earn your CEPC (Certified EPR Professional Consultant) credential',
    ],
    testimonials: [
      { name: 'Rajesh Iyer', role: 'Former EHS Manager → EPR Consultant, Chennai', text: 'Moved from a ₹65,000/month EHS job to ₹1.8L/month EPR consulting in 5 months. This programme gave me the exact roadmap.' },
      { name: 'Neha Singhania', role: 'Ex-Factory Environment Officer → EPR Freelancer', text: 'My 8 years of EHS background was completely underutilised until I did this transition programme. Now I have 6 retainer clients.' },
    ],
    faqs: [
      { q: 'How much EHS experience do I need?', a: 'Minimum 2 years of environment compliance experience. The programme builds on your existing regulatory knowledge — the faster you pick it up.' },
      { q: 'Can I do this while working full time?', a: 'Yes. Sessions are held on weekends and evenings. Recordings available for all missed sessions.' },
      { q: 'How soon can I earn from EPR consulting?', a: 'Most participants land their first EPR client within 30–60 days of completing the programme, leveraging existing professional networks.' },
      { q: 'Does this include the CEPC certification?', a: 'This programme prepares you for the CEPC path. The CEPC credential is earned through our Tier 2 Academy programme, which this programme qualifies you to fast-track.' },
    ],
    upsells: [
      { label: 'Tier 2 — CEPC Certification (₹5,000)', path: '/academy/login?program=tier-2' },
      { label: 'Plastic EPR — Mastery Course (₹15,000)', path: '/trainings/epr-compliance/plastic-epr-consulting' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'start-epr-career',
    title: 'Start Your Career as an EPR Consultant',
    shortTitle: 'Start EPR Career',
    badge: 'CAREER STARTER',
    badgeColor: 'emerald',
    icon: '🚀',
    tagline: 'Zero to first EPR client — the complete launchpad for aspiring EPR professionals',
    targetAudience: 'Fresh graduates, early-career professionals and career-changers with no prior EPR experience',
    audienceProfiles: [
      'B.E. / B.Tech (Environmental, Chemical, Civil) graduates',
      'MBA / BBA graduates entering sustainability',
      'Science graduates wanting a career in green compliance',
      'Early-career professionals (0–3 years) from any field',
      'Homemakers / career-breakers returning to work in sustainability',
    ],
    price: 7999,
    priceLabel: '₹7,999',
    duration: '8 Weeks',
    sessions: 12,
    format: 'Online Live + Career Support',
    level: 'Beginner to Professional',
    description: 'The most comprehensive EPR career launchpad in India. Built specifically for people starting from zero — covers the full regulatory landscape, hands-on CPCB portal skills, client-ready deliverable templates, and a structured job / freelance placement support system.',
    whyNow: [
      'EPR compliance is a sunrise sector — new rules add thousands of regulated businesses every year',
      'India needs 50,000+ EPR professionals over the next 5 years',
      'EPR consultants earn ₹4–8 LPA at entry level, ₹15–40 LPA at senior level',
      'No engineering degree required — regulatory knowledge + communication skills are what matter',
      'Starting now means 3-year head start on anyone entering after 2027',
    ],
    curriculum: [
      {
        title: 'Module 1 — India\'s EPR Landscape',
        topics: [
          'What is Extended Producer Responsibility (EPR)?',
          'India\'s waste crisis & why EPR was introduced',
          'All EPR rules: plastic, e-waste, battery, tyre, used oil',
          'Key stakeholders: MoEFCC, CPCB, State PCBs, producers, PROs, recyclers',
          'EPR market size & career opportunity in India',
          'EPR consultant vs in-house EPR manager — choosing your path',
        ],
      },
      {
        title: 'Module 2 — PWM Rules Mastery',
        topics: [
          'Plastic Waste Management Rules 2016 & 2022 — clause by clause',
          'Who is a producer, importer, brand owner under PWM',
          'Plastic categories: rigid, flexible, multi-layered',
          'EPR targets: calculation and multi-year roadmap',
          'PRO system: selection, agreements, due diligence',
          'Common compliance failures and how to spot them',
        ],
      },
      {
        title: 'Module 3 — E-Waste, Battery & Other Rules',
        topics: [
          'E-Waste Management Rules 2022 — key provisions',
          'Battery Waste Management Rules 2022 — key provisions',
          'Tyre & used oil rules overview',
          'Cross-category compliance calendar',
          'Identifying which rules apply to a given business',
          'Multi-category client advisory — a day in the life',
        ],
      },
      {
        title: 'Module 4 — CPCB Portal Hands-On',
        topics: [
          'Producer registration: step-by-step screen share',
          'Brand/SKU mapping and quantity declaration',
          'Form I filing — live demonstration',
          'Form II filing — live demonstration',
          'EPR credit upload and reconciliation',
          'Common portal errors and troubleshooting guide',
        ],
      },
      {
        title: 'Module 5 — Client-Ready Deliverables',
        topics: [
          'EPR gap analysis report — template walkthrough',
          'EPR compliance calendar — Excel template',
          'Compliance status dashboard for clients',
          'Annual return preparation checklist',
          'Audit readiness document pack',
          'PRO evaluation matrix',
        ],
      },
      {
        title: 'Module 6 — EPR Consulting Business',
        topics: [
          'Services you can offer as an EPR consultant',
          'Pricing models: fixed fee, retainer, transaction-based',
          'Freelance vs employment — pros and cons',
          'Writing your first EPR consulting proposal',
          'Non-disclosure & engagement letter templates',
          'GST registration and invoicing for consultants',
        ],
      },
      {
        title: 'Module 7 — Job & Client Search',
        topics: [
          'Companies that hire EPR compliance executives',
          'LinkedIn profile optimisation for EPR roles',
          'Resume building for EPR jobs',
          'Cold outreach to EPR consultancies',
          'Freelance platforms for EPR projects',
          'Building your EPR portfolio from day one',
        ],
      },
      {
        title: 'Module 8 — Interview & Client Pitch Prep',
        topics: [
          'Common EPR interview questions with model answers',
          'Client discovery call framework',
          'Proposal presentation skills',
          'Mock client Q&A with peers',
          '1:1 review with an EPR Compass expert',
          'Certificate of Completion + career support pack',
        ],
      },
    ],
    outcomes: [
      'Understand all major Indian EPR regulations from scratch',
      'Independently file CPCB portal returns for a client',
      'Prepare a professional EPR gap analysis and compliance report',
      'Write and win your first EPR consulting proposal',
      'Secure an EPR job or first freelance client within 90 days',
    ],
    testimonials: [
      { name: 'Akash Verma', role: 'Fresh Graduate → Junior EPR Consultant, Delhi', text: 'Landed my first EPR consultancy job 3 weeks after completing this programme. The portal hands-on sessions were the difference-maker.' },
      { name: 'Priya Kulkarni', role: 'Career Changer → EPR Freelancer, Pune', text: 'Switched from HR to EPR consulting at 32. The programme gave me both the knowledge and the confidence to make the leap.' },
    ],
    faqs: [
      { q: 'Do I need an environmental engineering background?', a: 'Not at all. The programme starts from zero. A science background helps but is not required — many successful EPR consultants come from commerce or management backgrounds.' },
      { q: 'Is placement assistance provided?', a: 'Yes — we share curated job openings, freelance opportunities, and help you get listed on the CEPC directory after you progress to certification.' },
      { q: 'Can I do this alongside college?', a: 'Absolutely. Sessions are on weekends with full recordings. Many final-year students complete this to be job-ready by graduation.' },
      { q: 'What\'s the income potential?', a: 'Entry-level EPR executives earn ₹3.5–6 LPA. Freelance EPR consultants earn ₹30,000–₹1,50,000/month within 6–12 months.' },
    ],
    upsells: [
      { label: 'Tier 1 — EPR Awareness Bootcamp (₹999)', path: '/academy/login?program=tier-1' },
      { label: 'Tier 2 — CEPC Certification (₹5,000)', path: '/academy/login?program=tier-2' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'epr-consultant-accelerator',
    title: 'EPR Consultant Accelerator',
    shortTitle: 'Consultant Accelerator',
    badge: 'ACCELERATOR',
    badgeColor: 'indigo',
    icon: '⚡',
    tagline: 'From side income to full-time EPR consulting practice — in 8 weeks',
    targetAudience: 'Working professionals who want to build EPR consulting as a primary or supplementary income',
    audienceProfiles: [
      'Environmental consultants adding EPR to their service portfolio',
      'CA / CS / lawyers handling corporate compliance wanting EPR specialisation',
      'Working professionals (any field) wanting a high-income side skill',
      'EPR freelancers wanting to formalise and scale',
      'Corporate sustainability managers wanting to consult on the side',
    ],
    price: 12999,
    priceLabel: '₹12,999',
    duration: '8 Weeks',
    sessions: 14,
    format: 'Online Live + 2× 1:1 Mentoring',
    level: 'Intermediate to Advanced',
    description: 'The Accelerator is a business-building programme for professionals who want to earn from EPR consulting — whether as a full-time practice or a high-value side income. Goes beyond compliance knowledge to cover client acquisition, pricing strategy, proposal writing, and building a scalable EPR advisory business.',
    whyNow: [
      'EPR compliance mandates are expanding — demand for consultants is outpacing supply',
      'Experienced professionals can charge ₹15,000–₹80,000/month per retainer client',
      'It takes only 3–5 clients to replace a full-time salary',
      'Most businesses struggle to find reliable EPR consultants — you will stand out',
      'Building now means compounding relationships and reputation over 5+ years',
    ],
    curriculum: [
      {
        title: 'Module 1 — EPR Regulations Bootcamp',
        topics: [
          'All major EPR rules: rapid-fire overview with cheatsheets',
          'PWM, E-Waste, Battery, Tyre, Used Oil — key provisions',
          'CPCB portal mastery: registration to annual filing',
          'Target calculation across all categories',
          'Common compliance failures & how consultants add value',
          'Multi-category advisory: managing it all at once',
        ],
      },
      {
        title: 'Module 2 — Service Design',
        topics: [
          'Defining your EPR consulting service menu',
          'One-time services vs recurring retainers',
          'Packaging compliance audits, filings & advisory',
          'Category specialisation vs generalist strategy',
          'White-label services for other consultancies',
          'Digital product opportunities: templates, checklists, courses',
        ],
      },
      {
        title: 'Module 3 — Pricing & Revenue Model',
        topics: [
          'Pricing frameworks: value-based vs cost-plus',
          'Retainer pricing: ₹15,000–₹1,00,000/month bands explained',
          'Project fee benchmarks: gap analysis, filing, audit support',
          'Upsell and cross-sell sequences',
          'Package tiers: starter, standard, premium',
          'Handling price objections from clients',
        ],
      },
      {
        title: 'Module 4 — Client Acquisition',
        topics: [
          'Identifying high-value EPR client segments',
          'Inbound: LinkedIn content, SEO, thought leadership',
          'Outbound: email sequences, WhatsApp outreach, referrals',
          'Using the CEPC directory and Academy network',
          'Converting free workshop attendees to paid clients',
          'Referral partner programmes with lawyers & CAs',
        ],
      },
      {
        title: 'Module 5 — Proposal & Sales',
        topics: [
          'Discovery call framework — what to ask, what to listen for',
          'Proposal structure: executive summary, scope, timeline, fee',
          'Handling objections: price, urgency, existing vendor',
          'Follow-up sequences that close',
          'Contract, NDA and engagement letter templates',
          'Getting a 50% advance upfront — the right way to ask',
        ],
      },
      {
        title: 'Module 6 — Delivery & Client Retention',
        topics: [
          'Onboarding checklist for new EPR clients',
          'Compliance calendar setup & shared tracking',
          'Monthly reporting format: what clients actually want',
          'Handling regulatory surprises & new notifications',
          'Expanding scope: from filing to full advisory',
          'Annual renewal conversations & rate increases',
        ],
      },
      {
        title: 'Module 7 — Scaling Your Practice',
        topics: [
          'When and how to hire your first analyst',
          'SOPs for EPR filings that juniors can execute',
          'Project management tools for compliance teams',
          'Subcontracting EPR work across categories',
          'White-labelling your services to larger consultancies',
          'Building a recognisable EPR brand',
        ],
      },
      {
        title: 'Module 8 — Launch Sprint & Capstone',
        topics: [
          'Capstone: full business plan for your EPR consulting practice',
          '1:1 mentoring session #1 — business plan review with an EPR Compass expert',
          '30-60-90 day launch roadmap',
          'First client outreach sprint (live accountability)',
          '1:1 mentoring session #2 — post-sprint debrief',
          'Certificate of Completion + CEPC pathway',
        ],
      },
    ],
    outcomes: [
      'Design and price a complete EPR consulting service offering',
      'Win your first 3 retainer clients within 60 days',
      'Deliver compliance mandates with systemised SOPs',
      'Build ₹2–5 lakh/month consulting revenue in 6 months',
      'Have a scalable practice ready to grow beyond solo operation',
    ],
    testimonials: [
      { name: 'Deepak Sharma', role: 'Environmental Consultant → EPR Practice Lead', text: 'Added EPR to my consulting practice using this programme. Within 60 days I had 4 new retainer clients paying ₹25K/month each. Best investment of my career.' },
      { name: 'Shalini Mehta', role: 'CA Firm Partner → EPR Advisory Head', text: 'Our firm now offers EPR compliance as a dedicated service line. The accelerator gave us the playbook. Revenue doubled in 4 months.' },
    ],
    faqs: [
      { q: 'Is this for beginners or experienced professionals?', a: 'This is for professionals with at least some compliance, legal or consulting background. If you are starting from zero, see our "Start Your EPR Career" programme first.' },
      { q: 'How much time per week does this require?', a: 'About 6–8 hours per week: 2 live sessions + assignments + client outreach sprint in weeks 6–8.' },
      { q: 'Will I get actual clients from this programme?', a: 'The programme includes a live client outreach sprint in weeks 6–8. Most participants initiate 10–20 conversations and close 1–3 clients during the programme itself.' },
      { q: 'What if I already have a few EPR clients?', a: 'Even better. The systems and pricing strategy modules will help you charge more, retain longer, and scale faster.' },
    ],
    upsells: [
      { label: 'Tier 2 — CEPC Certification (₹5,000)', path: '/academy/login?program=tier-2' },
      { label: 'Tier 3 — EPR Agency Leadership (₹50,000)', path: '/academy/login?program=tier-3' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'corporate-epr-manager',
    title: 'Corporate EPR Manager Fast-Track',
    shortTitle: 'Corporate EPR Manager',
    badge: 'CORPORATE TRACK',
    badgeColor: 'blue',
    icon: '🏢',
    tagline: 'Own EPR compliance end-to-end inside your company — with zero dependence on external consultants',
    targetAudience: 'In-house sustainability, legal, compliance and regulatory affairs managers at corporates',
    audienceProfiles: [
      'Sustainability / ESG managers at manufacturers & importers',
      'Legal and regulatory affairs officers handling compliance',
      'Supply chain managers responsible for EPR certificate procurement',
      'Company secretaries & compliance officers at listed companies',
      'CFOs / COOs at SMEs managing EPR in-house',
    ],
    price: 5999,
    priceLabel: '₹5,999',
    duration: '4 Weeks',
    sessions: 8,
    format: 'Online Live',
    level: 'Intermediate',
    description: 'A focused 4-week programme that equips in-house corporate professionals to manage all EPR obligations independently — from CPCB registration and target setting to annual filing, PRO management and audit readiness. Stop depending entirely on external consultants and build genuine in-house capability.',
    whyNow: [
      'CPCB enforcement is increasing — fines and show-cause notices are up 3× since 2022',
      'External EPR consultants cost ₹2–15 lakh/year — in-house capability pays for itself in Year 1',
      'Board and investor scrutiny of EPR compliance is rising with ESG reporting mandates',
      'EPR non-compliance is now a board-level reputational risk',
      'In-house EPR managers command 30–50% higher salaries than general compliance roles',
    ],
    curriculum: [
      {
        title: 'Module 1 — Your Company\'s EPR Obligations',
        topics: [
          'Mapping your products to applicable EPR rules',
          'Applicability analysis: plastic, e-waste, battery, tyre, used oil',
          'Understanding "producer", "importer", "brand owner" definitions',
          'Historical non-compliance risk assessment',
          'Building your internal EPR compliance task list',
          'Briefing your leadership team on EPR exposure',
        ],
      },
      {
        title: 'Module 2 — CPCB Registration & Declaration',
        topics: [
          'Step-by-step CPCB portal producer registration',
          'Brand and SKU-level product mapping',
          'Annual plastic production / import quantity declaration',
          'Multi-category registration management',
          'Document checklist and file management',
          'Portal troubleshooting and escalation process',
        ],
      },
      {
        title: 'Module 3 — Target Setting & Gap Analysis',
        topics: [
          'EPR target calculation across all applicable categories',
          'Gap analysis: current recycling vs regulatory targets',
          'Multi-year EPR budget planning',
          'EPR credit cost benchmarking',
          'Building a board-ready EPR status dashboard',
          'Presenting EPR compliance risk to leadership',
        ],
      },
      {
        title: 'Module 4 — PRO Management & Credit Procurement',
        topics: [
          'Evaluating and selecting a CPCB-registered PRO',
          'Contract terms, SLAs and performance monitoring',
          'EPR credit price benchmarking and negotiation',
          'Certificate verification and fraud prevention',
          'Multi-PRO strategy for risk diversification',
          'Annual credit budget and reconciliation process',
        ],
      },
      {
        title: 'Module 5 — Annual Filing & Compliance Calendar',
        topics: [
          'Form I filing — category-wise walkthrough',
          'Form II filing — data preparation and submission',
          'Supporting document management system',
          'Annual compliance calendar for all categories',
          'Internal deadline alert system setup',
          'Third-party filing review process',
        ],
      },
      {
        title: 'Module 6 — Audit Readiness & Risk Management',
        topics: [
          'CPCB & State PCB inspection preparation checklist',
          'Document management for EPR audits',
          'Show-cause notice response process',
          'Environmental compensation calculation & challenge',
          'Board EPR reporting template',
          'Director and officer liability management',
        ],
      },
      {
        title: 'Module 7 — ESG & Sustainability Integration',
        topics: [
          'EPR compliance in BRSR (Business Responsibility & Sustainability Report)',
          'EPR metrics for ESG investor questionnaires',
          'Circular economy narrative for annual reports',
          'Aligning EPR data with GRI, SASB standards',
          'Communicating EPR compliance to customers & retailers',
          'EPR as a competitive advantage story',
        ],
      },
      {
        title: 'Module 8 — Assessment & Certification',
        topics: [
          'MCQ assessment (40 questions)',
          'Practical: EPR compliance action plan for your company',
          'Peer review session',
          'Certificate of Completion',
          'CEPC pathway briefing for in-house managers',
        ],
      },
    ],
    outcomes: [
      'Register your company on the CPCB EPR portal independently',
      'Calculate and plan for EPR targets across all applicable categories',
      'Manage PRO relationships and procure EPR credits efficiently',
      'File Form I & Form II annual returns with full confidence',
      'Present EPR compliance status to board and investors',
    ],
    testimonials: [
      { name: 'Ananya Rao', role: 'Sustainability Manager, FMCG Company, Bengaluru', text: 'We were paying ₹8L/year to external consultants for filings we can now do ourselves. ROI on this course was immediate.' },
      { name: 'Vikram Nair', role: 'Company Secretary, Listed Manufacturer', text: 'The board-level reporting module was exactly what I needed. Presented EPR status to our audit committee for the first time this year.' },
    ],
    faqs: [
      { q: 'Is this for a specific waste category or all?', a: 'This programme covers all major EPR categories generically, then focuses deeply on plastic (the most common). You can pair it with category-specific certification courses for deeper expertise.' },
      { q: 'Can multiple team members attend?', a: 'Yes — group enrollment discounts are available. Please use the contact form on our website for team pricing.' },
      { q: 'Will this replace our external EPR consultant?', a: 'For standard compliance, yes. For complex regulatory disputes or multi-category strategy, you may still need specialist support — this programme helps you manage that relationship better.' },
      { q: 'Is this recognised for professional CPD?', a: 'We are working on ICSI and ICAI CPD recognition. Currently, the Certificate of Completion is issued by EPR Compass Academy.' },
    ],
    upsells: [
      { label: 'Plastic EPR — Certification Course (₹2,999)', path: '/trainings/epr-compliance/plastic-epr-certification' },
      { label: 'E-Waste EPR — Certification Course (₹2,999)', path: '/trainings/epr-compliance/ewaste-epr-certification' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'epr-agency-launch',
    title: 'Launch Your EPR Agency — Entrepreneurship Programme',
    shortTitle: 'EPR Agency Launch',
    badge: 'ENTREPRENEURSHIP',
    badgeColor: 'violet',
    icon: '🏛️',
    tagline: 'Build India\'s next leading EPR compliance agency from the ground up',
    targetAudience: 'Aspiring EPR entrepreneurs, experienced consultants ready to build a team, and professionals wanting to start a compliance business',
    audienceProfiles: [
      'Experienced EPR consultants (2+ years) ready to build a team',
      'CEPC graduates wanting to scale beyond solo practice',
      'Environmental engineering entrepreneurs',
      'Business development professionals entering the compliance space',
      'Consulting firm partners adding EPR as a new vertical',
    ],
    price: 24999,
    priceLabel: '₹24,999',
    duration: '12 Weeks',
    sessions: 18,
    format: 'Online Live + 3× 1:1 Mentoring + Cohort',
    level: 'Advanced',
    description: 'The most comprehensive EPR agency-building programme in India. Designed for serious entrepreneurs who want to build a scalable, team-based EPR compliance business — not just freelance on the side. Covers everything from entity setup and service design to team hiring, technology systems, enterprise client acquisition, and growth to ₹1 crore ARR.',
    whyNow: [
      'The Indian EPR compliance market will exceed ₹5,000 crore by 2027',
      'There are fewer than 50 credible EPR compliance agencies in India for 80,000+ regulated entities',
      'Enterprise clients (FMCG, electronics, automotive) pay ₹5–25 lakh/year per agency mandate',
      'EPR rules are expanding to new categories every 18 months — demand is structural, not cyclical',
      'First-mover advantage is still available — the window to build market position is 2025–2027',
    ],
    curriculum: [
      {
        title: 'Month 1: Foundation',
        topics: [
          'Week 1: Agency model design — services, positioning, target clients',
          'Week 2: Entity setup — Pvt Ltd vs LLP vs proprietorship for EPR agencies',
          'Week 3: EPR regulations masterclass — all categories, advanced interpretation',
          'Week 4: Technology stack — CRM, project management, compliance tracking tools',
        ],
      },
      {
        title: 'Month 2: Go-to-Market',
        topics: [
          'Week 5: Ideal client profile — FMCG, electronics, automotive, import businesses',
          'Week 6: Service packaging — starter, standard, enterprise tiers',
          'Week 7: Pricing strategy — retainer bands, project fees, success-based fees',
          'Week 8: Sales system — CRM setup, outreach sequences, proposal templates',
        ],
      },
      {
        title: 'Month 3: Scale',
        topics: [
          'Week 9: Team building — hiring, training and managing EPR analysts',
          'Week 10: Delivery SOPs — systemising filings, audits and client reporting',
          'Week 11: Enterprise clients — winning ₹10L+ annual mandates',
          'Week 12: Growth roadmap, investor readiness & agency valuation',
        ],
      },
    ],
    moduleDetail: [
      {
        title: 'Module 1 — Agency Model & Positioning',
        topics: ['Generalist vs specialist EPR agency', 'Defining your geographic & sector focus', 'Building a differentiated value proposition', 'Competitive landscape analysis', 'Agency name, brand & domain strategy', 'Mission, vision and culture for EPR agencies'],
      },
      {
        title: 'Module 2 — Legal Entity & Compliance Setup',
        topics: ['Pvt Ltd vs LLP for EPR agencies', 'GST registration for consulting businesses', 'Professional indemnity insurance', 'CEPC registration and directory profile', 'NDA and engagement letter templates', 'Intellectual property for compliance firms'],
      },
      {
        title: 'Module 3 — EPR Regulations Advanced Masterclass',
        topics: ['Complex edge cases across all EPR categories', 'Multi-state compliance strategy', 'Regulatory change monitoring system', 'Show-cause notice and enforcement response protocols', 'CPCB vs State PCB jurisdiction management', 'PRO setup as an agency revenue stream'],
      },
      {
        title: 'Module 4 — Technology & Operations',
        topics: ['CRM for EPR agency client management', 'Compliance calendar automation', 'Shared document management system', 'Digital EPR tracking dashboards', 'Client portal setup', 'AI tools for regulatory monitoring'],
      },
      {
        title: 'Module 5 — Service Design & Packaging',
        topics: ['Complete EPR service menu design', 'Productised retainer tiers', 'One-time high-value services: audits, gap analysis', 'White-label services for law firms & CAs', 'Digital products: templates, checklists, reports', 'Subscription model for EPR alerts & updates'],
      },
      {
        title: 'Module 6 — Pricing & Financials',
        topics: ['Value-based pricing methodology', 'Retainer pricing by client size and category complexity', 'Annual revenue modelling: 10 clients to 100 clients', 'Cash flow management for service businesses', 'Invoicing, collection and working capital', 'Agency valuation: EBITDA multiples for compliance firms'],
      },
      {
        title: 'Module 7 — Enterprise Client Acquisition',
        topics: ['Mapping enterprise EPR decision makers', 'RFP response strategy for large mandates', 'Referral channels: Big 4, law firms, trade bodies', 'Partnership with FMCG distributors and dealer networks', 'PR and thought leadership for agency credibility', 'LinkedIn company page and content strategy'],
      },
      {
        title: 'Module 8 — Sales & Proposal Mastery',
        topics: ['Enterprise discovery call framework', 'Multi-stakeholder proposal strategy', 'Board-level EPR risk presentation', 'Pilot mandate as a Trojan horse', 'Negotiating enterprise retainer contracts', 'Getting paid: advance, milestone and retainer structures'],
      },
      {
        title: 'Module 9 — Team Building',
        topics: ['First hire: EPR analyst job description & interview', 'Training juniors on CPCB portal and filing SOPs', 'Compensation benchmarks for EPR professionals', 'Performance metrics for EPR delivery team', 'Building a remote EPR team across India', 'Equity and profit-share for key team members'],
      },
      {
        title: 'Module 10 — Delivery Excellence',
        topics: ['Client onboarding SOP', 'Standard filing workflow: intake to submission', 'Quality check protocol before every filing', 'Client escalation and complaint handling', 'Proactive notification of regulatory changes', 'NPS-driven client satisfaction system'],
      },
      {
        title: 'Module 11 — Growth & Partnerships',
        topics: ['Strategic partnerships: law firms, Big 4, sustainability consultancies', 'Channel partner programme for referrals', 'Geographic expansion: city by city rollout', 'Vertical expansion: new EPR categories as rules evolve', 'Franchise model for EPR agency network', 'M&A: acquiring smaller EPR practices'],
      },
      {
        title: 'Module 12 — Investor Readiness & Exit',
        topics: ['PE / VC interest in compliance services businesses', 'Building a defensible agency: recurring revenue, client lock-in', 'Financial model for investor pitch', '3× 1:1 mentoring sessions with an EPR Compass expert', 'Final capstone: 3-year agency business plan', 'Agency Launch Certificate award'],
      },
    ],
    outcomes: [
      'Launch a legally structured, branded EPR compliance agency',
      'Build a retainer client base generating ₹5–10 lakh/month within 12 months',
      'Hire and manage your first team of EPR analysts',
      'Win enterprise mandates from FMCG, electronics and automotive companies',
      'Have a scalable, systemised business ready for growth beyond ₹1 crore ARR',
    ],
    testimonials: [
      { name: 'Arun Prasad', role: 'Founder, GreenPath EPR Advisors, Hyderabad', text: 'The agency programme gave me a clear blueprint. 12 months after graduating: 22 clients, ₹14L/month revenue, team of 5. This is the real deal.' },
      { name: 'Smitha Reddy', role: 'Co-Founder, CompliancePlus EPR, Chennai', text: 'We were freelancing for 3 years before this programme. Now we have an agency structure, enterprise clients, and a brand. The enterprise sales module alone was worth ₹10× the fee.' },
    ],
    faqs: [
      { q: 'Do I need to already be an EPR consultant to join?', a: 'Ideally yes — 1–2 years of EPR experience or completion of our Tier 2 CEPC programme. If you are newer, complete the Consultant Accelerator first.' },
      { q: 'Is this a cohort-based programme?', a: 'Yes — cohorts of max 15 participants for close mentoring. The cohort network is a major asset — many participants become business partners.' },
      { q: 'Are the 3 mentoring sessions group or individual?', a: '1:1 video calls with an EPR Compass expert — 60 minutes each, scheduled at key milestones in the programme.' },
      { q: 'What revenue can I realistically expect in Year 1?', a: 'Most graduates who execute the programme fully achieve ₹3–10 lakh/month in Year 1. The range depends on your existing network and execution speed.' },
    ],
    upsells: [
      { label: 'Tier 3 — EPR Agency Leadership Programme (₹50,000)', path: '/academy/login?program=tier-3' },
      { label: 'CEPC Directory Listing', path: '/cepc-directory' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'legal-cs-epr',
    title: 'EPR for Legal Professionals & Company Secretaries',
    shortTitle: 'EPR for Legal & CS',
    badge: 'LEGAL TRACK',
    badgeColor: 'rose',
    icon: '⚖️',
    tagline: 'Add high-value EPR compliance advisory to your legal or CS practice',
    targetAudience: 'Lawyers, Advocates, Company Secretaries, and Chartered Accountants advising regulated businesses',
    audienceProfiles: [
      'Advocates practising in environment / corporate law',
      'Company Secretaries at manufacturing & import companies',
      'Chartered Accountants with compliance-heavy client bases',
      'Corporate legal teams handling regulatory matters',
      'Law students & CS students wanting to specialise in EPR',
    ],
    price: 6999,
    priceLabel: '₹6,999',
    duration: '5 Weeks',
    sessions: 8,
    format: 'Online Live',
    level: 'Professional',
    description: 'A specialist programme for legal professionals and company secretaries who advise regulated businesses. Covers EPR obligations as a legal risk, director liability, enforcement action defence, multi-category compliance strategy, and how to add EPR advisory as a billable service to your existing practice.',
    whyNow: [
      'EPR non-compliance exposes directors to personal liability — this is now a legal risk, not just regulatory',
      'NGT, High Courts and CPCB enforcement actions are increasing — legal professionals need EPR literacy',
      'Every corporate client of a CS or CA likely has EPR obligations',
      'EPR advisory commands ₹50,000–₹5,00,000 per engagement for legal professionals',
      'Clients are actively looking for legal advisors who understand EPR',
    ],
    curriculum: [
      {
        title: 'Module 1 — EPR as a Legal Risk',
        topics: [
          'EPR rules as regulatory law: constitutional basis and hierarchy',
          'Director and officer personal liability under EPR rules',
          'Environmental compensation: calculation, challenge and appeal',
          'NGT orders on EPR non-compliance: key case analyses',
          'CPCB enforcement powers: inspection, seizure, show-cause',
          'Criminal liability provisions in waste management rules',
        ],
      },
      {
        title: 'Module 2 — All EPR Rules — Legal Deep-Dive',
        topics: [
          'PWM Rules 2016 & 2022 — legal obligations and penalties',
          'E-Waste Rules 2022 — applicability, targets, enforcement',
          'Battery Waste Rules 2022 — legal provisions for manufacturers',
          'Tyre & Used Oil rules — current legal obligations',
          'Cross-category compliance obligations for multi-product businesses',
          'Draft rules monitoring: how to track and advise on regulatory changes',
        ],
      },
      {
        title: 'Module 3 — Compliance Workflow for CS/Legal',
        topics: [
          'CPCB portal registration and filing process',
          'Preparing clients for EPR compliance: documentation review',
          'PRO agreement legal review: key clauses & risks',
          'EPR credit certificate authentication and fraud prevention',
          'Annual return filing: legal sign-off responsibilities',
          'Board resolution format for EPR compliance authorisation',
        ],
      },
      {
        title: 'Module 4 — Enforcement Defence',
        topics: [
          'Show-cause notice response strategy and timelines',
          'Environmental compensation challenge in appellate proceedings',
          'High Court writ petitions against CPCB orders',
          'CPCB consent for establishment/operation: legal requirements',
          'Preparing clients for inspection and reducing liability',
          'Case studies: successful EPR enforcement defences',
        ],
      },
      {
        title: 'Module 5 — EPR Advisory as a Business',
        topics: [
          'Positioning EPR advisory within your legal/CS practice',
          'Fee structures: compliance review, ongoing advisory, enforcement defence',
          'Identifying EPR-exposed clients in your existing portfolio',
          'Referring to specialist EPR consultants vs doing it in-house',
          'Building a reputation as an EPR-specialist legal professional',
          'Certificate of Completion + CEPC pathway briefing',
        ],
      },
    ],
    outcomes: [
      'Identify EPR legal risks in client companies and advise on mitigation',
      'Review EPR compliance documentation and PRO agreements',
      'Draft show-cause notice responses and represent clients in enforcement proceedings',
      'Advise boards on director liability and corporate EPR governance',
      'Add ₹2–5 lakh/month in EPR advisory fees to your practice',
    ],
    testimonials: [
      { name: 'Adv. Ramesh Kulkarni', role: 'Environmental Law Advocate, High Court', text: 'This programme gave me the technical foundation to advise FMCG clients on EPR compliance. My retainer income from EPR advisory is now ₹1.5L/month.' },
      { name: 'CS Priya Menon', role: 'Company Secretary, Listed Manufacturing Company', text: 'Finally understood EPR as a legal and governance issue, not just a compliance checkbox. The director liability module was eye-opening.' },
    ],
    faqs: [
      { q: 'Do I need to understand CPCB portal operations?', a: 'Basic portal literacy is covered — the focus is on legal strategy, documentation review and enforcement defence rather than hands-on filing.' },
      { q: 'Is this relevant for corporate in-house legal teams?', a: 'Absolutely — especially for companies with plastic packaging, electronics or battery-powered products. EPR is becoming a board-level governance issue.' },
      { q: 'Can CS professionals get CPD credits for this?', a: 'We are in discussions with ICSI for CPD recognition. The certificate from EPR Compass Academy is issued on completion.' },
      { q: 'Are NGT case studies included?', a: 'Yes — Module 4 includes analysis of key NGT and High Court orders on EPR and waste management compliance.' },
    ],
    upsells: [
      { label: 'Plastic EPR — Mastery Course (₹15,000)', path: '/trainings/epr-compliance/plastic-epr-consulting' },
      { label: 'Tier 2 — CEPC Certification (₹5,000)', path: '/academy/login?program=tier-2' },
    ],
  },
];

// Badge color → Tailwind classes
export const BADGE_STYLES = {
  teal:    { bg: 'bg-teal-500',    ring: 'ring-teal-500',    light: 'bg-teal-50 dark:bg-teal-900/20',     text: 'text-teal-600 dark:text-teal-300',    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',    border: 'border-teal-200 dark:border-teal-700' },
  emerald: { bg: 'bg-eco-green-4', ring: 'ring-eco-green-4', light: 'bg-eco-green-4/10',                  text: 'text-eco-green-4',                     badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' },
  indigo:  { bg: 'bg-indigo-600',  ring: 'ring-indigo-500',  light: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-300', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700' },
  blue:    { bg: 'bg-blue-600',    ring: 'ring-blue-500',    light: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600 dark:text-blue-300',    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',    border: 'border-blue-200 dark:border-blue-700' },
  violet:  { bg: 'bg-violet-600',  ring: 'ring-violet-500',  light: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-300', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-700' },
  rose:    { bg: 'bg-rose-600',    ring: 'ring-rose-500',    light: 'bg-rose-50 dark:bg-rose-900/20',     text: 'text-rose-600 dark:text-rose-300',    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',    border: 'border-rose-200 dark:border-rose-700' },
};

export function resolveCareerSlug(slug) {
  return CAREER_PROGRAMMES.find(p => p.id === slug) || null;
}



