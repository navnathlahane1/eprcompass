// Shared data for all 24 recycler business courses (8 categories × 3 types)
// Used by the /trainings listing page and each individual landing page.

export const RECYCLER_CATEGORIES = [
  {
    id: 'plastic',
    label: 'Plastic Recycling',
    tagline: 'Turn plastic waste into profit — legally and at scale',
    color: 'teal',       // maps to eco-green brand
    icon: '♻️',
    regulation: 'Plastic Waste Management (PWM) Rules 2016 & 2022',
    wasteType: 'Plastic Waste',
  },
  {
    id: 'ewaste',
    label: 'E-Waste Recycling',
    tagline: 'Build a compliant e-waste dismantling & refining business',
    color: 'cyan',
    icon: '💻',
    regulation: 'E-Waste (Management) Rules 2022',
    wasteType: 'E-Waste',
  },
  {
    id: 'battery',
    label: 'Battery Waste Recycling',
    tagline: 'Tap into the booming battery recycling economy',
    color: 'amber',
    icon: '🔋',
    regulation: 'Battery Waste Management Rules 2022',
    wasteType: 'Battery Waste',
  },
  {
    id: 'tyre',
    label: 'Tyre Waste Recycling',
    tagline: 'Pyrolysis, crumb rubber & EPR compliance for tyre recyclers',
    color: 'orange',
    icon: '🔄',
    regulation: 'Hazardous & Other Wastes Rules / CPCB Guidelines',
    wasteType: 'Tyre Waste',
  },
  {
    id: 'elv',
    label: 'ELV Recycling',
    tagline: 'Set up & scale an Authorised Vehicle Scrapping Facility',
    color: 'rose',
    icon: '🚗',
    regulation: 'Vehicle Scrapping Policy / MoRTH AVSF Guidelines',
    wasteType: 'End-of-Life Vehicles (ELV)',
  },
  {
    id: 'usedoil',
    label: 'Used Oil Recycling',
    tagline: 'Collect, re-refine and sell used oil profitably',
    color: 'yellow',
    icon: '🛢️',
    regulation: 'Hazardous Waste Rules / CPCB Used Oil Guidelines',
    wasteType: 'Used Oil',
  },
  {
    id: 'cdwaste',
    label: 'Construction & Demolition Recycling',
    tagline: 'Turn C&D debris into certified recycled aggregates',
    color: 'lime',
    icon: '🏗️',
    regulation: 'Construction & Demolition Waste Management Rules 2016',
    wasteType: 'C&D Waste',
  },
  {
    id: 'nonferrous',
    label: 'Non-Ferrous Materials Recycling',
    tagline: 'Aluminium, copper & zinc scrap — smelting to export',
    color: 'violet',
    icon: '⚙️',
    regulation: 'Hazardous & Other Wastes (M&TBM) Rules / LME Standards',
    wasteType: 'Non-Ferrous Scrap',
  },
];

export const COURSE_TYPES = [
  {
    type: 'Workshop',
    level: 'Beginner',
    tagline: 'Awareness & orientation — free to attend',
    price: 0,
    priceLabel: 'Free',
    duration: '1 Day',
    sessions: 2,
    format: 'Online Live',
    badge: 'FREE',
    badgeColor: 'emerald',
    description: 'A focused awareness workshop covering how to launch, run and scale a recycling business in this category — regulatory overview, unit economics, licences and EPR compliance basics.',
    includes: [
      'Live online sessions (recorded access for 7 days)',
      'Introductory slides deck & reference PDF',
      'Q&A with an EPR Compass expert',
      'Certificate of participation',
    ],
  },
  {
    type: 'Certification',
    level: 'Intermediate',
    tagline: 'In-depth certification — build real skills',
    price: 4999,
    priceLabel: '₹4,999',
    duration: '4 Weeks',
    sessions: 8,
    format: 'Online Live',
    badge: 'CERTIFICATION',
    badgeColor: 'amber',
    description: 'A rigorous 8-session certification course covering end-to-end business operations: launching your unit, running day-to-day processes with quality control, and scaling through EPR compliance and supply chain optimisation.',
    includes: [
      '8 live sessions (recorded, lifetime access)',
      'Detailed module workbook & templates',
      'Facility setup checklists & compliance tracker',
      'MCQ assessment + practical assignment',
      'Printed certificate of completion',
      'Private learner community access',
    ],
  },
  {
    type: 'Mastery',
    level: 'Advanced',
    tagline: 'Consulting-level mastery — scale & lead',
    price: 14999,
    priceLabel: '₹14,999',
    duration: '8 Weeks',
    sessions: 12,
    format: 'Online Live + 1:1 Mentoring',
    badge: 'MASTERY',
    badgeColor: 'violet',
    description: 'Advanced consulting-level programme covering large-scale expansion, PRO partnerships, bulk contracts, export documentation, and building a consulting practice around this recycling category.',
    includes: [
      '12 live sessions (recorded, lifetime access)',
      'Advanced case studies & financial models',
      '2 live 1:1 mentoring sessions with an EPR Compass expert',
      'Capstone project with detailed feedback',
      'Agency-grade compliance & pitch templates',
      'Certificate of Mastery + CEPC pathway',
      'Priority Slack support for 90 days',
    ],
  },
];

