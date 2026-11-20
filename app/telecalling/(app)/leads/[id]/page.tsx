import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { createClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import LeadDetailClient from './LeadDetailClient';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export default async function TelecallerLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor) redirect('/telecalling/login');

  const db = makeServiceClient();

  const [leadRes, callsRes, followupsRes, enrichRes] = await Promise.all([
    db.from('leads').select('*').eq('id', id).maybeSingle(),
    db.from('tc_calls')
      .select('*, agent:profiles!tc_calls_agent_id_fkey(full_name)')
      .eq('lead_id', id)
      .eq('agent_id', actor.userId)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('tc_followups')
      .select('*')
      .eq('lead_id', id)
      .eq('assigned_to', actor.userId)
      .eq('status', 'Pending')
      .order('scheduled_for', { ascending: true })
      .limit(10),
    db.from('tc_lead_enrichments').select('*').eq('lead_id', id).maybeSingle(),
  ]);

  if (!leadRes.data) notFound();

  return (
    <LeadDetailClient
      lead={leadRes.data}
      calls={callsRes.data || []}
      followups={followupsRes.data || []}
      enrichment={enrichRes.data}
    />
  );
}
