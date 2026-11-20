import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PartnerDashboardClient from './PartnerDashboardClient';
import PartnerSetupPrompt from './PartnerSetupPrompt';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildPartnerSetupSteps } from '@/components/setup/setupSteps';

export interface ComplianceAlert {
  clientId: string;
  clientName: string;
  issueType: 'overdue' | 'cert_expiring' | 'renewal_due';
  daysUntil: number;
}

export default async function PartnerDashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: partner } = await (supabase as any)
    .from('partners')
    .select('id, company_name, partner_type, partner_tier, partner_status, persona_label, state, city, contact_person, email, phone, outreach_tier, stage, commission_type, commission_value, agreement_signed, nda_signed, kit_sent, training_completed, portal_access, assigned_rm, portal_user_id, csm_id, contract_date, contract_renewal_date')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!partner) {
    return <PartnerSetupPrompt />;
  }

  // Fetch manager, portal user, CSM, checklist, and live stats in parallel
  const [
    { data: manager },
    { data: portalUser },
    { data: csm },
    { data: checklist },
    { count: totalClients },
    { data: leads },
    { data: earnings },
    { count: openTasks },
    { data: partnerClients },
  ] = await Promise.all([
    partner.assigned_rm
      ? (supabase as any).from('profiles').select('id, full_name, email').eq('id', partner.assigned_rm).maybeSingle()
      : Promise.resolve({ data: null }),
    partner.portal_user_id
      ? (supabase as any).from('profiles').select('id, full_name, email').eq('id', partner.portal_user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    partner.csm_id
      ? (supabase as any).from('profiles').select('id, full_name, email').eq('id', partner.csm_id).maybeSingle()
      : Promise.resolve({ data: null }),
    (supabase as any)
      .from('onboarding_checklists')
      .select('id, steps, completion_pct, updated_at')
      .eq('entity_type', 'partner')
      .eq('entity_id', partner.id)
      .maybeSingle(),
    (supabase as any)
      .from('partner_clients')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', partner.id),
    (supabase as any)
      .from('partner_leads')
      .select('id, stage')
      .eq('partner_id', partner.id),
    (supabase as any)
      .from('partner_earnings')
      .select('commission_inr, payment_status')
      .eq('partner_id', partner.id),
    (supabase as any)
      .from('partner_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', partner.id)
      .in('status', ['Open', 'In Progress']),
    (supabase as any)
      .from('partner_clients')
      .select('client_id, clients:client_id(id, renewal_date, status, profiles:profile_id(company_name, full_name))')
      .eq('partner_id', partner.id),
  ]);

  const openLeads = (leads || []).filter((l: any) => !['Converted', 'Lost'].includes(l.stage)).length;
  const pendingEarnings = (earnings || [])
    .filter((e: any) => e.payment_status !== 'Paid')
    .reduce((sum: number, e: any) => sum + Number(e.commission_inr || 0), 0);
  const totalEarned = (earnings || [])
    .filter((e: any) => e.payment_status === 'Paid')
    .reduce((sum: number, e: any) => sum + Number(e.commission_inr || 0), 0);

  const stats = {
    totalClients: totalClients ?? 0,
    openLeads,
    pendingEarnings,
    totalEarned,
    openTasks: openTasks ?? 0,
  };

  // Compute compliance alerts
  const clientIds = (partnerClients || []).map((pc: any) => pc.client_id).filter(Boolean);
  let services: any[] = [];
  if (clientIds.length > 0) {
    try {
      const { data: svcData } = await (supabase as any)
        .from('services')
        .select('client_id, status, due_date, certificate_expiry')
        .in('client_id', clientIds);
      services = svcData || [];
    } catch { services = []; }
  }

  const today = new Date();
  const alerts: ComplianceAlert[] = [];
  const clientNameMap: Record<string, string> = {};
  for (const pc of (partnerClients || [])) {
    const c = pc.clients;
    if (!c) continue;
    const name = c.profiles?.company_name || c.profiles?.full_name || 'Unknown';
    clientNameMap[c.id] = name;
    if (c.renewal_date) {
      const days = Math.ceil((new Date(c.renewal_date).getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 30) {
        alerts.push({ clientId: c.id, clientName: name, issueType: 'renewal_due', daysUntil: days });
      }
    }
  }
  for (const s of services) {
    const name = clientNameMap[s.client_id] || 'Unknown';
    if (s.due_date && new Date(s.due_date) < today && !['approved', 'completed', 'Certificate Issued'].includes(s.status?.toLowerCase())) {
      const days = Math.ceil((today.getTime() - new Date(s.due_date).getTime()) / 86400000);
      if (!alerts.find(a => a.clientId === s.client_id && a.issueType === 'overdue')) {
        alerts.push({ clientId: s.client_id, clientName: name, issueType: 'overdue', daysUntil: -days });
      }
    }
    if (s.certificate_expiry) {
      const days = Math.ceil((new Date(s.certificate_expiry).getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 30) {
        if (!alerts.find(a => a.clientId === s.client_id && a.issueType === 'cert_expiring')) {
          alerts.push({ clientId: s.client_id, clientName: name, issueType: 'cert_expiring', daysUntil: days });
        }
      }
    }
  }

  const totalLeads = (leads || []).length;
  const convertedLeads = (leads || []).filter((l: any) => l.stage === 'Converted').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const partnerSetupSteps = buildPartnerSetupSteps({
    hasProfile: !!(partner.company_name && partner.contact_person && partner.phone),
    agreementSigned: !!partner.agreement_signed,
    trainingCompleted: !!partner.training_completed,
    kitSent: !!partner.kit_sent,
    hasSubmittedLead: (leads || []).length > 0,
    portalAccessEnabled: !!partner.portal_access,
    ndaSigned: !!partner.nda_signed,
  });

  return (
    <div className="space-y-4">
      <SetupGuideWidget
        steps={partnerSetupSteps}
        portalKey={`partner-${user.id}`}
        accentColor="teal"
      />
      <PartnerDashboardClient
        partner={partner}
        manager={manager || null}
        portalUser={portalUser || null}
        csm={csm || null}
        checklist={checklist || null}
        stats={stats}
        alerts={alerts}
        conversionRate={conversionRate}
      />
    </div>
  );
}
