import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Legal Portal – Sign In | EPR Compass' };

export default function LegalPortalLoginPage() {
  return (
    <SimpleLoginForm
      title="Legal Portal"
      subtitle="Document verification and compliance review for recycler onboarding."
      dashboardPath="/legal-portal/dashboard"
      requiredRole="legal"
      accent="indigo"
      portal="legal-portal"
      features={[
        'Review and verify recycler documents with full audit trail',
        'Track document history, verifier names, timestamps, and notes',
        'Review CPCB certificates, registration docs, and compliance records',
        'Issue or revoke verification badges for onboarded recyclers',
      ]}
      footerNote="EPR Compass © 2025"
    />
  );
}

