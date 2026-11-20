import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import PartnerTasksClient from './PartnerTasksClient';

export const metadata = { title: 'My Tasks | Partner Portal' };

export default async function PartnerTasksPage() {
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

  const { data: tasks } = await (supabase as any)
    .from('partner_tasks')
    .select('id, title, description, client_name, priority, status, due_date, completed_at, created_at')
    .eq('partner_id', partner.id)
    .order('due_date', { ascending: true, nullsFirst: false });

  return <PartnerTasksClient partnerId={partner.id} initialTasks={tasks || []} />;
}
