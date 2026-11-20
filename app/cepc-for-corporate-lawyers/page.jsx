import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'Briefcase', title: 'Environmental Compliance', desc: 'Directors and management teams need expert guidance on EPR obligations that create board-level risk.' },
  { icon: 'ShieldCheck', title: 'Regulatory Risk', desc: 'EPR non-compliance creates regulatory risk that corporate legal advisors are expected to manage proactively.' },
  { icon: 'ClipboardList', title: 'Governance Obligations', desc: 'Environmental governance is becoming a standard part of corporate counsel responsibilities.' },
  { icon: 'Award', title: 'Trusted Board Advisor', desc: 'Become the trusted advisor that boards and management turn to for environmental compliance strategy.' },
  { icon: 'TrendingUp', title: 'Fastest-Growing Sector', desc: "EPR compliance is one of India's fastest-growing regulatory areas — get ahead of the demand." },
  { icon: 'IndianRupee', title: 'Premium Practice Area', desc: 'Board-level environmental compliance advisory commands premium fees from corporate clients.' },
];

const FAQS = [
  {
    q: 'Why is EPR compliance becoming a corporate governance issue?',
    a: "EPR non-compliance creates regulatory risk that appears in company audits, affects director liability, and is increasingly scrutinized by investors and lenders. Corporate lawyers who can advise boards on EPR governance are meeting a growing demand across India's corporate sector.",
  },
  {
    q: 'How does CEPC certification benefit corporate lawyers?',
    a: 'CEPC certification gives corporate lawyers the technical knowledge to advise boards on EPR obligations, governance frameworks, and compliance strategies — going beyond the legal text to understand the regulatory process and practical compliance requirements.',
  },
  {
    q: 'Can EPR compliance affect director liability?',
    a: 'Yes. Under the Environment Protection Act and CPCB regulations, company directors and key managerial personnel can face personal liability for environmental compliance failures. Corporate lawyers advising on governance need to understand this exposure.',
  },
  {
    q: 'Is EPR compliance relevant for M&A and due diligence?',
    a: 'Absolutely. EPR non-compliance is increasingly appearing as a material finding in environmental due diligence during M&A transactions. CEPC-certified corporate lawyers can add EPR compliance assessment to their transaction advisory services.',
  },
  {
    q: 'How is EPR compliance affecting corporate reporting obligations?',
    a: 'SEBI\'s BRSR (Business Responsibility and Sustainability Report) requires top 1000 listed companies to disclose environmental compliance data, including EPR. This is making EPR compliance a board-level disclosure obligation — and creating a new advisory opportunity for corporate lawyers.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Corporate Lawyers | EPR Compass', url: 'http://localhost:3000/cepc-for-corporate-lawyers' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Corporate Lawyers | Board-Level EPR Advisory | EPR Compass',
  description: 'Corporate lawyers: Get CEPC certified and add board-level EPR compliance advisory to your practice. Environmental governance is the fastest-growing corporate legal area in India.',
  keywords: 'CEPC corporate lawyers, EPR corporate governance India, corporate counsel EPR compliance, board level environmental advisory CEPC',
  alternates: { canonical: '/cepc-for-corporate-lawyers' },
  openGraph: { title: 'CEPC for Corporate Lawyers | EPR Compass', description: 'Add board-level EPR advisory to your corporate law practice.', url: '/cepc-for-corporate-lawyers', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Corporate Lawyers', description: 'Environmental governance is the fastest-growing corporate legal area.' },
};

export default function CorporateLawyersPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_corporate_lawyers"
        audienceSegment="corporate_lawyers"
        icpLabel="For Corporate Lawyers"
        heroHeadline="Add EPR Compliance to Your Corporate Law Practice and Command Premium Advisory Fees"
        heroSub="Corporate boards need expert guidance on EPR obligations that create regulatory risk, director liability, and ESG disclosure requirements. CEPC certification positions you as the environmental compliance advisor that boards trust."
        whySectionTitle="Why Corporate Lawyers Get CEPC Certified"
        whySectionSub="Environmental governance is fast becoming a standard corporate law responsibility. Get ahead of this demand before your competitors do."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your corporate law background within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

