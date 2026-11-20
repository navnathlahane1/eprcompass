import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'ShieldCheck', title: 'Packaging Waste Compliance', desc: 'Pharmaceutical manufacturers face EPR obligations for packaging waste under CPCB regulations.' },
  { icon: 'ClipboardList', title: 'Regulatory Compliance', desc: 'Help pharma clients navigate expanding EPR requirements alongside existing drug and device regulations.' },
  { icon: 'Leaf', title: 'Sustainability Requirements', desc: 'ESG-driven sustainability requirements are making pharma packaging compliance a board-level priority.' },
  { icon: 'Award', title: 'Trusted Expert', desc: 'Become the EPR compliance expert that pharmaceutical companies trust with their packaging obligations.' },
  { icon: 'IndianRupee', title: 'Premium Consulting Fees', desc: 'Pharmaceutical clients pay premium consulting fees for specialized regulatory compliance expertise.' },
  { icon: 'TrendingUp', title: 'Expanding Market', desc: 'EPR regulations covering pharma packaging are expanding — get certified ahead of the demand curve.' },
];

const FAQS = [
  {
    q: 'Do pharmaceutical companies have EPR obligations?',
    a: 'Yes. Pharmaceutical companies that use plastic packaging (blister packs, bottles, pouches, cartons with plastic components) have EPR obligations under the Plastic Waste Management Rules. Companies with significant packaging volumes are required to register on the CPCB EPR portal and comply with annual targets.',
  },
  {
    q: 'How does pharmaceutical packaging EPR compliance work?',
    a: 'Pharma companies must calculate their plastic packaging tonnage, register on the CPCB EPR portal as a producer, set annual collection and recycling targets, tie up with CPCB-registered PROs or recyclers, and file annual compliance reports demonstrating target achievement.',
  },
  {
    q: 'Is pharma packaging EPR compliance different from other industries?',
    a: 'The regulatory framework is the same, but the product categories and packaging types are specific to pharmaceuticals. CEPC-certified consultants who specialize in pharma can command premium fees due to the specialized knowledge required.',
  },
  {
    q: 'Why are pharmaceutical companies paying more attention to EPR compliance now?',
    a: 'ESG requirements in BRSR reporting, investor due diligence, and increasing CPCB enforcement have all raised the urgency. Pharmaceutical boards are now actively seeking advisors who can help them achieve and demonstrate EPR compliance.',
  },
  {
    q: 'What certification level is recommended for pharma EPR consulting?',
    a: 'CEPC Professional or Expert is recommended for pharma consulting due to the multi-category nature of packaging waste (plastic, paper, composite packaging). These tiers give you access to all waste categories and the full compliance dashboard.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Pharma Consultants | EPR Compass', url: 'http://localhost:3000/cepc-for-pharma-consultants' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Pharma Consultants | EPR Packaging Compliance | EPR Compass',
  description: 'Pharmaceutical consultants: Get CEPC certified and help pharma companies navigate growing packaging EPR obligations. Premium consulting fees in a high-compliance sector.',
  keywords: 'CEPC pharma consultants, pharmaceutical EPR compliance India, pharma packaging CPCB, pharma sustainability EPR advisory',
  alternates: { canonical: '/cepc-for-pharma-consultants' },
  openGraph: { title: 'CEPC for Pharma Consultants | EPR Compass', description: 'Help pharmaceutical companies navigate packaging EPR obligations.', url: '/cepc-for-pharma-consultants', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Pharma Consultants', description: 'Pharma packaging EPR compliance — premium advisory market.' },
};

export default function PharmaConsultantsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_pharma_consultants"
        audienceSegment="pharma_consultants"
        icpLabel="For Pharma Regulatory Consultants"
        heroHeadline="Help Pharmaceutical Companies Navigate Growing Packaging EPR Obligations"
        heroSub="Pharmaceutical manufacturers face expanding CPCB EPR requirements for plastic packaging waste. CEPC certification positions you as the specialized compliance expert that pharma boards are actively seeking."
        whySectionTitle="Why Pharma Consultants Get CEPC Certified"
        whySectionSub="Pharmaceutical companies trust specialized regulatory expertise. CEPC certification in EPR compliance makes you the go-to advisor for their packaging obligations."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your pharma regulatory background within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

