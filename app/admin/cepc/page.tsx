import CEPCDirectoryClient from './CEPCDirectoryClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function CEPCDirectoryPage() {
  const supabase = await createServerComponentClient();

  const [{ data: consultants }, { data: leads }, { data: earnings }] = await Promise.all([
    (supabase as any)
      .from('cepc_consultants')
      .select('id, profile_id, full_name, email, phone, state, city, certification_tier, territory_states, territory_cities, status, onboarding_stage, agreement_signed, assigned_manager, revenue_share_pct, created_at')
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('cepc_leads')
      .select('id, cepc_id, client_company, stage, deal_value_inr, submitted_at')
      .order('submitted_at', { ascending: false }),
    (supabase as any)
      .from('cepc_earnings')
      .select('id, cepc_id, gross_revenue_inr, commission_inr, payment_status, period_month')
      .order('period_month', { ascending: false })
  ]);

  const leadsByCepc = new Map<string, any[]>();
  (leads || []).forEach((row: any) => {
    if (!leadsByCepc.has(row.cepc_id)) leadsByCepc.set(row.cepc_id, []);
    leadsByCepc.get(row.cepc_id)?.push(row);
  });

  const earningsByCepc = new Map<string, any[]>();
  (earnings || []).forEach((row: any) => {
    if (!earningsByCepc.has(row.cepc_id)) earningsByCepc.set(row.cepc_id, []);
    earningsByCepc.get(row.cepc_id)?.push(row);
  });

  const rows = (consultants || []).map((c: any) => {
    const ownLeads = leadsByCepc.get(c.id) || [];
    const ownEarnings = earningsByCepc.get(c.id) || [];

    const leadsSubmitted = ownLeads.length;
    const converted = ownLeads.filter((l: any) => l.stage === 'Converted').length;
    const revenueGenerated = ownEarnings.reduce((sum: number, e: any) => sum + Number(e.gross_revenue_inr || 0), 0);
    const commissionDue = ownEarnings
      .filter((e: any) => e.payment_status !== 'Paid')
      .reduce((sum: number, e: any) => sum + Number(e.commission_inr || 0), 0);

    return {
      ...c,
      leadsSubmitted,
      converted,
      revenueGenerated,
      commissionDue,
      recentLeads: ownLeads.slice(0, 5),
      earningsSummary: ownEarnings
    };
  });

  return <CEPCDirectoryClient initialRows={rows} />;
}
