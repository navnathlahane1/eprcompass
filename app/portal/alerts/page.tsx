import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import PriceAlertsClient from './PriceAlertsClient';

export default async function PriceAlertsPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6 text-sm text-red-700">Please sign in to view alerts.</div>;
  }

  const { data: client } = await (supabase as any)
    .from('clients')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!client) {
    return <div className="p-6 text-sm text-slate-700">No client account is linked to this profile.</div>;
  }

  const [{ data: alerts }, { data: rates }] = await Promise.all([
    (supabase as any)
      .from('credit_price_alerts')
      .select('id, waste_category, target_rate_inr, alert_type, channel, status, created_at, triggered_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('credit_price_history')
      .select('id, waste_category, rate_inr, recorded_date')
      .order('recorded_date', { ascending: false })
      .limit(200)
  ]);

  return (
    <PriceAlertsClient
      clientId={client.id}
      initialAlerts={alerts || []}
      historyRows={rates || []}
    />
  );
}
