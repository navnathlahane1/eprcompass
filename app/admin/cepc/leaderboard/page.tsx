import CEPCLeaderboardClient from './CEPCLeaderboardClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function CEPCLeaderboardPage() {
  const supabase = await createServerComponentClient();

  const [{ data: consultants }, { data: leads }, { data: earnings }] = await Promise.all([
    (supabase as any)
      .from('cepc_consultants')
      .select('id, full_name, certification_tier, state, created_at')
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('cepc_leads')
      .select('id, cepc_id, stage, submitted_at'),
    (supabase as any)
      .from('cepc_earnings')
      .select('id, cepc_id, gross_revenue_inr, commission_inr, period_month')
  ]);

  const rows = (consultants || []).map((c: any) => {
    const ownLeads = (leads || []).filter((l: any) => l.cepc_id === c.id);
    const ownEarnings = (earnings || []).filter((e: any) => e.cepc_id === c.id);
    return {
      ...c,
      leads: ownLeads,
      earnings: ownEarnings
    };
  });

  return <CEPCLeaderboardClient initialRows={rows} />;
}
