export const metadata = {
  title: 'Referred Leads | CEPC Portal',
  description: 'Track companies you have referred and their conversion status.',
};

const rows = [
  { company: 'GreenPack Industries Pvt Ltd', date: '2026-01-15', stage: 'Converted', conversion: 'Client Active' },
  { company: 'AquaPure Water Systems', date: '2026-02-08', stage: 'Proposal Sent', conversion: 'Pending' },
  { company: 'SolarEdge Manufacturing', date: '2026-03-02', stage: 'Contacted', conversion: 'Pending' },
  { company: 'BatteryWorld Imports', date: '2025-11-22', stage: 'Converted', conversion: 'Client Active' },
  { company: 'NovaTech Devices', date: '2026-04-01', stage: 'New Lead', conversion: 'Pending' },
  { company: 'QuickPrint Packaging Co', date: '2026-03-18', stage: 'Negotiation', conversion: 'Pending' },
];

function stageBadge(stage: string) {
  if (stage === 'Converted') return 'bg-emerald-100 text-emerald-800';
  if (stage === 'Negotiation' || stage === 'Proposal Sent') return 'bg-blue-100 text-blue-800';
  if (stage === 'Contacted') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

function conversionBadge(status: string) {
  if (status === 'Client Active') return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-100 text-slate-600';
}

export default function CepcLeadsPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Referred Leads</h1>
        <p className="mt-1 text-sm text-slate-600">Companies you have referred through your CEPC link.</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Date Referred</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Conversion Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.company} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{row.company}</td>
                <td className="px-4 py-3 text-slate-700">{row.date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${stageBadge(row.stage)}`}>{row.stage}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${conversionBadge(row.conversion)}`}>{row.conversion}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
