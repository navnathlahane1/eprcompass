export const metadata = {
  title: 'Credit Notes | Admin',
  description: 'Manage credit notes issued against client invoices.',
};

const rows = [
  { creditNo: 'CN-2026-0028', client: 'GreenPack Industries Pvt Ltd', amount: 18500, againstInvoice: 'INV-2026-0350', date: '2026-03-20', status: 'Applied' },
  { creditNo: 'CN-2026-0025', client: 'NovaTech Devices', amount: 9200, againstInvoice: 'INV-2026-0312', date: '2026-03-10', status: 'Applied' },
  { creditNo: 'CN-2026-0031', client: 'TyreTech Retreaders', amount: 42000, againstInvoice: 'INV-2026-0385', date: '2026-04-05', status: 'Pending' },
  { creditNo: 'CN-2026-0019', client: 'SolarEdge Manufacturing', amount: 15000, againstInvoice: 'INV-2025-0289', date: '2026-02-18', status: 'Applied' },
  { creditNo: 'CN-2026-0033', client: 'EcoPack Solutions', amount: 27500, againstInvoice: 'INV-2026-0398', date: '2026-04-14', status: 'Draft' },
];

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function statusBadge(status: string) {
  if (status === 'Applied') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Pending') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-900 text-slate-400';
}

export default function AdminCreditNotesPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Credit Notes</h1>
        <p className="mt-1 text-sm text-slate-400">Credit notes issued against client invoices.</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Credit No</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Against Invoice</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.creditNo} className="border-b border-slate-800/60">
                <td className="px-4 py-3 font-medium text-slate-100">{row.creditNo}</td>
                <td className="px-4 py-3 text-slate-200">{row.client}</td>
                <td className="px-4 py-3 text-right text-slate-200">{formatINR(row.amount)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.againstInvoice}</td>
                <td className="px-4 py-3 text-slate-200">{row.date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(row.status)}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
