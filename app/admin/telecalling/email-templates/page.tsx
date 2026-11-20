import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import AdminEmailTemplatesPage from './AdminEmailTemplatesPage';

export const metadata = { title: 'Email Templates' };

export default function AdminTelecallingEmailTemplatesPage() {
  return (
    <div className="p-6">
      <TelecallingSubNav active="emails" />
      <AdminEmailTemplatesPage />
    </div>
  );
}
