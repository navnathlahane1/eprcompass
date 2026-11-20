import type { Metadata } from 'next';
import SimpleLoginForm from '@/components/auth/SimpleLoginForm';

export const metadata: Metadata = { title: 'Comms Portal – Sign In | EPR Compass' };

export default function CommsLoginPage() {
  return (
    <SimpleLoginForm
      title="Comms Command Centre"
      subtitle="Marketing & communications workspace for the EPR Compass team."
      dashboardPath="/comms/dashboard"
      requiredRole={[
        'admin', 'manager',
        'comms_cmo', 'comms_brand_manager', 'comms_regional_manager',
        'comms_campaign_manager', 'comms_social_media_manager', 'comms_content_strategist',
        'comms_content_creator', 'comms_graphic_designer', 'comms_community_manager',
        'comms_performance_specialist', 'comms_pr_manager', 'comms_influencer_manager',
        'comms_marketing_analyst', 'comms_marketing_ops', 'comms_marketing_intern',
      ]}
      accent="teal"
      showPortalSwitcher={false}
      showForgotPassword={false}
      showHelpLink={false}
      footerNote="Comms team access only"
      features={[
        'Manage all social media accounts & credentials',
        'AI-powered content generation & brand voice',
        'Publish directly to LinkedIn, Twitter & more',
        'Analytics, performance feedback & team approvals',
      ]}
    />
  );
}

