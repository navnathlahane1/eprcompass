export const metadata = {
  title: 'My Listings | Recycler Portal',
  description: 'Manage your waste inventory listings and pricing.',
};

const rows = [
  { category: 'Plastic — Rigid (PET)', qty: 120, price: 18500, status: 'Active' },
  { category: 'E-Waste — PCBs', qty: 45, price: 62000, status: 'Active' },
  { category: 'Battery — Lithium-ion', qty: 30, price: 85000, status: 'Pending Review' },
  { category: 'Tyre — Crumb Rubber', qty: 200, price: 12000, status: 'Active' },
  { category: 'Plastic — Flexible (MLP)', qty: 80, price: 14200, status: 'Sold Out' },
  { category: 'Used Oil — Base Oil', qty: 60, price: 42000, status: 'Draft' },
];

function statusBadge(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Pending Review') return 'bg-amber-100 text-amber-800';
  if (status === 'Sold Out') return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-600';
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function RecyclerListingsPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My Listings</h1>
        <p className="mt-1 text-sm text-slate-600">Waste inventory you have listed on the EPR marketplace.</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3">Waste Category</th>
              <th className="px-4 py-3 text-right">Qty Available (MT)</th>
              <th className="px-4 py-3 text-right">Price / MT</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{row.category}</td>
                <td className="px-4 py-3 text-right text-slate-700">{row.qty}</td>
                <td className="px-4 py-3 text-right text-slate-700">{formatINR(row.price)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(row.status)}`}>{row.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button type="button" className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    Edit
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
