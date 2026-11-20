import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'ShieldCheck', title: 'Plastic Packaging EPR', desc: 'Most importers are unaware of their plastic packaging EPR obligations under CPCB regulations.' },
  { icon: 'BookOpen', title: 'E-Waste EPR', desc: 'Electronics and electrical equipment importers face mandatory E-Waste EPR compliance requirements.' },
  { icon: 'Award', title: 'Battery EPR', desc: 'Battery importers are subject to growing EPR obligations under the Battery Waste Management Rules.' },
  { icon: 'IndianRupee', title: 'Premium Advisory Practice', desc: 'Build a high-value EPR advisory practice on top of your existing import consulting relationships.' },
  { icon: 'TrendingUp', title: 'Proactive Compliance', desc: 'Help importers stay compliant before regulatory notices arrive — and become their preferred advisor.' },
  { icon: 'Users', title: 'Importer Network Leverage', desc: 'Your established importer network is your biggest asset in building an EPR consulting practice.' },
];

const FAQS = [
  {
    q: 'Which importers have EPR obligations?',
    a: 'Importers of products packaged in plastic, electronics, electrical equipment, batteries, tyres, and lubricants all have EPR obligations under CPCB regulations. This includes importers of goods for retail sale as well as industrial importers.',
  },
  {
    q: 'How does EPR compliance work for importers?',
    a: 'Importers must register on the CPCB EPR portal as a Producer (since they are responsible for products entering India), set annual collection and recycling targets, tie up with CPCB-registered PROs or recyclers, and file annual compliance reports.',
  },
  {
    q: 'What happens if importers don\'t comply with EPR regulations?',
    a: 'Non-compliant importers face CPCB regulatory notices, penalties, and potential restrictions on import licenses. The consequences are becoming increasingly severe as CPCB enforcement tightens.',
  },
  {
    q: 'Can import consultants add EPR advisory without environmental background?',
    a: 'Yes. The CEPC training program covers all regulatory requirements from scratch. Import consultants bring the most valuable asset — client relationships and trust. The regulatory knowledge is fully covered in the 60-hour training.',
  },
  {
    q: 'How much can import consultants earn from EPR advisory?',
    a: 'EPR advisory for importers typically ranges from ₹15,000–₹50,000 per client per year depending on the product category and compliance complexity. Consultants managing 10–20 importer clients can generate ₹1.5L–₹10L+ annually from EPR advisory alone.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for Import Consultants | EPR Compass', url: 'http://localhost:3000/cepc-for-import-consultants' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for Import Consultants | EPR Compliance | EPR Compass',
  description: 'Import consultants: Your importer clients face EPR obligations they don\'t know about. Get CEPC certified and be the trusted advisor who helps them comply before CPCB notices arrive.',
  keywords: 'CEPC import consultants, EPR compliance importers India, importer EPR advisory, CPCB importer registration, import EPR consulting',
  alternates: { canonical: '/cepc-for-import-consultants' },
  openGraph: { title: 'CEPC for Import Consultants | EPR Compass', description: 'Help importers navigate EPR obligations. Get CEPC certified.', url: '/cepc-for-import-consultants', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for Import Consultants', description: 'Your importer clients need EPR compliance. Get certified.' },
};

export default function ImportConsultantsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_import_consultants"
        audienceSegment="import_consultants"
        icpLabel="For Import & Trade Consultants"
        heroHeadline="Your Import Clients Have EPR Obligations They Don't Know About. Be the Advisor Who Tells Them."
        heroSub="Electronics, battery, plastic packaging, and tyre importers are all subject to CPCB EPR regulations. Your existing importer relationships are your most valuable asset for building a high-income EPR advisory practice."
        whySectionTitle="Why Import Consultants Get CEPC Certified"
        whySectionSub="Importers face growing EPR obligations across multiple waste categories. Position yourself as their go-to compliance advisor before regulatory notices arrive."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your profile within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

