import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'Award', title: 'ISO 14001 Auditors', desc: 'Your environmental management expertise translates directly into EPR compliance advisory work.' },
  { icon: 'ShieldCheck', title: 'ISO 45001 Consultants', desc: 'Extend occupational health and safety expertise into the growing environmental compliance space.' },
  { icon: 'ClipboardList', title: 'Environmental Management Specialists', desc: 'Every audit engagement becomes an opportunity to identify EPR compliance gaps and offer solutions.' },
  { icon: 'TrendingUp', title: 'EPR Gap Identification', desc: 'Use your audit skills to identify EPR obligations that client organizations may not be aware of.' },
  { icon: 'IndianRupee', title: 'New Consulting Opportunity', desc: 'Turn audit engagements into ongoing EPR consulting relationships with additional recurring revenue.' },
  { icon: 'Globe', title: 'Expanding Audit Scope', desc: 'EPR compliance is becoming a standard audit requirement — get certified before the market demands it.' },
];

const FAQS = [
  {
    q: 'How does ISO auditing expertise translate into EPR consulting?',
    a: 'ISO 14001 auditors already understand environmental management systems, legal compliance requirements, and the audit methodology needed for EPR compliance. CEPC training adds the specific regulatory knowledge of CPCB EPR rules — making the transition fast and natural.',
  },
  {
    q: 'Can ISO auditors identify EPR gaps during existing audit engagements?',
    a: 'Yes. EPR compliance gaps are a common finding during ISO 14001 audits. CEPC-certified auditors can formally document these gaps and offer remediation services, turning every audit into a potential consulting engagement.',
  },
  {
    q: 'Is CEPC certification recognized for signing EPR compliance reports?',
    a: 'Yes. CEPC is a government-recognized credential that allows certified consultants to sign EPR compliance reports submitted to CPCB and State Pollution Control Boards — similar to how chartered accountants sign financial statements.',
  },
  {
    q: 'How long does it take to transition from ISO auditing to EPR consulting?',
    a: 'Most ISO auditors complete CEPC training in 4–6 weeks and start serving EPR clients within 60 days of certification. The environmental systems knowledge from ISO work significantly accelerates the learning curve.',
  },
  {
    q: 'What is the difference between ISO 14001 compliance and EPR compliance?',
    a: 'ISO 14001 is a voluntary management system standard; EPR compliance is a mandatory statutory requirement under CPCB regulations. Companies can have ISO 14001 certification and still be non-compliant with EPR obligations — creating a large addressable market for CEPC-certified consultants.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for ISO Auditors | EPR Compass', description: 'ISO 14001 and 45001 auditors: Get CEPC certified and add EPR compliance to your audit practice.', url: 'http://localhost:3000/cepc-for-iso-auditors' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for ISO Auditors | EPR Compliance | EPR Compass',
  description: 'ISO 14001 & 45001 auditors: Get CEPC certified and add EPR compliance consulting to your practice. Your audit expertise is a massive advantage. Earn ₹50K–₹2L+/month.',
  keywords: 'CEPC ISO auditors, EPR compliance ISO 14001, ISO auditor EPR certification India, environmental auditor CEPC',
  alternates: { canonical: '/cepc-for-iso-auditors' },
  openGraph: { title: 'CEPC for ISO Auditors | EPR Compass', description: 'Add EPR compliance to your ISO audit practice.', url: '/cepc-for-iso-auditors', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for ISO Auditors', description: 'ISO audit expertise + CEPC = powerful EPR consulting practice.' },
};

export default function ISOAuditorsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_iso_auditors"
        audienceSegment="iso_auditors"
        icpLabel="For ISO 14001 & 45001 Auditors"
        heroHeadline="Your Environmental Audit Expertise Can Power a High-Income EPR Consulting Practice"
        heroSub="ISO auditors already understand environmental management systems and compliance frameworks. CEPC certification adds the specific regulatory knowledge that turns every audit engagement into an EPR consulting opportunity."
        whySectionTitle="Why ISO Auditors Get CEPC Certified"
        whySectionSub="Your audit skills are your unfair advantage. Use them to identify EPR compliance gaps — then offer the solutions."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your ISO background within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

