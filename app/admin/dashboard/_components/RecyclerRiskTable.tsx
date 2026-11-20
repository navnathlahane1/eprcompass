import Link from 'next/link';

type RecyclerRiskRow = {
  id: string;
  company_name: string;
  state: string;
  waste_categories: string[];
  capacity_mt_pa: number | null;
  utilization_pct: number | null;
  risk_flag: 'None' | 'Low' | 'Medium' | 'High';
  risk_reason: string;
};

function riskClass(risk: string) {
  if (risk === 'High') return 'bg-rose-50 text-rose-700';
  if (risk === 'Medium') return 'bg-amber-50 text-amber-800';
  if (risk === 'Low') return 'bg-amber-50 text-amber-800';
  return 'bg-zinc-100 text-zinc-700';
}

export default function RecyclerRiskTable({ rows, error }: { rows: RecyclerRiskRow[]; error?: string | null }) {
  return (
    <section className="min-w-0 border-t border-zinc-200 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Recycler Risk Monitor</h2>
        <Link href="/admin/recyclers" className="text-xs font-semibold text-blue-700 hover:underline">
          View All
        </Link>
      </div>

      {error && <p role="alert" className="mb-3 text-sm text-amber-800">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <caption className="sr-only">Recycler capacity, utilization and risk</caption>
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-2 py-2">Recycler</th>
              <th className="px-2 py-2">State</th>
              <th className="px-2 py-2">Categories</th>
              <th className="px-2 py-2">Capacity</th>
              <th className="px-2 py-2">Utilization%</th>
              <th className="px-2 py-2">Risk</th>
              <th className="px-2 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && !error && <tr><td colSpan={7} className="py-10 text-center text-zinc-500">No recycler risk records have been recorded yet.</td></tr>}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-100">
                <td className="px-2 py-2 font-medium text-zinc-900">{row.company_name}</td>
                <td className="px-2 py-2 text-zinc-700">{row.state || '-'}</td>
                <td className="px-2 py-2 text-zinc-700">{(row.waste_categories || []).join(', ') || '-'}</td>
                <td className="px-2 py-2 text-zinc-700">{row.capacity_mt_pa == null ? 'Not recorded' : `${row.capacity_mt_pa.toLocaleString('en-IN')} MT/year`}</td>
                <td className="px-2 py-2 text-zinc-700">{row.utilization_pct == null ? 'Not recorded' : `${row.utilization_pct.toFixed(1)}%`}</td>
                <td className="px-2 py-2">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${riskClass(row.risk_flag)}`}>
                    {row.risk_flag}
                  </span>
                </td>
                <td className="px-2 py-2 text-zinc-700">{row.risk_reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
