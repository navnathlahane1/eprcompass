import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

const badgeClass: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Filed: 'bg-indigo-100 text-indigo-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Overdue: 'bg-rose-100 text-rose-800'
};

export default async function FilingsPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6 text-sm text-red-700">Please sign in to view filings.</div>;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!client) {
    return <div className="p-6 text-sm text-slate-700">No client account is linked to this profile.</div>;
  }

  const [{ data: services }, { data: certificateDocs }] = await Promise.all([
    supabase
      .from('services')
      .select('id, service_type, waste_category, status, due_date')
      .eq('client_id', client.id)
      .order('due_date', { ascending: true }),
    supabase
      .from('documents')
      .select('service_id, file_path, doc_type')
      .eq('client_id', client.id)
      .ilike('doc_type', '%certificate%')
  ]);

  const certificateByService = new Map<string, string>();
  (certificateDocs ?? []).forEach((doc) => {
    if (doc.service_id && !certificateByService.has(doc.service_id)) {
      certificateByService.set(doc.service_id, doc.file_path);
    }
  });

  const rows = services ?? [];

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Filings</h1>
        <Link href="/portal/dashboard" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          Back to dashboard
        </Link>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Service</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Due Date</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const certPath = certificateByService.get(row.id);
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-slate-900">{row.service_type}</td>
                  <td className="px-4 py-3 text-slate-700">{row.waste_category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass[row.status] || 'bg-slate-100 text-slate-700'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.due_date || '-'}</td>
                  <td className="px-4 py-3">
                    {certPath ? (
                      <a
                        href={certPath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Download Certificate
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">Not available</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {rows.map((row) => {
          const certPath = certificateByService.get(row.id);
          return (
            <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{row.service_type}</p>
              <p className="mt-1 text-xs text-slate-600">Category: {row.waste_category}</p>
              <p className="mt-1 text-xs text-slate-600">Due: {row.due_date || '-'}</p>
              <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass[row.status] || 'bg-slate-100 text-slate-700'}`}>
                {row.status}
              </span>
              <div className="mt-3">
                {certPath ? (
                  <a
                    href={certPath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Download Certificate
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">Certificate not available</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
