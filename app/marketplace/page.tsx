import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import MarketplaceClient from './MarketplaceClient';
import { isCpcbCertLive } from '@/lib/recyclers/certGate';

export default async function MarketplacePage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?returnUrl=/marketplace');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || '';
  if (!['admin', 'manager', 'client', 'recycler', 'partner', 'cepc'].includes(role)) {
    redirect('/dashboard');
  }

  const [{ data: listings }, { data: txRows }, { data: client }, { data: requestedRows }] = await Promise.all([
    (supabase as any)
      .from('credit_listings')
      .select('id, recycler_id, waste_category, credit_type, quantity_available_kg, quantity_available_mt, rate_per_kg_inr, rate_per_mt_inr, min_order_kg, min_order_mt, validity_date, cpcb_cert_ref, status, listed_at, expires_at, recyclers!inner(id, company_name, contact_person, cpcb_cert_no, cpcb_cert_expiry)')
      .order('listed_at', { ascending: false }),
    (supabase as any)
      .from('credit_transactions')
      .select('id, status, requested_at')
      .gte('requested_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .order('requested_at', { ascending: false }),
    role === 'client'
      ? (supabase as any)
          .from('clients')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    (supabase as any)
      .from('credit_transactions')
      .select('id, listing_id, quantity_kg, quantity_mt, status, requested_at')
      .eq('status', 'Requested')
      .order('requested_at', { ascending: false })
  ]);

  const pendingByListing = new Map<string, any>();
  (requestedRows || []).forEach((row: any) => {
    if (!pendingByListing.has(row.listing_id)) {
      pendingByListing.set(row.listing_id, row);
    }
  });

  const liveListings = (listings || []).filter((row: any) => {
    const recycler = Array.isArray(row.recyclers) ? row.recyclers[0] : row.recyclers;
    return isCpcbCertLive(recycler?.cpcb_cert_no, recycler?.cpcb_cert_expiry);
  });

  const enrichedListings = liveListings.map((row: any) => {
    const pending = pendingByListing.get(row.id);
    return {
      ...row,
      requested_tx_id: pending?.id || null,
      requested_qty_kg: pending?.quantity_kg || ((pending?.quantity_mt || 0) * 1000) || null
    };
  });

  return (
    <MarketplaceClient
      role={role}
      buyerClientId={client?.id || null}
      initialListings={enrichedListings}
      initialMonthTransactions={txRows || []}
    />
  );
}
