import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import CampaignStatusBadge from '@/components/telecalling/CampaignStatusBadge';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await db().from('tc_campaigns').select('name').eq('id', id).maybeSingle();
  return { title: data?.name ? `${data.name} — Campaign` : 'Campaign' };
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = db();

  const [campaignRes, leadsRes, callsRes] = await Promise.all([
    supabase.from('tc_campaigns').select('*').eq('id', id).maybeSingle(),
    supabase.from('leads').select('id, company, contact_name, phone, tc_status, tc_call_count').eq('tc_campaign_id', id).limit(20),
    supabase.from('tc_calls')
      .select('id, status, disposition, created_at, agent:profiles!tc_calls_agent_id_fkey(full_name)')
      .eq('campaign_id', id).order('created_at', { ascending: false }).limit(20),
  ]);

  if (!campaignRes.data) notFound();
  const campaign = campaignRes.data;

  return (
    <div className="p-6">
      <TelecallingSubNav active="campaigns" />
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/telecalling/campaigns" className="text-sm text-slate-500 hover:text-slate-400">← Campaigns</Link>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-slate-100">{campaign.name}</h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>

        {campaign.description && (
          <p className="text-slate-400 mb-6">{campaign.description}</p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-1">Type</div>
            <div className="font-semibold text-slate-100">{campaign.type || 'Outbound'}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-1">Daily Limit</div>
            <div className="font-semibold text-slate-100">{campaign.daily_call_limit || '—'}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
            <div className="text-xs text-slate-500 mb-1">Leads</div>
            <div className="font-semibold text-slate-100">{leadsRes.data?.length || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
            <h2 className="font-semibold text-slate-100 mb-4">Leads in Campaign</h2>
            {(leadsRes.data || []).length === 0 ? (
              <p className="text-sm text-slate-500">No leads assigned</p>
            ) : (
              <div className="space-y-2">
                {(leadsRes.data || []).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60 last:border-0">
                    <Link href={`/admin/telecalling/leads/${lead.id}`} className="font-medium text-blue-400 hover:underline">{lead.company_name || lead.company || '—'}</Link>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{lead.tc_status || 'New'}</span>
                      <span>{lead.tc_call_count || 0} calls</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
            <h2 className="font-semibold text-slate-100 mb-4">Recent Calls</h2>
            {(callsRes.data || []).length === 0 ? (
              <p className="text-sm text-slate-500">No calls yet</p>
            ) : (
              <div className="space-y-2">
                {(callsRes.data || []).map((call: any) => (
                  <div key={call.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-400">{call.agent?.full_name || 'Unknown'}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">{call.disposition || call.status}</span>
                      <span className="text-slate-500">{new Date(call.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
