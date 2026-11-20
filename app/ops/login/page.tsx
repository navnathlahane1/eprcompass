import SimpleLoginForm from '@/components/auth/SimpleLoginForm';

export const metadata = { title: 'Operations Portal — Login' };

export default function OpsLoginPage() {
  return (
    <SimpleLoginForm
      title="Operations Portal"
      subtitle="EPR Compass — WFH Team Operations Hub"
      dashboardPath="/ops/dashboard"
      requiredRole={[
        'admin', 'manager',
        'virtual_assistant', 'proposal_executive', 'compliance_doc_executive',
        'market_research_executive', 'mis_reporting_executive',
        'lead_gen_executive', 'appointment_setter', 'crm_data_executive',
        'customer_support_executive',
      ]}
      accent="gray"
      portal="ops"
      showPortalSwitcher={false}
      showHelpLink={false}
      footerNote="EPR Compass internal staff portal"
      features={[
        'Task Management & Daily Logs',
        'Check-in / Check-out Tracking',
        'Role-specific Workspaces',
        'Onboarding & Training',
      ]}
    />
  );
}

