import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';

export const metadata = {
  title: 'My Certificates | Client Portal',
  description: 'View and download your EPR certificates across all waste categories.',
};

export default async function PortalCertificatesPage() {
  const actor = await resolveClientActor();
  if (!actor) return <p className="p-6 text-sm text-red-700">Active client membership is required to view certificates.</p>;
  const supabase = adminClient();
  const client = { id: actor.clientId };

  // Fetch certificate documents with their linked services
  const { data: certDocs, error: certificatesError } = await supabase
    .from('documents')
    .select('id, doc_type, file_path, expiry_date, status, created_at, service_id')
    .eq('client_id', client.id)
    .ilike('doc_type', '%certificate%')
    .order('created_at', { ascending: false });

  if (certificatesError) return <p role="alert" className="p-6 text-sm text-amber-800">Certificates are temporarily unavailable. Please retry.</p>;

  // Resolve service details for waste_category
  const serviceIds = [...new Set((certDocs ?? []).map((d) => d.service_id).filter(Boolean))];

  const { data: services } = serviceIds.length
    ? await supabase
        .from('services')
        .select('id, waste_category, service_type')
        .in('id', serviceIds as string[])
    : { data: [] as Array<{ id: string; waste_category: string; service_type: string }> };

  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const now = new Date();

  const rows = (certDocs ?? []).map((doc) => {
    const svc = doc.service_id ? serviceMap.get(doc.service_id) : null;
    const uploadedDate = doc.created_at ? doc.created_at.slice(0, 10) : '-';
    const expired = doc.expiry_date ? new Date(`${doc.expiry_date}T00:00:00Z`) < now : false;

    return {
      id: doc.id,
      certNo: doc.doc_type,
      category: svc?.waste_category ?? '-',
      fy: 'Not recorded',
      issued: uploadedDate,
      validUntil: doc.expiry_date ?? '-',
      filePath: `/api/portal/certificates/${doc.id}/download`,
      expired,
      status: doc.status,
    };
  });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My Certificates</h1>
        <p className="mt-1 text-sm text-slate-600">
          Certificate documents across your registered waste categories. Upload dates are not certificate issue dates.
        </p>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No certificates have been issued yet.</p>
        </section>
      ) : (
        <>
          {/* Desktop table */}
          <section className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3">Certificate</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">FY</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Download</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={`border-b border-slate-100 ${row.expired ? 'bg-rose-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.certNo}</td>
                    <td className="px-4 py-3 text-slate-700">{row.category}</td>
                    <td className="px-4 py-3 text-slate-700">{row.fy}</td>
                    <td className="px-4 py-3 text-slate-700">{row.issued}</td>
                    <td className="px-4 py-3 text-slate-700">{row.validUntil}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                        row.expired ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {row.expired ? 'Expired' : row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={row.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Download file
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Mobile cards */}
          <section className="space-y-3 sm:hidden">
            {rows.map((row) => (
              <article key={row.id} className={`rounded-xl border p-4 ${row.expired ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{row.certNo}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    row.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                    row.expired ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {row.expired ? 'Expired' : row.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">Category: {row.category}</p>
                <p className="mt-0.5 text-xs text-slate-600">FY: {row.fy} · Uploaded {row.issued}</p>
                <p className="mt-0.5 text-xs text-slate-600">Valid until: {row.validUntil}</p>
                <a
                  href={row.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Download PDF
                </a>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
