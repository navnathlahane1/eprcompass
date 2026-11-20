import FirstLoginPasswordChange from '@/components/auth/FirstLoginPasswordChange';

export default function AdminChangePasswordPage() {
  return <FirstLoginPasswordChange portalName="Admin Panel" redirectPath="/admin/dashboard" accent="rose" />;
}
