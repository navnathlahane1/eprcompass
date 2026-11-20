import { redirect } from 'next/navigation';
import { createServerComponentClient } from '../../../../lib/supabase/createServerComponentClient';
import BroadcastClient from './BroadcastClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

export default async function BroadcastPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin' && !isSuperAdmin(user.email)) redirect('/admin/dashboard');

  const [{ data: leads }, { data: clients }, { data: partners }, { data: clientProfiles }] = await Promise.all([
    (supabase as any).from('wa_lead_captures').select('phone_no, name').order('captured_at', { ascending: false }).limit(300),
    (supabase as any).from('clients').select('id, profile_id').limit(300),
    (supabase as any).from('partners').select('id, company_name, phone').limit(300),
    (supabase as any).from('profiles').select('id, company_name, full_name, phone').limit(500)
  ]);

  const profileMap = new Map<string, any>((clientProfiles || []).map((p: any) => [p.id, p]));
  const clientContacts = (clients || [])
    .map((c: any) => {
      const p = profileMap.get(c.profile_id);
      if (!p?.phone) return null;
      return { phone: p.phone, label: p.company_name || p.full_name || 'Client', type: 'client' as const };
    })
    .filter(Boolean) as Array<{ phone: string; label: string; type: 'client' }>;

  const leadContacts = (leads || [])
    .filter((l: any) => Boolean(l.phone_no))
    .map((l: any) => ({ phone: l.phone_no, label: l.name || l.phone_no, type: 'lead' as const }));

  const partnerContacts = (partners || [])
    .filter((p: any) => Boolean(p.phone))
    .map((p: any) => ({ phone: p.phone, label: p.company_name || p.phone, type: 'partner' as const }));

  const contacts = [...clientContacts, ...leadContacts, ...partnerContacts];

  return (
    <div className="space-y-4 p-4 text-slate-100 sm:p-6">
      <h1 className="text-xl font-semibold">WhatsApp Broadcast</h1>
      <BroadcastClient contacts={contacts} />
    </div>
  );
}
