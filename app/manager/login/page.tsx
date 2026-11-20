import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Compliance Manager – Sign In | EPR Compass' };

export default function ManagerLoginPage() {
  return (
    <SimpleLoginForm
      title="Compliance Manager"
      subtitle="Manage EPR filing statuses, review client documents, and track compliance deadlines for your assigned clients."
      dashboardPath="/manager/dashboard"
      requiredRole={['manager', 'admin']}
      accent="teal"
      portal="manager"
      showPortalSwitcher={false}
      showHelpLink={false}
      footerNote="Restricted to compliance managers only"
      features={[
        'View & update EPR filing statuses',
        'Review client-submitted documents',
        'Track SLA deadlines and compliance health',
        'Manage only your assigned clients',
      ]}
    />
  );
}

