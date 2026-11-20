import type { Metadata } from 'next';
import SimpleLoginForm from '@/components/auth/SimpleLoginForm';

export const metadata: Metadata = { title: 'Knowledge Hub – Sign In | EPR Compass' };

export default function KnowledgeLoginPage() {
  return (
    <SimpleLoginForm
      title="Knowledge Hub"
      subtitle="Your team's library of documents and training materials."
      dashboardPath="/knowledge/dashboard"
      requiredRole={[
        'admin', 'manager',
        'knowledge_admin', 'knowledge_manager', 'knowledge_contributor', 'knowledge_viewer',
      ]}
      accent="teal"
      showPortalSwitcher={false}
      showForgotPassword={false}
      showHelpLink={false}
      footerNote="Knowledge Hub team access only"
      features={[
        'Browse all internal documents & training materials',
        'Filter by type, category, and tags',
        'Upload SOPs, decks, guides & training resources',
        'Secure, role-based access managed via IAM',
      ]}
    />
  );
}

