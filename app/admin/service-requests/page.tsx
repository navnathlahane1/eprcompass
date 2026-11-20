import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { redirect } from 'next/navigation';
import ServiceRequestsAdminClient from './ServiceRequestsAdminClient';

export const metadata = { title: 'Service Requests | Admin' };

export default async function ServiceRequestsAdminPage() {
  const actor = await resolveActor();
  if (!actor?.isAdmin) redirect('/admin/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: requests } = await (db as any)
    .from('service_requests')
    .select(`
      id, category, subject, priority, status, created_at,
      clients ( id, profiles!clients_profile_id_fkey ( full_name, company_name ) ),
      profiles!service_requests_assigned_to_fkey ( id, full_name ),
      service_request_quotes ( total_amount, quote_status )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Service Requests</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Review, quote, and manage client service requests.
          </p>
        </div>
      </div>

      <ServiceRequestsAdminClient requests={requests || []} />
    </div>
  );
}
