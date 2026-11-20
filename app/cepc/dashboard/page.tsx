import CEPCDashboardClient from './CEPCDashboardClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildCepcSetupSteps } from '@/components/setup/setupSteps';

export default async function CEPCDashboardPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6 text-sm text-red-700">Please sign in to access CEPC dashboard.</div>;
  }

  const { data: consultant } = await (supabase as any)
    .from('cepc_consultants')
    .select('id, full_name, certification_tier, state, status, training_completed')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!consultant) {
    return <div className="p-6 text-sm text-slate-700">No CEPC consultant profile linked to this account.</div>;
  }

  const [{ data: leads }, { data: earnings }] = await Promise.all([
    (supabase as any)
      .from('cepc_leads')
      .select('id, client_company, contact_name, phone, state, waste_categories, service_interest, stage, deal_value_inr, submitted_at, notes')
      .eq('cepc_id', consultant.id)
      .order('submitted_at', { ascending: false }),
    (supabase as any)
      .from('cepc_earnings')
      .select('id, gross_revenue_inr, commission_pct, commission_inr, payment_status, period_month, paid_at')
      .eq('cepc_id', consultant.id)
      .order('period_month', { ascending: false })
  ]);

  const cepcSetupSteps = buildCepcSetupSteps({
    hasProfile: !!(consultant.full_name && consultant.state),
    hasCertificationTier: !!(consultant.certification_tier),
    hasState: !!(consultant.state),
    hasSubmittedLead: (leads || []).length > 0,
    isActive: consultant.status === 'Active',
    trainingCompleted: !!consultant.training_completed,
  });

  return (
    <div className="space-y-4">
      <SetupGuideWidget
        steps={cepcSetupSteps}
        portalKey={`cepc-${user.id}`}
        accentColor="violet"
      />
      <CEPCDashboardClient
        consultant={consultant}
        initialLeads={leads || []}
        initialEarnings={earnings || []}
      />
    </div>
  );
}
