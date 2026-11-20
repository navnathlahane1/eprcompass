import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PriceHistoryClient from './PriceHistoryClient';

export default async function AdminPriceHistoryPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['admin', 'manager'].includes(profile?.role || '')) redirect('/admin/dashboard');

  const { data: history } = await (supabase as any)
    .from('credit_price_history')
    .select('*')
    .order('recorded_date', { ascending: false })
    .limit(100);

  return <PriceHistoryClient initialHistory={history || []} currentUserId={user.id} />;
}
