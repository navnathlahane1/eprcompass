import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'ShieldCheck', title: 'Compliance Readiness', desc: 'Many startups create EPR obligations from day one without realizing it. Help them get compliant early.' },
  { icon: 'Leaf', title: 'Sustainable Operations', desc: 'Support founders in building environmentally responsible operations that meet regulatory standards.' },
  { icon: 'Globe', title: 'Environmental Governance', desc: 'Help portfolio companies establish environmental governance frameworks that satisfy EPR requirements.' },
  { icon: 'Award', title: 'Ecosystem Value', desc: 'Create additional value for your startup ecosystem by offering expert EPR compliance guidance.' },
  { icon: 'TrendingUp', title: 'Investor Readiness', desc: 'EPR compliance is increasingly a due diligence requirement for ESG-conscious investors.' },
  { icon: 'IndianRupee', title: 'Avoid Regulatory Surprises', desc: 'Help startups avoid costly EPR penalties and regulatory disruptions during critical growth phases.' },
];

const FAQS = [
  {
    q: 'When do startups typically encounter EPR obligations?',
    a: "From the moment a startup begins selling products with plastic packaging, or manufacturing electronics, batteries, or other EPR-covered categories. Many startups don't realize they're producers under CPCB regulations until they've already missed compliance deadlines.",
  },
  {
    q: 'Why is EPR compliance important for investor readiness?',
    a: 'ESG-conscious investors — including venture funds, corporate venture arms, and impact investors — increasingly conduct environmental due diligence before investing. Startups with EPR compliance in place are more investor-ready and less likely to face surprises during due diligence.',
  },
  {
    q: 'How can incubators add EPR compliance to their support programs?',
    a: 'CEPC-certified incubator managers or advisors can offer EPR compliance workshops, one-on-one compliance reviews for portfolio companies, and guidance on CPCB registration as part of standard incubation programming.',
  },
  {
    q: 'Is EPR compliance mandatory for early-stage startups?',
    a: 'Yes, if they produce or import products covered by EPR regulations — regardless of company stage. CPCB enforcement has intensified and early-stage startups are not exempt. Many startups face penalties during growth phases when they finally attempt to raise capital or scale.',
  },
  {
    q: 'Can startup incubators partner with EPR Compass for portfolio compliance services?',
    a: 'Yes. We offer partnership programs for incubators and accelerators looking to provide EPR compliance services to their portfolio companies at preferential rates. Mention this in the application form.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Startup Incubators | EPR Compass', url: 'http://localhost:3000/cepc-for-startup-incubators' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Startup Incubators | EPR Compliance | EPR Compass',
  description: 'Startup incubators: Get CEPC certified and help portfolio companies navigate EPR compliance from day one. Build investor-ready, environmentally compliant startups.',
  keywords: 'CEPC startup incubators, EPR compliance startups India, incubator EPR advisory, startup environmental compliance CPCB',
  alternates: { canonical: '/cepc-for-startup-incubators' },
  openGraph: { title: 'CEPC for Startup Incubators | EPR Compass', description: 'Help portfolio startups navigate EPR compliance. Build investor-ready companies.', url: '/cepc-for-startup-incubators', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Startup Incubators', description: 'Build EPR-compliant, investor-ready startups in your portfolio.' },
};

export default function StartupIncubatorsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_startup_incubators"
        audienceSegment="startup_incubators"
        icpLabel="For Startup Incubators & Accelerators"
        heroHeadline="Help Your Startup Portfolio Build Sustainable and Compliant Businesses"
        heroSub="Many startups unknowingly create EPR obligations from day one. Support founders with compliance readiness, sustainable operations, and environmental governance — before regulatory penalties derail their growth."
        whySectionTitle="Why Incubators Get CEPC Certified"
        whySectionSub="Support your portfolio companies in building compliant, investor-ready businesses with strong environmental governance from day one."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your profile within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

