import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'ShieldCheck', title: 'Regulatory Notices', desc: 'EPR non-compliance leads to CPCB regulatory notices — help clients avoid them proactively.' },
  { icon: 'IndianRupee', title: 'Financial Penalties', desc: 'Prevent the financial penalties that arise from EPR non-compliance with proactive advisory services.' },
  { icon: 'Briefcase', title: 'Legal Disputes', desc: 'Reduce client legal exposure by implementing EPR compliance frameworks before disputes arise.' },
  { icon: 'Award', title: 'Preventive Advisor Role', desc: 'Position yourself as a proactive compliance advisor, not just a reactive legal counsel.' },
  { icon: 'TrendingUp', title: 'Growing Practice Area', desc: "EPR compliance is one of India's fastest-growing environmental regulatory areas." },
  { icon: 'Globe', title: 'CPCB Expertise', desc: 'Combine your legal expertise with CEPC certification to become the definitive EPR advisor for clients.' },
];

const FAQS = [
  {
    q: 'Why should environmental lawyers get CEPC certified?',
    a: 'Environmental lawyers who are CEPC certified can move from reactive (defending against CPCB notices) to proactive (preventing them). This positions you as a higher-value advisor commanding premium fees — and builds deeper, longer-term client relationships.',
  },
  {
    q: 'What legal risks do companies face for EPR non-compliance?',
    a: 'CPCB can issue show-cause notices, impose environmental compensation (penalties), restrict operations, and in severe cases, recommend cancellation of manufacturing licenses. EPR non-compliance is increasingly treated as a material legal and regulatory risk.',
  },
  {
    q: 'How does CEPC certification complement environmental law practice?',
    a: 'Legal expertise covers the enforcement and dispute resolution side of EPR compliance. CEPC certification adds the technical regulatory knowledge needed to guide clients through registration, target setting, and annual compliance — creating a comprehensive advisory offering.',
  },
  {
    q: 'Can environmental lawyers represent clients in CPCB proceedings after CEPC certification?',
    a: 'Yes. CEPC certification enhances your credibility in CPCB proceedings by demonstrating deep regulatory knowledge. It also gives you the technical vocabulary and framework needed to engage directly with CPCB officials on behalf of clients.',
  },
  {
    q: 'Is there a growing market for EPR legal advisory?',
    a: "Yes. CPCB's enforcement of EPR regulations has intensified significantly. The number of notices, penalties, and disputes is growing year over year — creating a substantial and growing market for legal professionals who understand EPR compliance in depth.",
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Environmental Lawyers | EPR Compass', url: 'http://localhost:3000/cepc-for-environmental-lawyers' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Environmental Lawyers | EPR Compass',
  description: 'Environmental lawyers: Get CEPC certified and move from reactive legal defense to proactive EPR compliance advisory. Build a premium practice in India\'s fastest-growing regulatory area.',
  keywords: 'CEPC environmental lawyers, EPR legal advisory India, environmental compliance law CEPC, CPCB legal counsel EPR',
  alternates: { canonical: '/cepc-for-environmental-lawyers' },
  openGraph: { title: 'CEPC for Environmental Lawyers | EPR Compass', description: 'Move from reactive defense to proactive EPR advisory. Get CEPC certified.', url: '/cepc-for-environmental-lawyers', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Environmental Lawyers', description: 'Add proactive EPR advisory to your law practice.' },
};

export default function EnvironmentalLawyersPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_environmental_lawyers"
        audienceSegment="environmental_lawyers"
        icpLabel="For Environmental Lawyers"
        heroHeadline="Add EPR Compliance Advisory to Your Environmental Law Practice"
        heroSub="Environmental lawyers who get CEPC certified can offer proactive compliance guidance — preventing the CPCB notices your clients currently call you to defend against. Higher value, longer relationships, premium fees."
        whySectionTitle="Why Environmental Lawyers Get CEPC Certified"
        whySectionSub="Reactive legal defense is valuable. Proactive compliance prevention is more valuable — and CEPC certification positions you to offer both."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your legal background within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

