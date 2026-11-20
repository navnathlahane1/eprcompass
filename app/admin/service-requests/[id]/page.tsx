import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ServiceRequestAdminDetail from './ServiceRequestAdminDetail';

export const metadata = { title: 'Service Request Detail | Admin' };

export default async function ServiceRequestAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await resolveActor();
  if (!actor?.isAdmin) redirect('/admin/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [requestResult, adminsResult] = await Promise.all([
    (db as any)
      .from('service_requests')
      .select(`
        id, client_id, profile_id, category, subject, description,
        priority, status, rejection_reason,
        approved_at, rejected_at, completed_at, created_at, updated_at,
        clients (
          id,
          profiles!clients_profile_id_fkey ( id, full_name, company_name, phone )
        ),
        profiles!service_requests_assigned_to_fkey ( id, full_name ),
        service_request_quotes (
          id, service_fee, govt_fee, tax_amount, total_amount,
          notes, estimated_timeline, quote_status, sent_at, approved_at, rejected_at, created_by
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
      .maybeSingle(),

    (db as any)
      .from('profiles')
      .select('id, full_name')
      .in('role', ['admin', 'manager'])
      .order('full_name'),
  ]);

  const request = requestResult.data;
  if (!request) notFound();

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/service-requests" className="hover:text-teal-600 transition">
          Service Requests
        </Link>
        <span>/</span>
        <span className="text-slate-100 font-medium truncate max-w-[260px]">{request.subject}</span>
      </div>

      <ServiceRequestAdminDetail
        request={request}
        adminProfiles={adminsResult.data || []}
        actorId={actor.userId}
      />
    </div>
  );
}
