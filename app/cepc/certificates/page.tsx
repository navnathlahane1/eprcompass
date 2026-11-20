export const metadata = {
  title: 'My Certificates | CEPC Portal',
  description: 'View and download your CEPC certification documents.',
};

const certs = [
  { name: 'Certified EPR Professional — Plastic', issued: '2025-03-15', expiry: '2028-03-14' },
  { name: 'Certified EPR Professional — Tyre', issued: '2025-09-20', expiry: '2028-09-19' },
  { name: 'EPR Filing Specialist', issued: '2026-01-10', expiry: '2029-01-09' },
  { name: 'E-Waste Compliance Advisor (Provisional)', issued: '2026-03-28', expiry: '2027-03-27' },
];

export default function CepcCertificatesPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My Certificates</h1>
        <p className="mt-1 text-sm text-slate-600">Certifications earned through the CEPC programme.</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3">Certificate</th>
              <th className="px-4 py-3">Issued Date</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Download</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.name} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-700">{c.issued}</td>
                <td className="px-4 py-3 text-slate-700">{c.expiry}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
