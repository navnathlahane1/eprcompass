import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'TrendingUp', title: 'Collection Systems', desc: 'Design and implement EPR-compliant collection systems for your manufacturing and brand clients.' },
  { icon: 'Globe', title: 'Reverse Logistics', desc: 'EPR regulations are the primary driver of reverse logistics adoption in India — be the expert.' },
  { icon: 'ClipboardList', title: 'Traceability', desc: 'Implement traceability frameworks that satisfy CPCB EPR compliance reporting requirements.' },
  { icon: 'ShieldCheck', title: 'Compliance Reporting', desc: 'Guide clients through EPR portal filings, annual reports, and CPCB compliance submissions.' },
  { icon: 'IndianRupee', title: 'Higher Value Engagements', desc: 'Turn supply chain expertise into premium environmental compliance consulting opportunities.' },
  { icon: 'Award', title: 'CEPC Certification', desc: 'Get certified and formally offer EPR compliance advisory alongside your supply chain practice.' },
];

const FAQS = [
  {
    q: 'How does supply chain expertise apply to EPR compliance?',
    a: 'EPR compliance requires building take-back systems, collection networks, reverse logistics, and traceability — all core supply chain competencies. CEPC-certified supply chain consultants can design EPR-compliant systems and advise clients on the regulatory requirements simultaneously.',
  },
  {
    q: 'What is the link between EPR and reverse logistics?',
    a: "EPR regulations require producers to fund the collection and recycling of their products at end-of-life. This has made reverse logistics a regulatory necessity — not just a cost-saving opportunity. India's EPR framework is creating one of the world's fastest-growing reverse logistics markets.",
  },
  {
    q: 'Can supply chain consultants advise on EPR portal filings?',
    a: 'After CEPC certification, yes. The certification covers the regulatory requirements including CPCB portal registration, annual target setting, PRO tie-ups, and annual compliance reporting. This allows supply chain consultants to offer end-to-end EPR advisory.',
  },
  {
    q: 'How does EPR compliance create recurring revenue for supply chain consultants?',
    a: 'EPR compliance is an ongoing annual obligation — not a one-time project. Clients require support for annual target revisions, portal filings, PRO performance monitoring, and compliance reporting every year. This creates predictable, recurring consulting revenue.',
  },
  {
    q: 'Which industries need supply chain EPR advisory most urgently?',
    a: 'FMCG, electronics, consumer durables, automotive, pharmaceuticals, and e-commerce are among the highest-obligation sectors. Supply chain consultants in these verticals have an immediate and large addressable market.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Supply Chain Consultants | EPR Compass', url: 'http://localhost:3000/cepc-for-supply-chain-consultants' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Supply Chain Consultants | EPR Compliance | EPR Compass',
  description: 'Supply chain consultants: Get CEPC certified and add EPR compliance advisory to your practice. Reverse logistics, collection systems, and compliance reporting for your clients.',
  keywords: 'CEPC supply chain consultants, EPR reverse logistics India, supply chain EPR compliance, collection system EPR advisory',
  alternates: { canonical: '/cepc-for-supply-chain-consultants' },
  openGraph: { title: 'CEPC for Supply Chain Consultants | EPR Compass', description: 'Your supply chain expertise is perfect for EPR compliance advisory. Get certified.', url: '/cepc-for-supply-chain-consultants', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Supply Chain Consultants', description: 'Add EPR advisory to your supply chain practice.' },
};

export default function SupplyChainConsultantsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_supply_chain_consultants"
        audienceSegment="supply_chain_consultants"
        icpLabel="For Supply Chain Consultants"
        heroHeadline="Your Supply Chain Expertise Gives You an Unfair Advantage in EPR Compliance Consulting"
        heroSub="EPR regulations are driving India's reverse logistics revolution. Collection systems, traceability, and take-back programs are all supply chain challenges — and CEPC certification makes you the compliance expert who can design and implement them."
        whySectionTitle="Why Supply Chain Consultants Get CEPC Certified"
        whySectionSub="EPR compliance is fundamentally a supply chain challenge. Your existing expertise is your biggest competitive advantage."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your supply chain background within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

