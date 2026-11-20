import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PartnerLeadsClient from './PartnerLeadsClient';

export const metadata = { title: 'My Leads | Partner Portal' };

export default async function PartnerLeadsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners')
    .select('id, company_name')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  const { data: leads } = await (supabase as any)
    .from('partner_leads')
    .select('id, client_company, contact_name, phone, email, state, waste_categories, service_interest, stage, deal_value_inr, notes, submitted_at, updated_at')
    .eq('partner_id', partner.id)
    .order('submitted_at', { ascending: false });

  return <PartnerLeadsClient partnerId={partner.id} initialLeads={leads || []} />;
}
