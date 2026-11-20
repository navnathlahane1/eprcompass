import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Recycler Portal – Sign In | EPR Compass' };

export default function RecyclerLoginPage() {
  return (
    <SimpleLoginForm
      title="Recycler Portal"
      subtitle="Earn ₹8K–₹30K per tonne on EPR credits. AI-matched tenders, live auctions, and corporate sourcing — built for India's registered recycler network."
      dashboardPath="/recycler-portal/dashboard"
      requiredRole="recycler"
      accent="teal"
      portal="recycler"
      features={[
        'AI tender match scoring — filtered by category, state & capacity',
        'Live auction rooms with real-time rank tracking & countdown',
        'Corporate sourcing requests with 5-round negotiation threads',
        'CPCB regulatory alerts filtered to your waste categories',
      ]}
      footerNote="EPR Compass © 2025"
    />
  );
}

