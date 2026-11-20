import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ServiceRequestPortalDetail from './ServiceRequestPortalDetail';

export const metadata = { title: 'Service Request | Client Portal' };

export default async function ServiceRequestPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== 'client') redirect('/portal/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', authUser.id).maybeSingle();

  const { data: request } = await (db as any)
    .from('service_requests')
    .select(`
      id, client_id, category, subject, description, priority, status,
      rejection_reason, approved_at, rejected_at, completed_at, created_at, updated_at,
      profiles!service_requests_assigned_to_fkey ( full_name ),
      service_request_quotes (
        id, service_fee, govt_fee, tax_amount, total_amount,
        notes, estimated_timeline, quote_status, sent_at, approved_at, rejected_at
      ),
      service_request_messages (
        id, content, is_internal, created_at,
        profiles!service_request_messages_author_id_fkey ( id, full_name, role )
      ),
      service_request_status_logs (
        id, from_status, to_status, note, created_at,
        profiles!service_request_status_logs_changed_by_fkey ( full_name )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (!request) notFound();
  if (!client || request.client_id !== client.id) redirect('/portal/service-requests');

  // Filter internal messages
  request.service_request_messages = (request.service_request_messages || []).filter(
    (m: { is_internal: boolean }) => !m.is_internal
  );

  // Sort
  request.service_request_messages?.sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  request.service_request_status_logs?.sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/portal/service-requests" className="hover:text-teal-600 transition">
          Service Requests
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-[200px]">{request.subject}</span>
      </div>
      <ServiceRequestPortalDetail request={request} />
    </div>
  );
}
