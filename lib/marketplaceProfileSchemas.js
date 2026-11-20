const META_START = '[[PROFILE_META]]';
const META_END = '[[/PROFILE_META]]';

export const MARKETPLACE_PROFILE_SCHEMAS = {
  brand_buyers_marketplace: {
    focusLabel: 'Buying Priorities',
    focusOptions: [
      'Cost Efficiency',
      'Compliance Assurance',
      'Fast Fulfillment',
      'Pan-India Coverage',
      'Long-Term Contracts',
      'Risk Reduction'
    ],
    categoryLabel: 'Credit Categories Required',
    categoryOptions: ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil', 'Used Oil', 'ELV'],
    servicesLabel: 'Buyer Support Needed',
    servicesOptions: [
      'Rate Discovery',
      'Seller Shortlisting',
      'Transaction Support',
      'Compliance Documentation',
      'Audit Support',
      'Target Planning'
    ],
    extraFields: [
      { key: 'organization_type', label: 'Organization Type', type: 'select', options: ['Producer', 'Importer', 'Brand Owner', 'PIBO'] },
      { key: 'annual_requirement_kg', label: 'Estimated Annual Requirement (KG)', type: 'number', placeholder: 'e.g. 250000' },
      { key: 'primary_states', label: 'Primary Operating States', placeholder: 'e.g. Maharashtra, Gujarat, Tamil Nadu' }
    ]
  },
  consultants_marketplace: {
    focusLabel: 'Consulting Specializations',
    focusOptions: [
      'Business Strategy',
      'Compliance Strategy',
      'Process Improvement',
      'Digital Transformation',
      'Market Entry',
      'Cost Optimization'
    ],
    categoryLabel: 'Industry Exposure',
    categoryOptions: [
      'Plastic Packaging',
      'Electronics',
      'Battery',
      'Tyre',
      'Lubricants',
      'FMCG',
      'Automotive',
      'Healthcare'
    ],
    servicesLabel: 'Consulting Services',
    servicesOptions: [
      'Assessment & Diagnostics',
      'Implementation Roadmap',
      'Policy Advisory',
      'Training & Workshops',
      'Performance Audit',
      'Interim Leadership'
    ],
    extraFields: [
      { key: 'engagement_model', label: 'Engagement Model', type: 'select', options: ['Retainer', 'Project Based', 'Hourly'] },
      { key: 'team_size', label: 'Consulting Team Size', placeholder: 'e.g. 5 consultants' },
      { key: 'avg_project_duration', label: 'Average Project Duration', placeholder: 'e.g. 8-12 weeks' }
    ]
  },
  service_providers_directory: {
    focusLabel: 'Service Domains',
    focusOptions: [
      'Environmental Impact Assessment (EIA)',
      'Water & Wastewater Management',
      'Air Quality Management',
      'Soil & Groundwater Remediation',
      'Environmental Auditing',
      'Carbon & GHG Management',
      'Renewable Energy',
      'Green Building & Sustainability',
      'Hazardous Waste Management',
      'Environmental Lab Testing'
    ],
    categoryLabel: 'Sectors Served',
    categoryOptions: [
      'Manufacturing & Industry',
      'Infrastructure & Construction',
      'Mining & Quarrying',
      'Oil & Gas',
      'Real Estate & Urban Development',
      'Agriculture & Food Processing',
      'Ports & Logistics',
      'Power & Energy'
    ],
    servicesLabel: 'Services Offered',
    servicesOptions: [
      'EIA & EMP Preparation',
      'Environment Management Plans',
      'Pollution Control Setup',
      'Compliance Monitoring',
      'Lab Sampling & Testing',
      'Green Certification Support',
      'ESG Reporting',
      'Renewable Energy Advisory',
      'Training & Capacity Building',
      'Site Assessment & Remediation'
    ],
    extraFields: [
      { key: 'accreditations', label: 'Accreditations / Certifications', placeholder: 'e.g. NABL, ISO 14001, MoEFCC empanelled' },
      { key: 'operating_regions', label: 'Operating Regions', placeholder: 'e.g. Maharashtra, Gujarat, Karnataka' },
      { key: 'project_types', label: 'Types of Projects Handled', placeholder: 'e.g. Greenfield EIA, CETP setup, STP design' }
    ]
  },
  compliance_consultants: {
    focusLabel: 'Compliance Expertise',
    focusOptions: [
      'CPCB Filings',
      'SPCB Coordination',
      'Annual Returns',
      'Documentation Review',
      'Audit Support',
      'Target Planning'
    ],
    categoryLabel: 'Regulatory Categories',
    categoryOptions: ['PWM', 'E-Waste', 'Battery', 'Tyre', 'Used Oil'],
    servicesLabel: 'Compliance Services',
    servicesOptions: [
      'Registration',
      'Renewal',
      'Return Filing',
      'Notices & Responses',
      'Compliance Calendar',
      'Training'
    ],
    extraFields: [
      { key: 'regulatory_experience_years', label: 'Regulatory Experience (Years)', type: 'number', placeholder: 'e.g. 6' },
      { key: 'states_served', label: 'States Served', placeholder: 'e.g. Maharashtra, Delhi, Tamil Nadu' },
      { key: 'filings_per_year', label: 'Average Filings per Year', type: 'number', placeholder: 'e.g. 120' }
    ]
  },
  recyclers_pro_network: {
    focusLabel: 'Network Focus Areas',
    focusOptions: [
      'Material Sourcing',
      'Processing & Recycling',
      'PRO Operations',
      'Certificate Support',
      'Traceability',
      'Fulfillment Planning'
    ],
    categoryLabel: 'Material Categories',
    categoryOptions: [
      'Plastic',
      'E-Waste',
      'Battery',
      'Tyre',
      'Used Oil',
      'Construction & Demolition',
      'Solar',
      'Textile',
      'Solid Waste',
    ],
    servicesLabel: 'Network Services',
    servicesOptions: [
      'Collection & Channelization',
      'Recycling Capacity',
      'PRO Execution',
      'Evidence Management',
      'Credit Support',
      'Logistics Coordination'
    ],
    validDocumentsLabel: 'Valid Documents',
    validDocumentsOptions: ['CTO', 'CTE', 'EPR', 'Traceability'],
    plantPermissionsLabel: 'Plant Permission Categories',
    plantPermissionsOptions: ['Collection Agent', 'Recycler', 'Refurbisher'],
    interestedInLabel: 'Interested In Services',
    interestedInOptions: [
      'Training',
      'Tender alerts',
      'Corporate alerts',
      'CPCB alerts',
      'Auction support',
      'EPR credit generation',
      'EPR credit sales',
    ],
    extraFields: [
      { key: 'authorized_capacity', label: 'Authorized Capacity', placeholder: 'e.g. 15000 MT/year' },
      { key: 'facility_locations', label: 'Facility Locations', placeholder: 'e.g. Pune, Indore, Jaipur' },
      { key: 'certification_details', label: 'Certifications', placeholder: 'e.g. CPCB, ISO 14001' }
    ]
  }
};

