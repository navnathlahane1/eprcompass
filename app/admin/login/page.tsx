import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin – Sign In | EPR Compass' };

export default function AdminLoginPage() {
  return (
    <SimpleLoginForm
      title="Admin Panel"
      subtitle="Restricted access. Sign in with your admin or manager account."
      dashboardPath="/admin/dashboard"
      accent="gray"
      portal="admin"
      showHelpLink={false}
      requiredRole={['admin', 'manager', 'sales-executive', 'epr-executive', 'operator', 'hr-executive', 'training-executive']}
    />
  );
}

