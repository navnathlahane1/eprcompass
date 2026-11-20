import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'ShieldCheck', title: 'Proactive Compliance Expert', desc: 'Many companies are unaware of their EPR obligations until regulatory notices arrive — you can change that.' },
  { icon: 'Award', title: 'CEPC Certification', desc: 'Get certified in EPR Compliance and add a high-value service to your corporate advisory practice.' },
  { icon: 'TrendingUp', title: 'Growing Regulatory Requirement', desc: 'CPCB EPR regulations are expanding — corporate clients need expert guidance now, not after a notice.' },
  { icon: 'Briefcase', title: 'Risk Identification', desc: 'Position yourself as the compliance expert who identifies EPR risks before they become board-level liabilities.' },
  { icon: 'IndianRupee', title: 'New Revenue Stream', desc: 'Offer EPR advisory services that generate recurring consulting income from your existing corporate clients.' },
  { icon: 'Globe', title: 'Complete Compliance Coverage', desc: 'Complement MCA, SEBI, and ROC compliance services with environmental regulatory expertise.' },
];

const FAQS = [
  {
    q: 'What EPR obligations do corporate clients have?',
    a: 'Companies that manufacture, import, or sell products in plastic packaging, electronics, batteries, tyres, or lubricants have EPR (Extended Producer Responsibility) obligations under CPCB regulations. They must register on the EPR portal, set targets, and file annual compliance reports.',
  },
  {
    q: 'How does CEPC certification benefit a Company Secretary?',
    a: 'CEPC certification allows you to formally advise corporate clients on EPR compliance, sign compliance reports, and manage their CPCB portal filings. It positions you as a complete corporate compliance partner — covering both corporate law and environmental regulations.',
  },
  {
    q: 'Is environmental compliance becoming a standard CS responsibility?',
    a: 'Yes. Environmental governance is increasingly appearing in company audits, ESG disclosures, and board-level risk registers. CS professionals who are proactive in EPR compliance are becoming preferred advisors for corporate boards.',
  },
  {
    q: 'How much time does EPR compliance advisory require?',
    a: 'Initial EPR registration takes 5–10 days per client. Annual compliance reporting typically requires 2–3 weeks per year. After the first year, it is largely a recurring annual engagement — ideal for adding to your retainer services.',
  },
  {
    q: 'Can I serve multiple corporate clients through the EPR Compass platform?',
    a: 'Yes. The CEPC platform is designed for multi-client management. You can track obligations, file reports, and manage compliance calendars for multiple corporate clients through a single dashboard.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService',
      name: 'CEPC Certification for Company Secretaries | EPR Compass',
      description: 'Company Secretaries: Add EPR advisory to your corporate compliance practice. CEPC certification for CS professionals in India.',
      url: 'http://localhost:3000/cepc-for-company-secretaries',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Company Secretaries | EPR Advisory | EPR Compass',
  description: 'Company Secretaries: Add EPR compliance advisory to your corporate practice. Get CEPC certified and help clients meet CPCB requirements. Earn ₹50K–₹2L+/month.',
  keywords: 'CEPC certification company secretaries, CS EPR compliance, corporate EPR advisory India, CPCB compliance CS professionals',
  alternates: { canonical: '/cepc-for-company-secretaries' },
  openGraph: {
    title: 'CEPC Certification for Company Secretaries | EPR Compass',
    description: 'Add EPR advisory services to your corporate compliance practice. Help clients meet CPCB requirements.',
    url: '/cepc-for-company-secretaries',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'CEPC for Company Secretaries', description: 'Add EPR advisory to your CS practice. ₹50K–₹2L+/month.' },
};

export default function CompanySecretariesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_company_secretaries"
        audienceSegment="company_secretaries"
        icpLabel="For Company Secretaries"
        heroHeadline="Add EPR Advisory Services to Your Corporate Compliance Practice"
        heroSub="Companies already depend on you for regulatory compliance. Become certified in EPR Compliance and help clients meet CPCB requirements with confidence — before regulatory notices arrive."
        whySectionTitle="Why This Matters for CS Professionals"
        whySectionSub="Many companies are unaware of their EPR obligations until notices arrive. Position yourself as the expert who identifies risks first and delivers compliance solutions."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your CS profile within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

