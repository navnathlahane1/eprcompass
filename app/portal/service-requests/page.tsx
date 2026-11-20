import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/lib/serviceRequests/constants';
import type { ServiceRequestStatus, ServiceRequestPriority } from '@/lib/serviceRequests/constants';

export const metadata = { title: 'Service Requests | Client Portal' };

export default async function ServiceRequestsPortalPage() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== 'client') redirect('/portal/login');

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: client } = await (db as any)
    .from('clients').select('id').eq('profile_id', authUser.id).maybeSingle();

  const { data: requests } = client
    ? await (db as any)
        .from('service_requests')
        .select(`id, category, subject, priority, status, created_at,
                 service_request_quotes ( total_amount, quote_status )`)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Service Requests</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Request additional EPR services and track their progress.
          </p>
        </div>
        <Link
          href="/portal/service-requests/new"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition"
        >
          + New Request
        </Link>
      </div>

      {/* Empty state */}
      {!requests?.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-semibold text-slate-800">No service requests yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Submit a new request to get started with additional EPR services.
          </p>
          <Link
            href="/portal/service-requests/new"
            className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition"
          >
            Request a Service
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map((r: {
                id: string; category: string; subject: string;
                priority: string; status: string; created_at: string;
                service_request_quotes?: { total_amount: number; quote_status: string }[];
              }) => {
                const quote = r.service_request_quotes?.[0];
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 truncate max-w-[200px]">{r.subject}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.category}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[r.priority as ServiceRequestPriority] || 'bg-slate-100 text-slate-600'}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status as ServiceRequestStatus] || 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                      {r.status === 'Quote Sent' && (
                        <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" title="Action required" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 hidden md:table-cell">
                      {quote?.total_amount
                        ? `₹${Number(quote.total_amount).toLocaleString('en-IN')}`
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/portal/service-requests/${r.id}`}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
