import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import EnrichmentBadge from '@/components/telecalling/EnrichmentBadge';
import FollowupWidget from '@/components/telecalling/FollowupWidget';
import LeadDetailClient from './LeadDetailClient';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await db().from('leads').select('company_name').eq('id', id).maybeSingle();
  return { title: data?.company_name ? `${data.company_name} — TC Lead` : 'Lead Detail' };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = db();

  const [leadRes, callsRes, followupsRes, enrichmentRes] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).maybeSingle(),
    supabase.from('tc_calls')
      .select(`*, agent:profiles!tc_calls_agent_id_fkey(full_name)`)
      .eq('lead_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('tc_followups')
      .select('*').eq('lead_id', id).eq('status', 'Pending')
      .order('scheduled_for', { ascending: true }).limit(5),
    supabase.from('tc_lead_enrichments').select('*').eq('lead_id', id).maybeSingle(),
  ]);

  if (!leadRes.data) notFound();

  return (
    <div className="p-6">
      <TelecallingSubNav active="leads" />
      <LeadDetailClient
        lead={leadRes.data}
        calls={callsRes.data || []}
        followups={followupsRes.data || []}
        enrichment={enrichmentRes.data}
      />
    </div>
  );
}
