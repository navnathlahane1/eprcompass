import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'My Filings | Recycler Portal',
  description: 'Track your annual EPR return filings and recycling volumes.',
};

const STATUS_COLOR: Record<string, string> = {
  Issued: 'bg-blue-100 text-blue-800',
  Transferred: 'bg-emerald-100 text-emerald-800',
  Used: 'bg-purple-100 text-purple-800',
  Expired: 'bg-slate-100 text-slate-600',
  Disputed: 'bg-orange-100 text-orange-800',
};

function toFinancialYear(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed; April = 3
  return m >= 3
    ? `FY ${y}-${String(y + 1).slice(2)}`
    : `FY ${y - 1}-${String(y).slice(2)}`;
}

interface FilingRow {
  fy: string;
  category: string;
  qtyMt: number;
  latestDate: string;
  status: string;
}

export default async function RecyclerFilingsPage() {
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

  const { data: credits } = await (supabase as any)
    .from('epr_credits')
    .select('id, waste_category, quantity_mt, issue_date, status, created_at')
    .eq('recycler_id', recycler.id)
    .order('issue_date', { ascending: false });

  // Aggregate EPR credits by financial year × waste category
  const aggregated: Record<string, FilingRow> = {};
  for (const c of (credits ?? [])) {
    const date: string = c.issue_date || c.created_at;
    const fy = toFinancialYear(date);
    const key = `${fy}|${c.waste_category}`;
    if (!aggregated[key]) {
      aggregated[key] = { fy, category: c.waste_category, qtyMt: 0, latestDate: date, status: c.status };
    }
    aggregated[key].qtyMt += Number(c.quantity_mt ?? 0);
    if (date > aggregated[key].latestDate) {
      aggregated[key].latestDate = date;
      aggregated[key].status = c.status;
    }
  }

  const rows: FilingRow[] = Object.values(aggregated).sort((a, b) =>
    b.fy.localeCompare(a.fy)
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My Filings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Recycling volumes grouped by financial year, derived from EPR credits issued.
        </p>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">
            No filing data yet. EPR credits issued to you will appear here grouped by financial year.
          </p>
        </section>
      ) : (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <th className="px-4 py-3">Financial Year</th>
                <th className="px-4 py-3">Waste Category</th>
                <th className="px-4 py-3 text-right">Qty Recycled (MT)</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3">Credit Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.fy}</td>
                  <td className="px-4 py-3 text-slate-700">{row.category}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {row.qtyMt.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(row.latestDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_COLOR[row.status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

