import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Finance Portal – Sign In | EPR Compass' };

export default function FinanceLoginPage() {
  return (
    <SimpleLoginForm
      title="Finance Portal"
      subtitle="Invoice management, payment tracking and financial reporting for EPR compliance services."
      dashboardPath="/finance/dashboard"
      requiredRole={['cfo', 'finance_executive', 'admin']}
      accent="green"
      portal="finance"
      showPortalSwitcher={false}
      showHelpLink={false}
      footerNote="Finance team access only"
      features={[
        'Create and send client invoices',
        'Track payment status in real time',
        'Manage deal-to-invoice workflows',
        'Financial reports & revenue analytics',
      ]}
    />
  );
}

