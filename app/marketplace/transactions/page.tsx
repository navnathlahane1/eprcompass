import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import TransactionsClient from './TransactionsClient';

export default async function TransactionsPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?returnUrl=/marketplace/transactions');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['admin', 'manager'].includes(profile?.role || '')) redirect('/marketplace');

  const [{ data: rows }, { data: clients }, { data: recyclers }, { data: profiles }] = await Promise.all([
    (supabase as any)
      .from('credit_transactions')
      .select('id, listing_id, buyer_client_id, seller_recycler_id, waste_category, quantity_kg, quantity_mt, agreed_rate_per_kg_inr, agreed_rate_inr, total_value_inr, platform_fee_inr, status, requested_at, approved_at, completed_at, approved_by, cpcb_transfer_ref, notes')
      .order('requested_at', { ascending: false }),
    (supabase as any)
      .from('clients')
      .select('id, profile_id'),
    (supabase as any)
      .from('recyclers')
      .select('id, company_name, contact_person'),
    (supabase as any)
      .from('profiles')
      .select('id, full_name, company_name')
  ]);

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  const clientMap = new Map<string, any>((clients || []).map((c: any) => [c.id, c]));
  const recyclerMap = new Map<string, any>((recyclers || []).map((r: any) => [r.id, r]));

  const hydrated = (rows || []).map((row: any) => {
    const buyerClient = clientMap.get(row.buyer_client_id);
    const buyerProfile = buyerClient ? profileMap.get(buyerClient.profile_id) : null;
    const recycler = recyclerMap.get(row.seller_recycler_id);
    const approver = row.approved_by ? profileMap.get(row.approved_by) : null;

    return {
      ...row,
      buyer_name: buyerProfile?.company_name || buyerProfile?.full_name || row.buyer_client_id,
      recycler_name: recycler?.company_name || recycler?.contact_person || row.seller_recycler_id,
      approver_name: approver?.full_name || approver?.company_name || null
    };
  });

  return <TransactionsClient initialRows={hydrated} />;
}
