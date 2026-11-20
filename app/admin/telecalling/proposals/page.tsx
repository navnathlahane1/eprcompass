import { createClient } from '@supabase/supabase-js';
import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import AdminProposalsClient from './_AdminProposalsClient';

export const metadata = { title: 'Proposal Management — Admin' };

async function fetchProposals() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  const [proposalsRes, interestedNoProposalRes] = await Promise.all([
    db.from('tc_proposals')
      .select(`
        id, title, status, amount_inr, valid_until, sent_at, created_at,
        lead:leads(id, company_name, name, email, phone, tc_status),
        creator:profiles!tc_proposals_created_by_fkey(id, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100),

    // Leads marked Interested with at least one Interested-disposition call but no proposal
    db.from('leads')
      .select(`
        id, company_name, name, phone, email, tc_status, tc_last_called_at,
        assigned_agent:profiles!leads_tc_assigned_agent_fkey(id, full_name)
      `)
      .eq('tc_status', 'Interested')
      .limit(100),
  ]);

  // Filter out interested leads that have proposals
  const proposalLeadIds = new Set((proposalsRes.data ?? []).map((p: any) => p.lead?.id).filter(Boolean));
  const interestedWithoutProposal = (interestedNoProposalRes.data ?? []).filter(
    (l: any) => !proposalLeadIds.has(l.id)
  );

  // Count by status
  const byStatus: Record<string, number> = {};
  for (const p of proposalsRes.data ?? []) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  return {
    proposals: proposalsRes.data ?? [],
    total: proposalsRes.count ?? 0,
    interestedWithoutProposal,
    byStatus,
  };
}

export default async function AdminProposalsPage() {
  const data = await fetchProposals();
  return (
    <div className="p-6">
      <TelecallingSubNav active="proposals" />
      <AdminProposalsClient data={data} />
    </div>
  );
}
