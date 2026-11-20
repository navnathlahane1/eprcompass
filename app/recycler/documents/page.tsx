import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Documents | Recycler Portal',
  description: 'Manage compliance documents, authorisations, and certificates.',
};

const DOC_TYPE_COLOR: Record<string, string> = {
  'CPCB Cert': 'bg-emerald-100 text-emerald-800',
  'GST': 'bg-blue-100 text-blue-800',
  'Agreement': 'bg-purple-100 text-purple-800',
  'Capacity Report': 'bg-amber-100 text-amber-800',
  'Bank Details': 'bg-teal-100 text-teal-800',
  'Other': 'bg-slate-100 text-slate-600',
};

const STATUS_COLOR: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Verified: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
  Expired: 'bg-slate-100 text-slate-600',
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function RecyclerDocumentsPage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recycler } = await (supabase as any)
    .from('recyclers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle();

  if (!recycler) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-sm text-slate-600">
            Your recycler profile is not linked to this account. Contact EPR Compass support.
          </p>
        </div>
      </div>
    );
  }

  const { data: documents } = await (supabase as any)
    .from('recycler_documents')
    .select('id, doc_type, file_path, expiry_date, status, uploaded_at')
    .eq('recycler_id', recycler.id)
    .order('uploaded_at', { ascending: false });

  const rows: any[] = documents ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Compliance documents, authorisations, and certificates on file.
        </p>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">
            No documents on file. Contact support to upload your compliance documents.
          </p>
        </section>
      ) : (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Valid Until</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Download</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const dl = daysUntil(row.expiry_date);
                return (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            DOC_TYPE_COLOR[row.doc_type] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.doc_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          STATUS_COLOR[row.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(row.uploaded_at)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(row.expiry_date)}</td>
                    <td className="px-4 py-3">
                      {dl === null ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : dl <= 0 ? (
                        <span className="text-xs font-bold text-red-600">Expired</span>
                      ) : dl <= 30 ? (
                        <span className="text-xs font-medium text-amber-600">{dl}d left</span>
                      ) : (
                        <span className="text-xs text-slate-500">{dl}d left</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.file_path ? (
                        <a
                          href={row.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

