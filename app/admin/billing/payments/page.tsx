export const metadata = {
  title: 'Payments Received | Admin',
  description: 'Track all incoming payments from clients.',
};

const rows = [
  { invoice: 'INV-2026-0412', client: 'GreenPack Industries Pvt Ltd', amount: 245000, date: '2026-04-12', mode: 'NEFT', reference: 'CITI202604120987' },
  { invoice: 'INV-2026-0398', client: 'NovaTech Devices', amount: 118500, date: '2026-04-08', mode: 'UPI', reference: 'UPI/426108745623' },
  { invoice: 'INV-2026-0385', client: 'BatteryWorld Imports', amount: 340000, date: '2026-04-02', mode: 'RTGS', reference: 'UTIB2026040200034' },
  { invoice: 'INV-2026-0371', client: 'TyreTech Retreaders', amount: 175000, date: '2026-03-28', mode: 'Razorpay', reference: 'pay_N8k2mXo9pQ7r5t' },
  { invoice: 'INV-2026-0362', client: 'SolarEdge Manufacturing', amount: 92000, date: '2026-03-22', mode: 'Cheque', reference: 'CHQ-884520' },
  { invoice: 'INV-2026-0350', client: 'EcoPack Solutions', amount: 210000, date: '2026-03-15', mode: 'NEFT', reference: 'HDFC20260315A234' },
];

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function modeBadge(mode: string) {
  if (mode === 'NEFT' || mode === 'RTGS') return 'bg-blue-900/30 text-blue-300';
  if (mode === 'UPI') return 'bg-indigo-900/30 text-indigo-800';
  if (mode === 'Razorpay') return 'bg-violet-100 text-violet-800';
  return 'bg-slate-900 text-slate-400';
}

export default function AdminPaymentsReceivedPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Payments Received</h1>
        <p className="mt-1 text-sm text-slate-400">All incoming client payments and reconciliation details.</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Invoice No</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Date Received</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.invoice} className="border-b border-slate-800/60">
                <td className="px-4 py-3 font-medium text-slate-100">{row.invoice}</td>
                <td className="px-4 py-3 text-slate-200">{row.client}</td>
                <td className="px-4 py-3 text-right text-slate-200">{formatINR(row.amount)}</td>
                <td className="px-4 py-3 text-slate-200">{row.date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${modeBadge(row.mode)}`}>{row.mode}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