// Per-category, per-type curriculum (Launch → Run → Scale stages inside each course)
export const COURSE_CURRICULUM = {
  plastic: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['PWM Rules 2016 & 2022 applicability', 'CPCB & State PCB consents', 'Machinery & land requirements', 'EPR registration basics'] },
        { title: 'Module 2 — Run & Scale', topics: ['Daily operations & quality control', 'MRF management & SOP overview', 'EPR credits & PRO partnerships', 'Scaling to multi-polymer recovery'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Regulatory Framework', topics: ['PWM Rules deep-dive', 'CPCB portal registration walkthrough', 'Consent to Establish & Operate', 'EPR registration for recyclers'] },
        { title: 'Module 2 — Unit Launch', topics: ['Site selection & infrastructure', 'Machinery specs: shredder, pelletiser, extruder', 'Capex & Opex financial planning', 'Hiring & SOP creation'] },
        { title: 'Module 3 — Running Operations', topics: ['Feedstock procurement & aggregator networks', 'Quality testing: MFI, colour, contamination', 'Waste tracking & digital manifests', 'Annual returns & EPR target compliance'] },
        { title: 'Module 4 — Scale & Grow', topics: ['PRO agreements & credit trading', 'Export-grade polymer production', 'Multi-location expansion framework', 'Working capital & MSME loan schemes'] },
        { title: 'Module 5 — Business & Finance', topics: ['Revenue models: pellet sales, EPR credit revenue', 'GST on recycled goods', 'Government subsidies & incentives', 'Break-even & ROI analysis'] },
        { title: 'Module 6 — Compliance & Audit', topics: ['Annual EPR returns filing', 'CPCB inspection readiness', 'Third-party audit preparation', 'Common non-compliance & remediation'] },
        { title: 'Module 7 — Case Studies', topics: ['Successful plastic recyclers in India', 'Common startup mistakes', 'Financial modelling exercise', 'Live Q&A with practitioners'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment (50 questions)', 'Practical assignment: business plan draft', 'Peer review session', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Regulatory Strategy', topics: ['Multi-category EPR alignment', 'Regulatory lobbying & advocacy', 'State-specific compliance nuances', 'Handling CPCB show-cause notices'] },
        { title: 'Module 2 — Large-Scale Unit Design', topics: ['Industrial-scale plant layout', 'Automated sorting lines & IoT sensors', 'EHS management systems', 'ISO 14001 & green building norms'] },
        { title: 'Module 3 — Supply Chain Mastery', topics: ['National aggregator network creation', 'Digital waste tracking platforms', 'Reverse logistics optimisation', 'Feedstock pricing strategy'] },
        { title: 'Module 4 — PRO Business Building', topics: ['Becoming a registered PRO', 'Onboarding brand owner clients', 'EPR credit pricing & trading desk', 'PRO compliance & reporting'] },
        { title: 'Module 5 — Export Markets', topics: ['Export-grade rPET, rHDPE standards', 'BIS certification for recycled plastics', 'Buyer identification & RFQ process', 'DGFT, FSSAI & customs documentation'] },
        { title: 'Module 6 — Financial Engineering', topics: ['Institutional funding: SIDBI, NABARD', 'Green bond & ESG financing', 'Joint venture structuring', 'PE/VC pitch deck for recyclers'] },
        { title: 'Module 7 — Consulting Practice', topics: ['EPR consulting service design', 'Proposal templates for recycler clients', 'SLA, billing & retainer models', 'Building a team of EPR analysts'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Capstone project: full business plan', '1:1 review with an EPR Compass expert', 'Peer presentations', 'Investor-readiness feedback'] },
        { title: 'Module 9 — Scale Operations', topics: ['Multi-plant management systems', 'ERP & WMS implementation', 'Key performance indicators', 'HR & compliance for large teams'] },
        { title: 'Module 10 — Policy & Advocacy', topics: ['Circular economy policy landscape', 'Industry association membership', 'White paper writing for credibility', 'Media & PR for recyclers'] },
        { title: 'Module 11 — Advanced Case Studies', topics: ['Global recycling unicorns', 'India\'s top recycling businesses', 'M&A in recycling sector', 'Exit strategy frameworks'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Final capstone submission', '1:1 exit review session', 'CEPC pathway briefing', 'Mastery certificate award'] },
      ],
    },
  },

  ewaste: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['E-Waste Rules 2022 applicability', 'CPCB authorisation process', 'Dismantling facility requirements', 'EPR registration for recyclers'] },
        { title: 'Module 2 — Run & Scale', topics: ['Material flow & data-destruction', 'Channel partner & bulk collector networks', 'PRO tie-ups & OEM scrapping', 'Precious metal refining pathways'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — E-Waste Regulatory Framework', topics: ['E-Waste Rules 2022 deep-dive', 'CPCB portal registration', 'State PCB authorisation', 'Categories & sub-categories (ITEW, CEEW, etc.)'] },
        { title: 'Module 2 — Facility Launch', topics: ['Site layout: reception, dismantling, storage', 'Machinery: de-soldering, shredder, separator', 'EHS safeguards for hazardous materials', 'Capex planning & MSME loan guide'] },
        { title: 'Module 3 — Dismantling Operations', topics: ['Manual vs automated dismantling', 'Component segregation SOPs', 'Data destruction: NIST standards', 'Waste manifest & tracking systems'] },
        { title: 'Module 4 — Material Recovery', topics: ['PCB refining & precious metal extraction', 'Plastic from e-waste: re-pelletising', 'Glass & CRT handling compliance', 'Downstream processor partnerships'] },
        { title: 'Module 5 — EPR Compliance', topics: ['Producer EPR targets & your role', 'EPR credit generation & reporting', 'Annual return filing', 'Third-party audit preparation'] },
        { title: 'Module 6 — Business Growth', topics: ['Bulk collector & channel partner onboarding', 'Corporate buyback programs', 'OEM scrapping contracts', 'Revenue: scrap sales + EPR credits'] },
        { title: 'Module 7 — Case Studies', topics: ['India\'s leading e-waste recyclers', 'Common compliance failures', 'Financial model walkthrough', 'Live practitioner Q&A'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment (50 questions)', 'Practical: facility audit checklist', 'Peer review session', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Regulatory Strategy', topics: ['Multi-state authorisation management', 'Extended producer responsibility deep-dive', 'Handling CPCB enforcement', 'Cross-border e-waste trade rules'] },
        { title: 'Module 2 — Automated Plant Design', topics: ['Conveyor & robotic dismantling lines', 'Sensor-based sorting systems', 'High-value metal recovery design', 'Digital twin for plant optimisation'] },
        { title: 'Module 3 — Data Security Business', topics: ['Certified data destruction service launch', 'R2 / e-Stewards certification pathway', 'Enterprise IT asset disposition (ITAD) contracts', 'SLA & liability framework'] },
        { title: 'Module 4 — PRO & OEM Partnerships', topics: ['Becoming a registered PRO', 'OEM scrapping programme design', 'Bulk buyback pricing models', 'EPR credit desk operations'] },
        { title: 'Module 5 — Precious Metal Refining', topics: ['Gold, silver, palladium extraction', 'Hydrometallurgy vs pyrometallurgy', 'Refinery partnerships & offtake', 'Export documentation for refined metals'] },
        { title: 'Module 6 — Financial Engineering', topics: ['Green financing for e-waste plants', 'ESG reporting for investors', 'JV with global refining companies', 'Valuation models for recycling businesses'] },
        { title: 'Module 7 — Consulting Practice', topics: ['E-waste EPR consulting services', 'Client proposal & pricing', 'Building a compliance team', 'Retainer model for corporate clients'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Full business plan presentation', '1:1 review session', 'Investor pitch prep', 'Feedback & iteration'] },
        { title: 'Module 9 — Multi-Site Operations', topics: ['Hub-and-spoke collection network', 'Multi-plant ERP systems', 'KPI dashboard design', 'Quality management across sites'] },
        { title: 'Module 10 — Global Standards', topics: ['R2v3 certification process', 'ISO 45001 health & safety', 'Basel Convention compliance', 'International buyer qualifications'] },
        { title: 'Module 11 — Advanced Case Studies', topics: ['Attero, Sims, ERI case analyses', 'Acquisitions in e-waste sector', 'Going from SME to enterprise', 'Exit & succession planning'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone final submission', '1:1 exit mentoring with an EPR Compass expert', 'CEPC pathway briefing', 'Mastery certificate award'] },
      ],
    },
  },

  battery: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['Battery Waste Management Rules 2022', 'CPCB authorisation requirements', 'Lead-acid vs Li-ion unit differences', 'EPR registration basics'] },
        { title: 'Module 2 — Run & Scale', topics: ['Safe handling & hydromet processing', 'Compliance reporting framework', 'OEM battery-return programmes', 'Global battery material markets'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Battery Waste Regulatory Framework', topics: ['Battery Waste Management Rules 2022', 'CPCB portal & State PCB authorisation', 'Lead-acid vs Li-ion regulations', 'EPR targets for battery producers'] },
        { title: 'Module 2 — Facility Setup', topics: ['Site requirements: acid-proof flooring, ventilation', 'Machinery: crusher, smelter, hydromet line', 'EHS & fire safety for Li-ion', 'Capex modelling & land selection'] },
        { title: 'Module 3 — Lead-Acid Battery Recycling', topics: ['Collection, breaking & draining SOPs', 'Lead smelting & refining operations', 'Sulphuric acid recovery & re-use', 'Polypropylene case recycling'] },
        { title: 'Module 4 — Li-Ion Battery Processing', topics: ['Safe discharge & dismantling protocols', 'Black mass production & composition', 'Hydrometallurgical recovery: Li, Co, Ni, Mn', 'Downstream battery material sales'] },
        { title: 'Module 5 — EPR Compliance', topics: ['Battery EPR target calculation', 'Credit generation & portal reporting', 'Annual returns filing', 'Audit preparation'] },
        { title: 'Module 6 — Business Development', topics: ['OEM take-back programme onboarding', 'BESS refurbishment service launch', 'Revenue: secondary lead + black mass', 'Working capital for battery recyclers'] },
        { title: 'Module 7 — Case Studies', topics: ['Gravita India, Lohum Cleantech analysis', 'Common compliance failures', 'Financial model walkthrough', 'Live Q&A'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Practical: compliance calendar creation', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Policy', topics: ['Battery Waste Rules advanced interpretation', 'Customs & hazardous waste import/export', 'Multi-state authorisation strategy', 'CPCB enforcement response'] },
        { title: 'Module 2 — Large-Scale Hydromet Plant', topics: ['Industrial hydromet process design', 'Reagent procurement & cost control', 'Continuous vs batch processing', 'Water treatment & ZLD systems'] },
        { title: 'Module 3 — Li-Ion Scale-Up', topics: ['Black mass refining to battery-grade material', 'Cathode material production', 'Second-life battery business model', 'Cell testing & grading'] },
        { title: 'Module 4 — OEM & EV Sector Partnerships', topics: ['EV OEM scrapping contract design', 'Battery passport & digital traceability', 'Cell-to-pack refurbishment for ESS', 'Fleet battery management partnerships'] },
        { title: 'Module 5 — Export & Global Markets', topics: ['Battery material export documentation', 'LME cobalt/lithium pricing', 'Offtake agreements with battery makers', 'Commodity hedging basics'] },
        { title: 'Module 6 — Financial Engineering', topics: ['Green financing: battery recycling funds', 'ESG reporting for Li-ion recyclers', 'PE/VC valuation of battery recyclers', 'Project finance for large plants'] },
        { title: 'Module 7 — Consulting Practice', topics: ['Battery recycler consulting services', 'Compliance advisory for EV companies', 'Policy briefings & white papers', 'Retainer pricing for OEM clients'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Business plan deep-dive', '1:1 session with an EPR Compass expert', 'Investor pitch iteration'] },
        { title: 'Module 9 — Multi-Chemistry Operations', topics: ['Managing lead-acid + Li-ion + NiMH simultaneously', 'Cross-chemistry contamination prevention', 'Multi-site material accounting', 'Digital mass-balance systems'] },
        { title: 'Module 10 — Innovation & R&D', topics: ['Direct recycling techniques', 'AI-based battery health grading', 'Collaboration with IITs & NREIs', 'IP filing for recycling innovations'] },
        { title: 'Module 11 — Advanced Case Studies', topics: ['Lohum, Attero, Li-Cycle global analysis', 'Mergers in battery recycling', 'Going from pilot to industrial scale', 'Exit strategy frameworks'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Final capstone submission', '1:1 exit review', 'Mastery certificate award'] },
      ],
    },
  },

  tyre: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['Tyre waste rules & CPCB clearances', 'Pyrolysis vs crumb rubber: choose your path', 'Land, machinery & investment overview', 'EPR registration for tyre recyclers'] },
        { title: 'Module 2 — Run & Scale', topics: ['Feedstock aggregation strategies', 'Process optimisation & yield improvement', 'End-product markets: carbon black, oil, steel', 'Scaling to industrial pyrolysis parks'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Regulatory Framework', topics: ['Hazardous waste rules for tyre recyclers', 'CPCB & State PCB authorisation', 'EPR rules for tyre producers (upcoming)', 'Environmental clearance process'] },
        { title: 'Module 2 — Pyrolysis Unit Setup', topics: ['Batch vs continuous pyrolysis reactors', 'Site layout & fire safety', 'Machinery vendors & CAPEX planning', 'Utility requirements: power, water, fuel'] },
        { title: 'Module 3 — Crumb Rubber Unit Setup', topics: ['Ambient vs cryogenic grinding', 'Granule size & mesh specifications', 'Rubber powder applications', 'Quality testing standards'] },
        { title: 'Module 4 — Operations Management', topics: ['Feedstock sourcing: scrap dealers, fleets, OEMs', 'Pre-processing: bead wire removal, shredding', 'Pyrolysis yield optimisation', 'Emission monitoring & compliance'] },
        { title: 'Module 5 — Product Sales', topics: ['Pyrolysis oil: pricing & buyers', 'Carbon black: N330 upgrade pathway', 'Steel wire: scrap dealer agreements', 'Crumb rubber: sports fields, roads, tiles'] },
        { title: 'Module 6 — Business Finance', topics: ['Revenue model: pyrolysis vs crumb rubber', 'Break-even analysis', 'MSME & SIDBI loan schemes', 'Working capital management'] },
        { title: 'Module 7 — Case Studies', topics: ['Successful tyre recyclers in India', 'Common regulatory pitfalls', 'Financial model walkthrough', 'Live Q&A'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Practical: business plan outline', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Policy', topics: ['Upcoming tyre EPR framework', 'Multi-state CPCB authorisation', 'Handling enforcement actions', 'Policy advocacy for recyclers'] },
        { title: 'Module 2 — Continuous Pyrolysis at Scale', topics: ['Industrial continuous reactor design', 'Catalyst-assisted pyrolysis', 'Carbon black purification & N330 grading', 'Fuel oil certification & custom blending'] },
        { title: 'Module 3 — Carbon Black Upgrading', topics: ['Activated carbon production from CB', 'Market for N220/N330 substitute CB', 'CB pelletising for rubber compounders', 'BIS certification for rCB'] },
        { title: 'Module 4 — Industrial Crumb Rubber', topics: ['Large-scale crumb rubber park design', 'Rubberised asphalt tenders', 'Sports turf & athletic track supply', 'Acoustic panel & automotive NVH parts'] },
        { title: 'Module 5 — Export & Industrial Offtake', topics: ['Export documentation for pyrolysis oil', 'Carbon black offtake agreements', 'International crumb rubber standards', 'Commodity pricing & hedging'] },
        { title: 'Module 6 — Financial Engineering', topics: ['Project finance for pyrolysis parks', 'Green bonds for tyre recyclers', 'PE/VC landscape', 'Valuation frameworks'] },
        { title: 'Module 7 — Consulting Practice', topics: ['Tyre recycler advisory services', 'Feasibility study templates', 'Regulatory clearance consulting', 'Client SLA & billing models'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Business plan review', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — Park Development', topics: ['Cluster-based tyre recycling parks', 'Anchor tenant model', 'Common infrastructure design', 'DPIIT recognition for parks'] },
        { title: 'Module 10 — Innovation', topics: ['Devulcanisation R&D', 'Microwave pyrolysis', 'Blockchain traceability for feedstock', 'Collaboration with automotive OEMs'] },
        { title: 'Module 11 — Case Studies', topics: ['Global tyre recycling leaders', 'India\'s pyrolysis industry landscape', 'M&A in waste processing', 'Exit planning'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit mentoring', 'Mastery certificate award'] },
      ],
    },
  },

  elv: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['Vehicle Scrapping Policy 2021', 'AVSF license & RVSF registration', 'Site, equipment & investment overview', 'VAHAN portal integration basics'] },
        { title: 'Module 2 — Run & Scale', topics: ['Depollution SOPs & parts cataloguing', 'Fleet scrapping & OEM buyback', 'Component resale marketplace', 'Multi-AVSF chain development'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — ELV Regulatory Framework', topics: ['Vehicle Scrapping Policy 2021 & MoRTH guidelines', 'AVSF vs RVSF distinction', 'VAHAN portal registration', 'State transport department approvals'] },
        { title: 'Module 2 — AVSF Setup', topics: ['Site area: minimum 1 acre norm', 'Depollution bay design', 'Crushing & shredding equipment', 'ETP & oil traps for depollution fluids'] },
        { title: 'Module 3 — Depollution Operations', topics: ['Fluid removal: fuel, oil, coolant, brake fluid', 'Battery & tyre removal workflow', 'Airbag neutralisation safety', 'Hazardous waste manifest generation'] },
        { title: 'Module 4 — Parts Cataloguing & Resale', topics: ['Part grading & QC standards', 'Resale channels: OEM, aftermarket, exports', 'ERP for parts inventory', 'Warranty & liability management'] },
        { title: 'Module 5 — Scrap Material Flows', topics: ['Ferrous scrap routing to smelters', 'Non-ferrous recovery: Al, Cu, Pb', 'Glass & plastic sorting for recyclers', 'Revenue per vehicle model'] },
        { title: 'Module 6 — VAHAN Integration', topics: ['Registration cancellation workflow', 'VAHAN scrap certificate generation', 'GST on scrap sales', 'Annual returns & reporting'] },
        { title: 'Module 7 — Business & Finance', topics: ['Revenue: scrap + parts + government scrapping incentives', 'Working capital & vehicle procurement', 'OEM fleet scrapping contracts', 'Break-even analysis per vehicle type'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Practical: AVSF compliance checklist', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Policy', topics: ['Multi-state AVSF licensing strategy', 'Upcoming ELV EPR framework', 'OEM scrapping mandate compliance', 'FAME & EV scrap policy implications'] },
        { title: 'Module 2 — Large-Scale Shredder Facility', topics: ['Auto shredder residue (ASR) management', 'Eddy current & air separation systems', 'Downstream ASR valorisation', 'Shredder line CAPEX & ROI'] },
        { title: 'Module 3 — OEM & Fleet Partnerships', topics: ['OEM scrapping programme design', 'Fleet operator annual contracts', 'White-label AVSF for OEM brands', 'Royalty & revenue-sharing models'] },
        { title: 'Module 4 — Parts Marketplace Platform', topics: ['Digital parts catalogue launch', 'B2B marketplace for tested auto parts', 'API integration with Droom, OLX Autos', 'Warranty-backed parts business'] },
        { title: 'Module 5 — Multi-AVSF Chain', topics: ['Hub-and-spoke AVSF network design', 'Central processing vs distributed model', 'Franchise AVSF model', 'Multi-site VAHAN reporting'] },
        { title: 'Module 6 — EV Scrap Strategy', topics: ['EV battery handling at AVSF', 'EV motor & electronics resale', 'Battery-to-BESS second life', 'Preparing AVSF for 2030 EV wave'] },
        { title: 'Module 7 — Financial Engineering', topics: ['PE/VC interest in auto recycling', 'Project finance for shredder lines', 'ESG reporting for ELV recyclers', 'JV with global auto recycling chains'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Business plan deep-dive', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — Export & International Standards', topics: ['Export of used auto parts & scrap', 'ISRI standards for shredded scrap', 'Japan & EU import requirements', 'Trade finance for auto scrap exporters'] },
        { title: 'Module 10 — Innovation & Technology', topics: ['AI-based vehicle valuation at gate', 'Robotic depollution systems', 'Blockchain vehicle history integration', 'AVSF digital twin'] },
        { title: 'Module 11 — Case Studies', topics: ['CERO (Mahindra), Maruti True Value Scrap', 'Global auto recycling leaders', 'M&A landscape in vehicle recycling', 'Exit strategy frameworks'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit mentoring', 'Mastery certificate award'] },
      ],
    },
  },

  usedoil: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['Used oil rules & CPCB consent', 'Collection infrastructure basics', 'Re-refining vs blending: choose your model', 'EPR compliance overview'] },
        { title: 'Module 2 — Run & Scale', topics: ['Collection logistics optimisation', 'Base oil quality certification', 'Bulk industrial supply contracts', 'Export channel development'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Regulatory Framework', topics: ['Hazardous Waste Rules for used oil', 'CPCB Consent to Establish & Operate', 'State PCB authorisation', 'Environmental compliance calendar'] },
        { title: 'Module 2 — Collection Infrastructure', topics: ['Collection centre network design', 'Drum management & transport safety', 'GPS tracking for collection vehicles', 'Collector agreements & pricing'] },
        { title: 'Module 3 — Re-Refining Operations', topics: ['Vacuum distillation process', 'Hydrotreatment & finishing', 'Base oil grades: Group I/II production', 'BIS specification compliance'] },
        { title: 'Module 4 — Quality & Certification', topics: ['API & BIS certification process', 'Quality testing lab setup', 'Third-party testing protocols', 'Product liability & warranty'] },
        { title: 'Module 5 — Sales & Distribution', topics: ['Industrial lubricant buyers', 'Transformer oil resale', 'Fuel oil compliance & sales', 'Blending for automotive lubricants'] },
        { title: 'Module 6 — Business Finance', topics: ['Revenue model: base oil + fuel oil', 'Collection cost management', 'Working capital for used oil recyclers', 'MSME schemes for re-refiners'] },
        { title: 'Module 7 — Case Studies', topics: ['CEMCO, CleanEarth Oil analysis', 'Common regulatory pitfalls', 'Financial model walkthrough', 'Live Q&A'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Practical: compliance calendar creation', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Policy', topics: ['Multi-state authorisation management', 'Upcoming used oil EPR framework', 'Handling CPCB enforcement', 'Cross-state waste transport permits'] },
        { title: 'Module 2 — Industrial-Scale Re-Refinery', topics: ['Continuous vacuum distillation design', 'Solvent extraction alternatives', 'Catalytic hydrotreatment', 'Emission control systems'] },
        { title: 'Module 3 — Group II/III Base Oil Production', topics: ['Hydrocracking for Group II/III', 'Additive package sourcing', 'API certification process', 'Premium lubricant brand launch'] },
        { title: 'Module 4 — Bulk Industrial Contracts', topics: ['Steel plant & power station contracts', 'Transformer oil supply agreements', 'Long-term offtake pricing', 'Invoice discounting & trade credit'] },
        { title: 'Module 5 — Export Markets', topics: ['Base oil export documentation', 'Middle East & Africa market entry', 'ASTM/ISO specification compliance', 'International freight & insurance'] },
        { title: 'Module 6 — Financial Engineering', topics: ['Project finance for re-refineries', 'ESG impact metrics for used oil', 'PE/VC interest in lube recyclers', 'JV with lubricant brands'] },
        { title: 'Module 7 — Consulting Practice', topics: ['Used oil compliance advisory', 'Collection programme design for corporates', 'Regulatory briefings for lube companies', 'Retainer pricing models'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Business plan review', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — National Collection Network', topics: ['Franchise collection model', 'Digital oil tracking platform', 'Reverse logistics partnerships', 'National route optimisation'] },
        { title: 'Module 10 — Innovation', topics: ['Bioremediation for waste oil spills', 'Used oil-to-biodiesel research', 'AI-based oil quality prediction', 'Waste oil tracking blockchain'] },
        { title: 'Module 11 — Case Studies', topics: ['Veolia, Clean Harbors global analysis', 'India\'s re-refining sector landscape', 'Growth strategies for used oil recyclers', 'Exit planning'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit mentoring', 'Mastery certificate award'] },
      ],
    },
  },

  cdwaste: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['C&D Waste Management Rules 2016', 'MoEFCC & State PCB clearances', 'Processing plant types & investment', 'Urban local body (ULB) tenders'] },
        { title: 'Module 2 — Run & Scale', topics: ['Crushing, segregation & RCA production', 'Green building material supply chain', 'City-level contracts & RERA compliance', 'Urban circular material hub model'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Regulatory Framework', topics: ['C&D Waste Management Rules 2016', 'State-level C&D policies', 'Environmental clearance process', 'Urban local body mandates'] },
        { title: 'Module 2 — Processing Plant Setup', topics: ['Site selection: near waste-generation zones', 'Mobile vs stationary crushing plant', 'CAPEX comparison: small/medium/large', 'Utility requirements'] },
        { title: 'Module 3 — Processing Operations', topics: ['Waste reception & visual sorting', 'Jaw crusher & cone crusher operations', 'Vibrating screen & air classifier', 'Dust suppression systems'] },
        { title: 'Module 4 — Product Quality', topics: ['Recycled Concrete Aggregate (RCA) grades', 'BIS 16349 standard compliance', 'Quality testing: flakiness, crushing value', 'Third-party testing lab partnerships'] },
        { title: 'Module 5 — Market Development', topics: ['Road sub-base & backfill sales', 'Precast block manufacturer supply', 'Green building rating (GRIHA, LEED) credits', 'Government infrastructure project supply'] },
        { title: 'Module 6 — Business Finance', topics: ['Revenue: gate fee + material sales', 'ULB tipping fee models', 'CAPEX & OPEX analysis', 'Government grants for C&D processing'] },
        { title: 'Module 7 — Case Studies', topics: ['Delhi, Pune, Ahmedabad C&D plants', 'Common operational challenges', 'Financial model walkthrough', 'Live Q&A'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Practical: project proposal draft', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Policy', topics: ['Upcoming C&D EPR framework', 'State-specific by-laws & mandates', 'Smart city C&D integration', 'Lobbying for RCA specification inclusion'] },
        { title: 'Module 2 — Large-Scale Plant Design', topics: ['Industrial C&D processing line', 'Wet processing for high-quality RCA', 'Automated sorting with AI vision systems', 'Zero-waste C&D facility design'] },
        { title: 'Module 3 — RCA Specification Approval', topics: ['IS code revision advocacy', 'Pilot project with CPWD/NHAI', 'Third-party testing & certification', 'RCA approval for load-bearing applications'] },
        { title: 'Module 4 — City-Level Contracts', topics: ['Municipal tender design & bidding', 'BOT model for C&D facilities', 'Long-term ULB agreements', 'Performance guarantees & penalties'] },
        { title: 'Module 5 — High-Value Products', topics: ['Precast RCA panels & blocks', 'Aggregate for concrete (M30+)', 'Fine aggregate for plastering', 'Geotechnical fill applications'] },
        { title: 'Module 6 — Financial Engineering', topics: ['Infrastructure project finance', 'Viability gap funding (VGF)', 'Green bond for C&D recycling', 'PE/VC in solid waste management'] },
        { title: 'Module 7 — Consulting Practice', topics: ['C&D compliance advisory for developers', 'RERA C&D waste plan preparation', 'Feasibility studies for ULBs', 'Training urban contractors'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Business plan deep-dive', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — Urban Circular Economy Hub', topics: ['Multi-waste urban hub design', 'Co-location with plastic/tyre recyclers', 'Common utilities sharing', 'SEZ/EPZ status for recycling hubs'] },
        { title: 'Module 10 — Innovation', topics: ['Concrete recycling in 3D printing', 'Self-healing concrete from RCA', 'Carbon capture in concrete recycling', 'Smart aggregate tracking'] },
        { title: 'Module 11 — Case Studies', topics: ['Global C&D recycling leaders', 'India\'s C&D processing industry', 'M&A in solid waste management', 'Exit strategy frameworks'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit mentoring', 'Mastery certificate award'] },
      ],
    },
  },

  nonferrous: {
    Workshop: {
      modules: [
        { title: 'Module 1 — Launch', topics: ['Hazardous waste rules for non-ferrous recyclers', 'CPCB authorisation process', 'Metal types: Al, Cu, Zn, Pb, Ni', 'Unit investment & machinery overview'] },
        { title: 'Module 2 — Run & Scale', topics: ['Smelting operations & alloy grading', 'LME pricing & margin management', 'Export documentation basics', 'Scaling to secondary smelter cluster'] },
      ],
    },
    Certification: {
      modules: [
        { title: 'Module 1 — Regulatory Framework', topics: ['Hazardous & Other Wastes Rules', 'CPCB authorisation for smelters', 'State PCB clearance process', 'BIS standards for secondary metals'] },
        { title: 'Module 2 — Facility Setup', topics: ['Induction furnace vs reverberatory furnace', 'Site layout: scrap yard, furnace bay, casting area', 'CAPEX planning by metal type', 'Emission control: baghouse, scrubber'] },
        { title: 'Module 3 — Scrap Procurement', topics: ['Scrap grades & pricing (ISRI codes)', 'Sourcing: scrap dealers, auto shredders, IHMDs', 'Import scrap: Customs & BWT procedure', 'Digital scrap procurement platforms'] },
        { title: 'Module 4 — Smelting Operations', topics: ['Aluminium smelting & dross management', 'Copper smelting & rod casting', 'Zinc recovery from galvanising dross', 'Alloy formulation & quality control'] },
        { title: 'Module 5 — Metal Sales', topics: ['Domestic foundry & die-caster supply', 'Continuous cast rod supply to cable makers', 'Alloy billet for automotive sector', 'LME-linked pricing & hedging'] },
        { title: 'Module 6 — Business Finance', topics: ['Revenue model by metal type', 'Working capital: scrap advance payments', 'Letter of credit & trade finance', 'MSME & SIDBI schemes'] },
        { title: 'Module 7 — Case Studies', topics: ['Hindalco Novelis, Nyrstar case analyses', 'SME non-ferrous recyclers in India', 'Financial model walkthrough', 'Live Q&A'] },
        { title: 'Module 8 — Assessment & Certification', topics: ['MCQ assessment', 'Practical: procurement & pricing exercise', 'Certificate award'] },
      ],
    },
    Mastery: {
      modules: [
        { title: 'Module 1 — Advanced Policy', topics: ['Multi-metal regulatory management', 'Upcoming non-ferrous EPR framework', 'Customs & import scrap procedures', 'CPCB enforcement for smelters'] },
        { title: 'Module 2 — Secondary Smelter Design', topics: ['Large-scale induction furnace park', 'Continuous casting lines', 'Advanced emission control systems', 'Energy efficiency: waste heat recovery'] },
        { title: 'Module 3 — High-Purity Metal Production', topics: ['99.9% Cu cathode production', 'High-purity Al for aerospace', 'Zinc alloy for die-casting', 'In-line metal analysis systems'] },
        { title: 'Module 4 — LME Trading & Hedging', topics: ['LME futures basics for recyclers', 'Price risk management strategies', 'Back-to-back pricing with buyers', 'Currency hedging for exporters'] },
        { title: 'Module 5 — Export Markets', topics: ['Export documentation: GR form, BoL, CoA', 'Middle East & Europe buyer qualification', 'LME warrant creation for copper', 'Trade finance: LoC, standby LoC'] },
        { title: 'Module 6 — Financial Engineering', topics: ['Commodity-backed project finance', 'Metal streaming agreements', 'PE/VC in base metal recycling', 'Valuation: EV/EBITDA for smelters'] },
        { title: 'Module 7 — Consulting Practice', topics: ['Non-ferrous compliance advisory', 'Scrap yard audit services', 'Metal price advisory for recyclers', 'Retainer model for smelter clients'] },
        { title: 'Module 8 — Capstone & Mentoring I', topics: ['Business plan deep-dive', '1:1 with an EPR Compass expert'] },
        { title: 'Module 9 — Smelter Cluster Development', topics: ['Industrial cluster formation', 'Common captive power plant', 'Shared emission monitoring network', 'Anchor tenant model'] },
        { title: 'Module 10 — Innovation', topics: ['Electrowinning for high-purity Cu', 'AI-based scrap sorting', 'Green aluminium: carbon credit strategy', 'Blockchain-based metal provenance'] },
        { title: 'Module 11 — Case Studies', topics: ['Global secondary smelting leaders', 'India\'s non-ferrous recycling industry', 'M&A landscape', 'Exit strategy frameworks'] },
        { title: 'Module 12 — Final Assessment & Mentoring II', topics: ['Capstone submission', '1:1 exit mentoring', 'Mastery certificate award'] },
      ],
    },
  },
};

// Testimonials used across all course landing pages
export const TESTIMONIALS = [
  { name: 'Ravi Sharma', role: 'Plastic Recycling Unit Owner, Pune', text: 'The Certification course gave me the exact compliance roadmap I needed. Got my CPCB authorisation within 45 days of completing it.' },
  { name: 'Priya Mehta', role: 'E-Waste Entrepreneur, Bengaluru', text: 'The Mastery programme connected me with PRO partners I never would have found on my own. Our monthly revenue tripled in 6 months.' },
  { name: 'Suresh Yadav', role: 'Battery Recycler, Delhi NCR', text: 'The Workshop was a great starting point — I enrolled in the Certification immediately after. Completely changed how I understood Li-ion processing.' },
  { name: 'Anita Joshi', role: 'C&D Waste Processor, Ahmedabad', text: 'Won our first city-level ULB contract after following the frameworks taught in the Mastery programme. Highly recommend for serious entrepreneurs.' },
];

// FAQs common across all courses
export const COMMON_FAQS = [
  { q: 'Who is this course designed for?', a: 'Existing recyclers looking to formalise & grow, aspiring recycling entrepreneurs, EPR consultants advising recycler clients, and sustainability managers at corporates generating recyclable waste.' },
  { q: 'Do I need prior knowledge of recycling?', a: 'Workshop is completely beginner-friendly. Certification needs basic business sense. Mastery is best suited for those who already operate or consult in this space.' },
  { q: 'Is the course online or offline?', a: 'All courses are delivered online via live sessions on Zoom/Google Meet, with recordings available. Mastery students also get 1:1 video calls with an EPR Compass expert.' },
  { q: 'What payment methods are accepted?', a: 'All major Indian payment options via Razorpay: UPI, debit/credit cards, net banking, and EMI for Certification & Mastery courses.' },
  { q: 'Is GST applicable?', a: 'Yes — 18% GST is added on the course fee at checkout as applicable under Indian law.' },
  { q: 'Can I get a refund?', a: 'Full refund within 7 days of purchase if no sessions have been attended. Post that, no refunds but deferred enrollment (up to next cohort) is available.' },
  { q: 'Will I receive a certificate?', a: 'Yes. Workshop: Certificate of Participation. Certification: Printed Certificate of Completion after assessment. Mastery: Certificate of Mastery with CEPC pathway briefing.' },
  { q: 'Who teaches the courses?', a: 'Courses are delivered by the EPR Compass training team, with category-specific guidance and practical examples.' },
];

// Helper to build a slug from category + type
export function buildSlug(categoryId, type) {
  return `${categoryId}-${type.toLowerCase()}`;
}

// Helper to resolve category + type from slug
export function resolveSlug(slug) {
  const type = ['workshop', 'certification', 'mastery'].find(t => slug.endsWith(`-${t}`));
  if (!type) return null;
  const categoryId = slug.slice(0, -(type.length + 1));
  const category = RECYCLER_CATEGORIES.find(c => c.id === categoryId);
  const courseType = COURSE_TYPES.find(t => t.type.toLowerCase() === type);
  if (!category || !courseType) return null;
  const curriculum = COURSE_CURRICULUM[categoryId]?.[courseType.type];
  return { category, courseType, curriculum };
}

