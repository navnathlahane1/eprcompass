import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'ShieldCheck', title: 'Factory Compliance Network', desc: 'Every manufacturing client you work with faces increasing compliance obligations under CPCB regulations.' },
  { icon: 'Award', title: 'EPR Certification', desc: 'Become a Certified EPR Consultant (CEPC) and offer complete compliance solutions to your existing factory clients.' },
  { icon: 'ClipboardList', title: 'Factory Assessment Framework', desc: 'Get a structured methodology to assess EPR obligations across your entire factory client base.' },
  { icon: 'TrendingUp', title: 'Client Acquisition System', desc: 'Use our proven client acquisition system to grow your EPR consulting business alongside your EHS practice.' },
  { icon: 'BookOpen', title: 'Compliance Templates', desc: 'Access ready-to-use compliance templates, checklists, and EPR portal filing guides for all waste categories.' },
  { icon: 'IndianRupee', title: 'Revenue Sharing Opportunities', desc: 'Keep more revenue in-house by offering EPR compliance directly, instead of referring clients elsewhere.' },
];

const FAQS = [
  {
    q: 'What is CEPC certification and why do EHS consultants need it?',
    a: 'CEPC (Certified EPR Professional Consultant) is a government-recognized credential that allows you to sign EPR compliance reports submitted to CPCB and SPCBs. As an EHS consultant, your existing factory relationships make you perfectly positioned to offer this high-demand service — and CEPC certification is the formal qualification that lets you do so.',
  },
  {
    q: 'How long does the CEPC training take?',
    a: 'The training program is 60 hours of online content covering all six waste categories: Plastic, E-Waste, Battery, Tyre, Used Oil, and ELV. You can complete it at your own pace within 3 months of enrollment.',
  },
  {
    q: 'Can I add EPR to my existing EHS consulting practice without starting a new firm?',
    a: 'Yes. Most EHS consultants add EPR compliance as an extension of their existing practice. You use the EPR Compass platform to manage clients, file compliance reports, and track obligations — all under your existing brand.',
  },
  {
    q: 'How much can I earn as a CEPC-certified EHS consultant?',
    a: 'Certified consultants typically earn ₹50,000–₹2,00,000+ per month depending on the number of clients managed and waste categories served. EHS consultants with existing factory networks often reach these numbers within 2–3 months of certification.',
  },
  {
    q: 'What happens after I pass the assessment?',
    a: 'You receive your CEPC credential, get listed on our platform for client discovery, and gain access to the compliance management dashboard. Our team supports your first few client onboardings.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService',
      name: 'CEPC Certification for EHS Consultants | EPR Compass',
      description: 'Get CEPC certified and add EPR compliance to your EHS consulting practice. Serve factory clients with government-recognized credentials.',
      url: 'http://localhost:3000/cepc-for-ehs-consultants',
      provider: { '@type': 'Organization', name: 'EPR Compass' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

export const metadata = {
  title: 'CEPC Certification for EHS Consultants | EPR Compass',
  description: 'EHS consultants: Get CEPC certified and turn your factory client relationships into a high-income EPR consulting business. Government-recognized. Earn ₹50K–₹2L+/month.',
  keywords: 'CEPC certification EHS consultants, EPR compliance EHS, factory EPR compliance, EHS consultant certification India, environmental health safety EPR',
  alternates: { canonical: '/cepc-for-ehs-consultants' },
  openGraph: {
    title: 'CEPC Certification for EHS Consultants | EPR Compass',
    description: 'Turn your factory relationships into a high-income EPR consulting business. CEPC certification for EHS professionals.',
    url: '/cepc-for-ehs-consultants',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'CEPC for EHS Consultants', description: 'Add EPR compliance to your EHS practice. Earn ₹50K–₹2L+/month.' },
};

export default function EHSConsultantsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_ehs_consultants"
        audienceSegment="ehs_consultants"
        icpLabel="For EHS Consultants"
        heroHeadline="Turn Your Existing Factory Relationships into a High-Income EPR Consulting Business"
        heroSub="You already help industries with environmental, health and safety compliance. Now add EPR Compliance to your service portfolio and unlock a powerful new revenue stream with your existing client base."
        whySectionTitle="Why EHS Consultants Get CEPC Certified"
        whySectionSub="Your EHS expertise is your unfair advantage. Add EPR to your service portfolio and serve existing clients more completely — without chasing new leads."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your EHS profile within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

