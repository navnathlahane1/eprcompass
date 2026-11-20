import CepcLandingClient from '@/components/landing/CepcLandingClient';

const WHY_ITEMS = [
  { icon: 'Users', title: 'Team Training', desc: 'Enroll multiple team members and build comprehensive internal EPR compliance capabilities.' },
  { icon: 'Award', title: 'Certification', desc: 'All enrolled employees receive CEPC certification — a recognized credential in environmental compliance.' },
  { icon: 'ShieldCheck', title: 'Compliance Awareness', desc: 'Build organization-wide awareness of EPR obligations before regulatory notices arrive.' },
  { icon: 'TrendingUp', title: 'Workforce Upskilling', desc: 'EPR expertise becomes a competitive advantage as environmental regulations expand across industries.' },
  { icon: 'BookOpen', title: 'EHS Team Capability', desc: 'Upskill your EHS, Sustainability, and Compliance teams with structured, certified EPR knowledge.' },
  { icon: 'IndianRupee', title: 'Cost Savings', desc: 'Internal EPR expertise reduces dependence on external consultants and helps avoid costly compliance penalties.' },
];

const FAQS = [
  {
    q: 'Why should companies build internal EPR expertise?',
    a: 'External EPR consultants are expensive, and their knowledge leaves when the engagement ends. Companies with internal CEPC-certified teams can manage ongoing compliance, identify risks proactively, and reduce their dependence on external advisors — saving significantly over time.',
  },
  {
    q: 'Which internal teams benefit most from CEPC certification?',
    a: 'EHS (Environmental, Health & Safety), Sustainability, Compliance, Procurement, Packaging, and Operations teams are the primary beneficiaries. Any team involved in manufacturing, packaging decisions, or regulatory reporting can benefit from EPR compliance knowledge.',
  },
  {
    q: 'Can HR teams use CEPC certification as an L&D offering?',
    a: 'Yes. CEPC certification is a formal credential that can be included in L&D programs, used as a succession planning tool, and offered as a professional development benefit for compliance and sustainability professionals.',
  },
  {
    q: 'Is there group pricing for corporate team enrollment?',
    a: 'Yes. We offer corporate group pricing for companies looking to certify 3 or more employees. Contact us through the application form for custom pricing based on team size and certification tier requirements.',
  },
  {
    q: 'How does internal EPR expertise help during CPCB audits?',
    a: 'CPCB auditors expect companies to have knowledgeable compliance staff. Internal CEPC-certified employees can respond authoritatively to audit inquiries, demonstrate compliance management capability, and represent the company credibly in regulatory interactions.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'ProfessionalService', name: 'CEPC Certification for HR & L&D Teams | Corporate EPR Training | EPR Compass', url: 'http://localhost:3000/cepc-for-hr-and-ld' },
    { '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
};

export const metadata = {
  title: 'CEPC Certification for HR & L&D Teams | Corporate EPR Training | EPR Compass',
  description: 'HR and L&D teams: Build internal EPR compliance expertise across your organization. Enroll EHS, Sustainability, and Compliance teams in India\'s leading CEPC certification program.',
  keywords: 'CEPC corporate training, EPR compliance L&D, HR EPR certification teams India, corporate environmental compliance training CEPC',
  alternates: { canonical: '/cepc-for-hr-and-ld' },
  openGraph: { title: 'CEPC for HR & L&D Teams | EPR Compass', description: 'Build internal EPR expertise. Enroll your compliance teams in CEPC certification.', url: '/cepc-for-hr-and-ld', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'CEPC for HR & L&D Teams', description: 'Build internal EPR compliance expertise across your organization.' },
};

export default function HRandLDPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CepcLandingClient
        moduleKey="cepc_hr_and_ld"
        audienceSegment="hr_and_ld"
        icpLabel="For HR & L&D Teams"
        heroHeadline="Build Internal EPR Expertise Across Your Organization"
        heroSub="Train your EHS, Sustainability, Compliance, and Operations teams through India's leading CEPC Certification Program. Build the internal environmental compliance capability your organization needs — before CPCB comes knocking."
        whySectionTitle="Corporate Enrollment Benefits"
        whySectionSub="Organizations that build internal EPR expertise reduce consultant dependence, avoid compliance penalties, and create a competitive advantage in an era of expanding environmental regulation."
        whyItems={WHY_ITEMS}
        formHeading="Enroll Your Team"
        formSub="Submit your enrollment request and our team will get back to you within 3 business days with a corporate training plan."
        ctaLabel="Enroll Your Team"
        faqs={FAQS}
      />
    </>
  );
}

