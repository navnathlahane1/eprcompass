import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'Building2', title: 'FMCG Brands', desc: 'Help FMCG brands navigate EPR obligations for their extensive plastic and multi-layer packaging portfolios.' },
  { icon: 'Globe', title: 'Distributors', desc: 'Distributors handling branded goods have EPR obligations that many are unaware of.' },
  { icon: 'Briefcase', title: 'Manufacturers', desc: 'Manufacturing partners for FMCG brands face shared EPR compliance responsibilities.' },
  { icon: 'ClipboardList', title: 'Packaging Teams', desc: 'Help packaging design and sourcing teams build EPR compliance into product development.' },
  { icon: 'IndianRupee', title: 'Massive Market Opportunity', desc: "FMCG is India's largest packaging waste category — the consulting opportunity is enormous." },
  { icon: 'Award', title: 'CEPC Certification', desc: 'Get certified and position yourself as the go-to EPR compliance partner for the FMCG sector.' },
];

const FAQS = [
  {
    q: 'Why is FMCG such a large EPR compliance market?',
    a: "FMCG companies generate India's largest volume of plastic packaging waste. The sector includes hundreds of thousands of SKUs, complex multi-layer packaging, and distributed supply chains — all creating significant EPR compliance complexity and a massive advisory opportunity.",
  },
  {
    q: 'Do FMCG distributors have EPR obligations?',
    a: 'In most cases, the brand owner (producer) bears primary EPR responsibility. However, distributors who import branded goods may have their own obligations. CEPC-certified consultants can help clarify and manage these responsibilities across the supply chain.',
  },
  {
    q: 'How does EPR compliance affect FMCG product packaging decisions?',
    a: "EPR regulations incentivize producers to reduce plastic content, switch to recyclable packaging, and design for end-of-life recovery. CEPC-certified consultants can advise FMCG companies on packaging decisions that reduce their EPR liability — a growing board-level priority.",
  },
  {
    q: 'What EPR compliance services do FMCG companies need?',
    a: 'FMCG companies need help with CPCB portal registration, packaging waste quantification, PRO tie-ups, annual target compliance, multi-state compliance management, and sustainability reporting integration. This creates a comprehensive, recurring advisory engagement.',
  },
  {
    q: 'What is the earning potential for CEPC consultants in the FMCG sector?',
    a: 'FMCG EPR advisory typically commands ₹50,000–₹3,00,000+ per client per year depending on the brand size and packaging complexity. Consultants serving major FMCG brands can build substantial annual retainer revenue.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for FMCG Consultants | EPR Compass', url: 'http://localhost:3000/cepc-for-fmcg-consultants' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for FMCG Consultants | Packaging EPR | EPR Compass',
  description: 'FMCG consultants: Get CEPC certified and serve the largest packaging EPR compliance market in India. FMCG brands, distributors, and manufacturers need expert EPR advisory.',
  keywords: 'CEPC FMCG consultants, FMCG packaging EPR compliance India, plastic packaging EPR FMCG, FMCG EPR advisory consultant',
  alternates: { canonical: '/cepc-for-fmcg-consultants' },
  openGraph: { title: 'CEPC for FMCG Consultants | EPR Compass', description: "India's largest packaging EPR market. Get CEPC certified for FMCG.", url: '/cepc-for-fmcg-consultants', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for FMCG Consultants', description: 'Serve the largest EPR compliance market in India.' },
};

export default function FMCGConsultantsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_fmcg_consultants"
        audienceSegment="fmcg_consultants"
        icpLabel="For FMCG & Consumer Goods Consultants"
        heroHeadline="FMCG Brands Are Drowning in EPR Compliance Requirements. Be Their Expert Partner."
        heroSub="India's FMCG sector generates the country's largest plastic packaging waste volumes — and the EPR compliance burden that comes with it. CEPC certification positions you as the specialist advisor this massive market urgently needs."
        whySectionTitle="Why FMCG Consultants Get CEPC Certified"
        whySectionSub="FMCG is the largest EPR compliance market in India. The complexity, scale, and regulatory burden creates a massive opportunity for certified specialists."
        whyItems={WHY_ITEMS}
        formHeading="Apply for CEPC Certification"
        formSub="Submit your application and our certification team will review your FMCG background within 3 business days."
        ctaLabel="Apply for Certification"
        faqs={FAQS}
      />
    </>
  );
}

