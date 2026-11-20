import FreelancerNetworkClient from '@/components/landing/FreelancerNetworkClient';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService',
      name: 'EPR Freelancer Network | EPR Compass',
      description: 'Join India\'s leading EPR compliance freelancer network. Earn on hourly basis, work flexible hours, access verified client opportunities across India.',
      url: 'http://localhost:3000/freelancer-network',
      provider: { '@type': 'Organization', name: 'EPR Compass' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who can join the EPR freelancer network?',
          acceptedAnswer: { '@type': 'Answer', text: 'Environmental consultants, existing EPR consultants, sustainability professionals, ESG consultants, waste management professionals, former Pollution Control Board officials, compliance experts, and independent consultants with relevant experience can join the network.' },
        },
        {
          '@type': 'Question',
          name: 'What is the onboarding fee for the freelancer network?',
          acceptedAnswer: { '@type': 'Answer', text: 'The one-time onboarding fee is ₹999. This covers profile verification, network access, training resources, opportunity matching, and freelancer onboarding.' },
        },
        {
          '@type': 'Question',
          name: 'How are freelancers matched with clients?',
          acceptedAnswer: { '@type': 'Answer', text: 'Our team matches freelancers with client assignments based on expertise, availability, and location. After profile verification and orientation, you start receiving relevant consulting opportunities.' },
        },
        {
          '@type': 'Question',
          name: 'How long does profile verification take?',
          acceptedAnswer: { '@type': 'Answer', text: 'Profile verification typically takes 3 business days after your application and onboarding fee payment are received.' },
        },
        {
          '@type': 'Question',
          name: 'What types of consulting work do freelancers get?',
          acceptedAnswer: { '@type': 'Answer', text: 'Freelancers receive hourly consulting assignments, project-based engagements, client support activities, compliance documentation work, environmental audits, and EPR consulting projects.' },
        },
      ],
    },
  ],
};

export const metadata = {
  title: 'Join EPR Freelancer Network | Environmental Compliance Consulting | EPR Compass',
  description: 'Join India\'s leading EPR compliance freelancer network. Earn on hourly basis, work from anywhere, access verified client opportunities. ₹999 one-time joining fee.',
  keywords: 'EPR freelancer network India, environmental compliance freelancer, EPR consultant freelance, CPCB compliance freelancer jobs India',
  alternates: { canonical: '/freelancer-network' },
  openGraph: {
    title: 'Join EPR Freelancer Network | EPR Compass',
    description: 'Earn on hourly basis. Work from anywhere. Access verified EPR compliance consulting opportunities across India.',
    url: '/freelancer-network',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join EPR Freelancer Network',
    description: 'Environmental compliance expertise + our client network = income on your terms.',
  },
};

export default function FreelancerNetworkPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FreelancerNetworkClient />
    </>
  );
}

