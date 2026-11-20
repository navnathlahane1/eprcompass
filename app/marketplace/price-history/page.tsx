import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PriceHistoryClient from './PriceHistoryClient';

export default async function PriceHistoryPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?returnUrl=/marketplace/price-history');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['admin', 'manager', 'client', 'recycler', 'partner', 'cepc'].includes(profile?.role || '')) redirect('/dashboard');

  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const [{ data: history }, { data: transactions }] = await Promise.all([
    (supabase as any)
      .from('credit_price_history')
      .select('id, waste_category, credit_type, rate_inr, recorded_date, source')
      .gte('recorded_date', since.toISOString().slice(0, 10))
      .order('recorded_date', { ascending: true }),
    (supabase as any)
      .from('credit_transactions')
      .select('id, waste_category, quantity_kg, quantity_mt, agreed_rate_per_kg_inr, agreed_rate_inr, total_value_inr, completed_at, status')
      .eq('status', 'Completed')
      .order('completed_at', { ascending: false })
      .limit(10)
  ]);

  return <PriceHistoryClient historyRows={history || []} completedRows={transactions || []} />;
}
