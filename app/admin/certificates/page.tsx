export const metadata = {
  title: 'EPR Compass Registry | Admin',
  description: 'Central registry of all EPR certificates issued to clients.',
};

const rows = [
  { certNo: 'EPR/P/2025/001247', client: 'GreenPack Industries Pvt Ltd', category: 'Plastic', fy: 'FY 2025-26', issuedBy: 'CPCB', issueDate: '2025-08-12', validUntil: '2026-03-31' },
  { certNo: 'EPR/E/2025/000893', client: 'NovaTech Devices', category: 'E-Waste', fy: 'FY 2025-26', issuedBy: 'CPCB', issueDate: '2025-09-05', validUntil: '2026-03-31' },
  { certNo: 'EPR/B/2025/000412', client: 'BatteryWorld Imports', category: 'Battery', fy: 'FY 2025-26', issuedBy: 'CPCB', issueDate: '2025-10-18', validUntil: '2026-03-31' },
  { certNo: 'EPR/T/2026/000058', client: 'TyreTech Retreaders', category: 'Tyre', fy: 'FY 2026-27', issuedBy: 'CPCB', issueDate: '2026-04-02', validUntil: '2027-03-31' },
  { certNo: 'EPR/P/2024/000985', client: 'EcoPack Solutions', category: 'Plastic', fy: 'FY 2024-25', issuedBy: 'CPCB', issueDate: '2024-07-22', validUntil: '2025-03-31' },
  { certNo: 'EPR/E/2024/000641', client: 'SolarEdge Manufacturing', category: 'E-Waste', fy: 'FY 2024-25', issuedBy: 'SPCB-MH', issueDate: '2024-08-10', validUntil: '2025-03-31' },
  { certNo: 'EPR/P/2026/000102', client: 'BioGreen Polymers', category: 'Plastic', fy: 'FY 2026-27', issuedBy: 'CPCB', issueDate: '2026-04-10', validUntil: '2027-03-31' },
];

export default function AdminCertificatesPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">EPR Compass Registry</h1>
        <p className="mt-1 text-sm text-slate-400">Central registry of all EPR certificates issued to clients across waste categories.</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Cert No</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">FY</th>
              <th className="px-4 py-3">Issued By</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Valid Until</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.certNo} className="border-b border-slate-800/60">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-100">{row.certNo}</td>
                <td className="px-4 py-3 text-slate-200">{row.client}</td>
                <td className="px-4 py-3 text-slate-200">{row.category}</td>
                <td className="px-4 py-3 text-slate-200">{row.fy}</td>
                <td className="px-4 py-3 text-slate-200">{row.issuedBy}</td>
                <td className="px-4 py-3 text-slate-200">{row.issueDate}</td>
                <td className="px-4 py-3 text-slate-200">{row.validUntil}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

