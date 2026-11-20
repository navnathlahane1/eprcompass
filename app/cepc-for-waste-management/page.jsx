import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'TrendingUp', title: 'Expand Beyond Operations', desc: 'Instead of serving only operational waste requirements, move into advisory and compliance services.' },
  { icon: 'IndianRupee', title: 'Recurring Consulting Revenue', desc: 'Create deeper client relationships and generate recurring EPR compliance consulting income.' },
  { icon: 'Briefcase', title: 'Strategic Partner Role', desc: 'Evolve from a service vendor into a strategic compliance partner for your waste management clients.' },
  { icon: 'ShieldCheck', title: 'Compliance Expertise', desc: 'Your operational experience with waste gives you a unique advantage in EPR compliance advisory.' },
  { icon: 'Users', title: 'Deeper Client Relationships', desc: 'EPR compliance creates long-term engagement with clients beyond one-time waste collection contracts.' },
  { icon: 'Award', title: 'Certified EPR Consultant', desc: 'Get CEPC certified and formally position your organization as an EPR compliance advisor.' },
];

const FAQS = [
  {
    q: 'How can waste management companies benefit from CEPC certification?',
    a: 'Waste management companies already have operational relationships with producers and brand owners who have EPR obligations. CEPC certification allows you to move from vendor to strategic compliance partner — offering advisory services on top of collection and processing.',
  },
  {
    q: 'What is the difference between EPR operations and EPR compliance advisory?',
    a: 'EPR operations involves physical collection, transport, and processing of waste. EPR compliance advisory involves helping producers register on the CPCB portal, set targets, tie up with PROs, file annual reports, and maintain regulatory compliance. The advisory side commands significantly higher fees.',
  },
  {
    q: 'Can a waste management company become a PRO with CEPC certification?',
    a: 'CEPC certification enables compliance advisory. Becoming a CPCB-registered PRO (Producer Responsibility Organization) is a separate registration process. However, CEPC-certified consultants can guide producers through PRO tie-up agreements as part of their advisory services.',
  },
  {
    q: 'How does EPR advisory change the revenue model for waste management companies?',
    a: 'Traditional waste management revenue is transactional and volume-based. EPR compliance advisory creates a retainer-based recurring revenue model where clients pay monthly or annually for ongoing compliance management — regardless of waste volumes.',
  },
  {
    q: 'How quickly can a waste management professional get CEPC certified?',
    a: 'The 60-hour training typically takes 4–6 weeks to complete. Waste management professionals often complete it faster due to their existing operational knowledge of waste categories and collection systems.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Waste Management Professionals | EPR Compass', url: 'http://localhost:3000/cepc-for-waste-management' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Waste Management Professionals | EPR Compass',
  description: 'Waste management professionals: Get CEPC certified and evolve from service vendor to strategic EPR compliance partner. Add high-margin advisory to your existing operations.',
  keywords: 'CEPC waste management, EPR compliance waste professionals, waste management EPR advisory India, PRO EPR consulting',
  alternates: { canonical: '/cepc-for-waste-management' },
  openGraph: { title: 'CEPC for Waste Management Professionals | EPR Compass', description: 'Evolve from waste vendor to EPR compliance partner. Get CEPC certified.', url: '/cepc-for-waste-management', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Waste Management', description: 'Add EPR advisory to your waste management business.' },
};

export default function WasteManagementPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_waste_management"
        audienceSegment="waste_management"
        icpLabel="For Waste Management Professionals"
        heroHeadline="Your Waste Management Experience Is the Foundation for a High-Value EPR Compliance Business"
        heroSub="You understand waste operations better than anyone. CEPC certification adds the regulatory advisory layer that transforms your vendor relationships into strategic compliance partnerships — with recurring revenue."
        whySectionTitle="Why Waste Management Professionals Get CEPC Certified"
        whySectionSub="Operational expertise is your advantage. Now add the advisory layer that turns your client relationships into high-margin, recurring revenue streams."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your profile within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

