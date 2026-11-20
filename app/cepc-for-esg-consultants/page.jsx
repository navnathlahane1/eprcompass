import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'Leaf', title: 'Sustainability Reporting', desc: 'EPR compliance directly strengthens sustainability reports with measurable environmental performance data.' },
  { icon: 'TrendingUp', title: 'ESG Performance Metrics', desc: 'Help clients improve ESG scores by implementing structured EPR compliance frameworks.' },
  { icon: 'Globe', title: 'Circular Economy Goals', desc: 'EPR is the foundation of circular economy compliance — a key ESG deliverable for Indian companies.' },
  { icon: 'Award', title: 'Waste Reduction Targets', desc: 'Convert sustainability discussions into concrete EPR implementation projects with measurable outcomes.' },
  { icon: 'IndianRupee', title: 'Implementation Projects', desc: 'Turn sustainability advisory into higher-value implementation engagements through EPR compliance projects.' },
  { icon: 'ShieldCheck', title: 'Regulatory Compliance', desc: 'Ensure clients meet CPCB EPR obligations that are increasingly part of ESG due diligence checklists.' },
];

const FAQS = [
  {
    q: 'How does EPR compliance connect to ESG reporting?',
    a: 'EPR compliance is directly measurable environmental performance data — exactly what ESG reports need. Companies with certified EPR compliance can demonstrate waste reduction, circular economy practices, and regulatory adherence in their sustainability disclosures.',
  },
  {
    q: 'Why is EPR becoming a key ESG metric for Indian companies?',
    a: 'SEBI\'s BRSR (Business Responsibility and Sustainability Report) requirements now include environmental compliance data. EPR compliance is one of the most concrete, measurable ways companies can demonstrate environmental responsibility — making it an increasingly important ESG metric.',
  },
  {
    q: 'Can ESG consultants offer EPR implementation services?',
    a: 'Yes. CEPC certification gives ESG consultants the credentials to move from advisory into implementation — handling CPCB registration, target setting, PRO tie-ups, and annual compliance filings on behalf of clients.',
  },
  {
    q: 'What waste categories does CEPC certification cover?',
    a: 'CEPC certification covers all six waste categories: Plastic Waste, E-Waste, Battery Waste, Tyre Waste, Used Oil, and End of Life Vehicles (ELV). This comprehensive coverage means you can serve virtually any manufacturing or import client.',
  },
  {
    q: 'How does EPR compliance support circular economy goals?',
    a: 'EPR regulations require producers to finance and manage the end-of-life processing of their products — driving collection, recycling, and responsible disposal. This is the regulatory foundation of circular economy practices in India.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService',
      name: 'CEPC Certification for ESG Consultants | EPR Compass',
      description: 'ESG and Sustainability consultants: Get CEPC certified and add EPR compliance implementation to your advisory practice.',
      url: 'http://localhost:3000/cepc-for-esg-consultants',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const metadata = {
  title: 'CEPC Certification for ESG & Sustainability Consultants | EPR Compass',
  description: 'ESG consultants: Add EPR compliance to your sustainability portfolio. Get CEPC certified and turn sustainability advisory into high-value implementation projects.',
  keywords: 'CEPC ESG consultants, EPR sustainability consulting, ESG EPR compliance India, circular economy consulting, sustainability reporting EPR',
  alternates: { canonical: '/cepc-for-esg-consultants' },
  openGraph: {
    title: 'CEPC Certification for ESG Consultants | EPR Compass',
    description: 'Add EPR compliance to your ESG portfolio. Turn sustainability advisory into implementation projects.',
    url: '/cepc-for-esg-consultants',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'CEPC for ESG Consultants', description: 'Add EPR to your ESG practice. ₹50K–₹2L+/month.' },
};

export default function ESGConsultantsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_esg_consultants"
        audienceSegment="esg_consultants"
        icpLabel="For ESG & Sustainability Consultants"
        heroHeadline="Add EPR Compliance to Your ESG Consulting Portfolio"
        heroSub="ESG reporting is no longer enough. Companies need measurable compliance frameworks that demonstrate environmental responsibility. CEPC certification lets you deliver that — and charge for it."
        whySectionTitle="Why ESG Consultants Get CEPC Certified"
        whySectionSub="EPR directly impacts sustainability reporting, ESG metrics, circular economy goals, and waste reduction targets. Convert sustainability discussions into implementation projects."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your ESG background within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