export function profileSchemaForListing(listingType) {
  return MARKETPLACE_PROFILE_SCHEMAS[listingType] || MARKETPLACE_PROFILE_SCHEMAS.consultants_marketplace;
}

export function emptyExtraData(schema) {
  const out = {};
  for (const field of schema.extraFields || []) {
    out[field.key] = '';
  }
  return out;
}

export function composeProfileBio(baseBio, extraData) {
  const cleanBio = String(baseBio || '').trim();
  const entries = Object.entries(extraData || {}).filter(([, value]) => String(value || '').trim());
  if (!entries.length) return cleanBio || null;

  const payload = Object.fromEntries(entries.map(([key, value]) => [key, String(value).trim()]));
  const metaBlock = `${META_START}${JSON.stringify(payload)}${META_END}`;

  return cleanBio ? `${metaBlock}\n\n${cleanBio}` : metaBlock;
}

export function parseProfileBio(rawBio) {
  const raw = String(rawBio || '');
  const start = raw.indexOf(META_START);
  const end = raw.indexOf(META_END);

  if (start === -1 || end === -1 || end < start) {
    return { cleanBio: raw.trim(), extraData: {} };
  }

  const jsonText = raw.slice(start + META_START.length, end);
  const after = raw.slice(end + META_END.length).trim();

  try {
    const parsed = JSON.parse(jsonText);
    return {
      cleanBio: after,
      extraData: parsed && typeof parsed === 'object' ? parsed : {}
    };
  } catch {
    return { cleanBio: raw.trim(), extraData: {} };
  }
}
