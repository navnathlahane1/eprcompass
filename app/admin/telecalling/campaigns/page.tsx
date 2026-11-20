import { createClient } from '@supabase/supabase-js';
import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';
import CampaignsClient from './CampaignsClient';

export const metadata = { title: 'TC Campaigns' };

async function fetchCampaigns() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { data } = await db.from('tc_campaigns').select('*').order('created_at', { ascending: false });
  return data || [];
}

export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns();
  return (
    <div className="p-6">
      <TelecallingSubNav active="campaigns" />
      <CampaignsClient initialCampaigns={campaigns} />
    </div>
  );
}
