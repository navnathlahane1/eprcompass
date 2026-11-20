import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Access Manager – Sign In | EPR Compass' };

export default function IamLoginPage() {
  return (
    <SimpleLoginForm
      title="Access Manager"
      subtitle="Identity & access control portal. Manage user accounts, roles, and portal access across the platform."
      dashboardPath="/iam/dashboard"
      requiredRole={['user_manager', 'admin', 'manager']}
      accent="gray"
      portal="iam"
      showPortalSwitcher={false}
      showHelpLink={false}
      footerNote="Restricted operator access"
      features={[
        'Create & manage all portal users',
        'Assign roles & control portal access',
        'Ban / reinstate user accounts',
        'Full audit trail of all changes',
      ]}
    />
  );
}

