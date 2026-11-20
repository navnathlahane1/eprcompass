export const metadata = {
  title: 'My Commissions | CEPC Portal',
  description: 'View monthly commission earnings from referred leads.',
};

const rows = [
  { month: 'Mar 2026', leadsConverted: 2, amount: 18500, status: 'Paid' },
  { month: 'Feb 2026', leadsConverted: 1, amount: 9200, status: 'Paid' },
  { month: 'Jan 2026', leadsConverted: 3, amount: 27800, status: 'Paid' },
  { month: 'Apr 2026', leadsConverted: 1, amount: 11000, status: 'Processing' },
  { month: 'Dec 2025', leadsConverted: 2, amount: 16400, status: 'Paid' },
];

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function statusBadge(status: string) {
  if (status === 'Paid') return 'bg-emerald-100 text-emerald-800';
  return 'bg-amber-100 text-amber-800';
}

export default function CepcCommissionsPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My Commissions</h1>
        <p className="mt-1 text-sm text-slate-600">Monthly commission earnings from converted referrals.</p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Earned (FY 2025-26)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(71900)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Pending Payout</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{formatINR(11000)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Leads Converted This FY</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">9</p>
        </article>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Leads Converted</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payout Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{row.month}</td>
                <td className="px-4 py-3 text-slate-700">{row.leadsConverted}</td>
                <td className="px-4 py-3 text-slate-700">{formatINR(row.amount)}</td>
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
