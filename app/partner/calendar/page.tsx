import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import CalendarClient from './CalendarClient';

export const metadata = { title: 'Deadline Calendar | Partner Portal' };

export default async function PartnerCalendarPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners').select('id').eq('profile_id', user.id).maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  let clientIds: string[] = [];
  try {
    const { data } = await (supabase as any)
      .from('partner_clients')
      .select('client_id')
      .eq('partner_id', partner.id);
    clientIds = (data || []).map((r: any) => r.client_id).filter(Boolean);
  } catch { clientIds = []; }

  let events: any[] = [];
  if (clientIds.length > 0) {
    try {
      const { data: services } = await (supabase as any)
        .from('services')
        .select('id, client_id, service_type, waste_category, status, due_date')
        .in('client_id', clientIds)
        .not('due_date', 'is', null);

      const { data: pcs } = await (supabase as any)
        .from('partner_clients')
        .select('client_id, clients:client_id(id, profiles:profile_id(company_name, full_name))')
        .eq('partner_id', partner.id);

      const clientMap: Record<string, string> = {};
      for (const pc of (pcs || [])) {
        const name = pc.clients?.profiles?.company_name || pc.clients?.profiles?.full_name || 'Unknown';
        clientMap[pc.client_id] = name;
      }

      events = (services || []).map((s: any) => ({
        clientName: clientMap[s.client_id] || 'Unknown',
        category: s.waste_category || '—',
        serviceType: s.service_type || '—',
        dueDate: s.due_date,
        status: s.status || 'Pending',
        clientId: s.client_id,
      }));
    } catch { events = []; }
  }

  return <CalendarClient events={events} />;
}
