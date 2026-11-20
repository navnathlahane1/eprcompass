import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'Building2', title: 'Industry Associations', desc: 'Provide EPR compliance guidance as a core member benefit and differentiate your association.' },
  { icon: 'Globe', title: 'Chambers of Commerce', desc: "Help chamber members navigate India's evolving EPR landscape with expert-backed compliance programs." },
  { icon: 'Users', title: 'Sector Bodies', desc: 'Sector-specific EPR compliance knowledge creates unique value for your member organizations.' },
  { icon: 'Briefcase', title: 'Business Councils', desc: 'Position your council as the authoritative EPR resource for your member businesses.' },
  { icon: 'BookOpen', title: 'Member Training Programs', desc: 'Offer compliance workshops and awareness programs that add measurable value to your membership.' },
  { icon: 'IndianRupee', title: 'Consulting Opportunities', desc: 'Create new revenue streams for your association through EPR compliance services and consulting.' },
];

const FAQS = [
  {
    q: 'How can trade associations add EPR compliance as a member benefit?',
    a: 'Trade associations can offer EPR compliance guidance, workshops, and advisory services to member businesses. By getting CEPC certified, association executives and representatives can formally advise members on their obligations, host compliance awareness programs, and create a new value-added service.',
  },
  {
    q: 'What EPR obligations do association members typically have?',
    a: 'Members who manufacture, import, or sell products covered by EPR regulations (plastic packaging, electronics, batteries, tyres, lubricants) have mandatory registration and compliance obligations with CPCB. Many are unaware of these obligations until notices arrive.',
  },
  {
    q: 'Can a trade association become a CEPC-certified advisory body?',
    a: 'Individual representatives of the trade association can get CEPC certified. This allows the association to formally offer EPR compliance advisory and training as part of its member services — positioning the association as an authoritative compliance resource.',
  },
  {
    q: 'How does EPR compliance advisory create revenue for trade associations?',
    a: 'Associations can charge members for EPR compliance workshops, one-on-one advisory sessions, compliance audits, and portal filing assistance. This creates a new revenue stream alongside membership fees.',
  },
  {
    q: 'Is there bulk pricing or group enrollment for trade associations?',
    a: 'Yes. We offer group enrollment pricing for associations looking to certify multiple representatives. Contact our team through the application form for custom pricing based on the number of seats.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Trade Associations | EPR Compass', url: 'http://localhost:3000/cepc-for-trade-associations' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Trade Associations & Chambers | EPR Compass',
  description: 'Trade associations and chambers: Make EPR compliance your most valued member benefit. Get CEPC certified and help your members navigate CPCB regulations with confidence.',
  keywords: 'CEPC trade associations, EPR chambers of commerce, industry association EPR compliance, trade association CPCB advisory India',
  alternates: { canonical: '/cepc-for-trade-associations' },
  openGraph: { title: 'CEPC for Trade Associations | EPR Compass', description: 'Make EPR compliance your most valued member benefit. Get certified.', url: '/cepc-for-trade-associations', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Trade Associations', description: 'Help your members navigate EPR compliance.' },
};

export default function TradeAssociationsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_trade_associations"
        audienceSegment="trade_associations"
        icpLabel="For Trade Associations & Chambers"
        heroHeadline="Make EPR Compliance the Most Valued Benefit You Offer Your Members"
        heroSub="Industry associations and chambers of commerce that provide expert EPR compliance guidance retain members, attract new ones, and generate additional revenue. CEPC certification gives you the credentials to do this formally."
        whySectionTitle="Why Trade Associations Get CEPC Certified"
        whySectionSub="Your member businesses need EPR guidance. Be the authoritative resource they turn to — and generate new revenue for your association in the process."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your profile within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

