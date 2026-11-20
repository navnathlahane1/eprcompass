import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tendering Portal – Sign In | EPR Compass' };

export default function TenderingLoginPage() {
  return (
    <SimpleLoginForm
      title="Tendering Portal"
      subtitle="Government and private tender management — discovery, bidding, evaluation, and contract tracking."
      dashboardPath="/tendering/dashboard"
      requiredRole={['tendering_manager', 'tendering_executive', 'admin']}
      accent="indigo"
      portal="tendering"
      showPortalSwitcher={false}
      showHelpLink={false}
      footerNote="Tendering team access only"
      features={[
        'Track tender deadlines and EMD dates',
        'Prepare and submit competitive bids',
        'Vendor empanelment and evaluation',
        'Contract register and milestone tracking',
      ]}
    />
  );
}

