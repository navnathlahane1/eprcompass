import { createServerComponentClient } from '../../../lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import ListingsClient from './ListingsClient';

export default async function ListingsPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?returnUrl=/marketplace/listings');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['admin', 'manager'].includes(profile?.role || '')) redirect('/marketplace');

  const [{ data: listings }, { data: recyclers }] = await Promise.all([
    (supabase as any)
      .from('credit_listings')
      .select('id, recycler_id, waste_category, credit_type, quantity_available_kg, quantity_available_mt, rate_per_kg_inr, rate_per_mt_inr, min_order_kg, min_order_mt, validity_date, cpcb_cert_ref, status, listed_at, expires_at')
      .order('listed_at', { ascending: false }),
    (supabase as any)
      .from('recyclers')
      .select('id, company_name, contact_person')
      .order('company_name', { ascending: true })
  ]);

  return <ListingsClient initialRows={listings || []} recyclerOptions={recyclers || []} />;
}
