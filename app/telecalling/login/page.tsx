import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Telecalling – Sign In | EPR Compass' };

export default function TelecallingLoginPage() {
  return (
    <SimpleLoginForm
      title="Telecalling"
      subtitle="CRM for outbound EPR leads, follow-ups, and proposal tracking."
      dashboardPath="/telecalling/dashboard"
      requiredRole={[
        'telecaller', 'tc_team_lead', 'tc_senior_agent', 'tc_quality_analyst',
        'tc_campaign_manager', 'tc_trainer', 'lead_gen_executive', 'appointment_setter',
        'crm_data_executive', 'customer_support_executive', 'sales-executive', 'admin', 'manager',
      ]}
      accent="teal"
      portal="telecalling"
      showPortalSwitcher
      showHelpLink={false}
      footerNote="Telecalling workspace"
      features={[
        'Lead inbox, scripts, and call outcomes',
        'Follow-ups and SLA reminders',
        'Proposal send and conversion tracking',
        'Team lead views for agents and pipeline',
      ]}
    />
  );
}

