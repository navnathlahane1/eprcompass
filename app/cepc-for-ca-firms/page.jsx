import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'Briefcase', title: 'Your Clients Trust You', desc: 'Your clients already trust you with compliance. Extend that trust into environmental regulatory advisory.' },
  { icon: 'ShieldCheck', title: 'Critical Regulatory Requirement', desc: 'EPR is becoming a mandatory compliance obligation — your clients need guidance before penalties arrive.' },
  { icon: 'IndianRupee', title: 'New Revenue Vertical', desc: 'Generate additional revenue for your firm by offering EPR advisory alongside your existing services.' },
  { icon: 'Building2', title: 'Manufacturing & Import Clients', desc: 'Firms serving manufacturing, import, and brand owner clients are perfectly positioned to offer EPR compliance.' },
  { icon: 'Users', title: 'Tax Consultants', desc: 'Tax professionals can unlock a new compliance advisory vertical with minimal additional investment.' },
  { icon: 'Award', title: 'Manufacturing Client Specialists', desc: 'Deep client relationships in manufacturing and imports give you a head start in EPR consulting.' },
];

const FAQS = [
  {
    q: 'Why should CA firms get CEPC certified?',
    a: 'CA firms serving manufacturing, importing, and brand-owner clients are perfectly positioned to offer EPR compliance advisory. These clients face mandatory EPR obligations and trust their CA for all compliance needs. CEPC certification lets you capture this revenue in-house rather than referring clients elsewhere.',
  },
  {
    q: 'Which CA clients need EPR compliance?',
    a: 'Clients who manufacture plastic-packaged goods, import electronics or batteries, produce tyres, or deal with used oil all have EPR obligations under CPCB regulations. This covers a large portion of typical manufacturing and trading CA clientele.',
  },
  {
    q: 'Can tax consultants also apply for CEPC?',
    a: 'Yes. Tax consultants, ROC agents, and compliance advisory firms can all apply. The CEPC training covers the environmental regulatory framework from scratch — no prior environmental knowledge is required.',
  },
  {
    q: 'How does EPR compliance fit with existing CA services?',
    a: 'EPR compliance is a separate regulatory vertical that sits naturally alongside GST, Income Tax, and ROC compliance. You can bundle it into your annual retainer offering or offer it as a standalone advisory service.',
  },
  {
    q: 'What is the earning potential for CA firms with CEPC certification?',
    a: 'Certified consultants managing 15–20 manufacturing clients typically earn ₹1L–₹2L+ per month from EPR advisory alone. Firms with larger client bases can build significant recurring revenue streams.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService',
      name: 'CEPC Certification for CA Firms | EPR Compass',
      description: 'CA and CS firms: Get CEPC certified and offer EPR compliance to your manufacturing and import clients. Government-recognized credential.',
      url: 'http://localhost:3000/cepc-for-ca-firms',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export const metadata = {
  title: 'CEPC Certification for CA Firms | EPR Compliance Advisory | EPR Compass',
  description: 'CA firms: Your manufacturing and import clients need EPR compliance. Get CEPC certified and be the first advisor they call. Earn ₹50K–₹2L+/month.',
  keywords: 'CEPC certification CA firms, EPR compliance CA, CA EPR advisory, chartered accountant EPR, manufacturing client compliance India',
  alternates: { canonical: '/cepc-for-ca-firms' },
  openGraph: {
    title: 'CEPC Certification for CA Firms | EPR Compass',
    description: 'Your manufacturing and import clients need EPR compliance. Get CEPC certified and be their first call.',
    url: '/cepc-for-ca-firms',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'CEPC for CA Firms', description: 'Add EPR advisory to your CA practice. ₹50K–₹2L+/month.' },
};

export default function CAFirmsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_ca_firms"
        audienceSegment="ca_firms"
        icpLabel="For CA Firms & Tax Consultants"
        heroHeadline="Your Manufacturing & Import Clients Need EPR Compliance. Be the First Advisor They Call."
        heroSub="Expand beyond GST, Income Tax, and ROC filings. Build a new consulting vertical focused on EPR Compliance for manufacturers, importers, and brand owners — clients who already trust you."
        whySectionTitle="Why CA Firms Get CEPC Certified"
        whySectionSub="Your clients trust you with compliance. EPR is becoming a critical regulatory requirement — be the advisor they call first, before a CPCB notice arrives."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your profile within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

