import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

const riskBadgeClass: Record<string, string> = {
  None: 'bg-slate-900 text-slate-200',
  Low: 'bg-amber-900/30 text-amber-200',
  Medium: 'bg-orange-900/30 text-orange-800',
  High: 'bg-rose-900/30 text-rose-300'
};

const statusBadgeClass: Record<string, string> = {
  Prospect: 'bg-slate-100 text-slate-700',
  Onboarding: 'bg-blue-900/30 text-blue-300',
  Active: 'bg-emerald-100 text-emerald-800',
  Suspended: 'bg-amber-100 text-amber-800',
  Blacklisted: 'bg-rose-900/30 text-rose-300'
};

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getExpirySoon(expiry?: string | null): boolean {
  if (!expiry) return false;
  const now = new Date();
  const dt = new Date(`${expiry}T00:00:00Z`);
  const days = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return days < 30;
}

export default async function RecyclerDirectoryPage({
  searchParams
}: {
  searchParams?: Promise<{
    state?: string;
    waste_category?: string;
    status?: string;
    risk_flag?: string;
  }>;
}) {
  const supabase = await createServerComponentClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const state = resolvedSearchParams?.state || 'All';
  const wasteCategory = resolvedSearchParams?.waste_category || 'All';
  const status = resolvedSearchParams?.status || 'All';
  const riskFlag = resolvedSearchParams?.risk_flag || 'All';

  let query = (supabase as any)
    .from('recyclers')
    .select('id, company_name, state, waste_categories, capacity_mt_pa, status, risk_flag, cpcb_cert_expiry')
    .order('created_at', { ascending: false });

  if (state !== 'All') query = query.eq('state', state);
  if (status !== 'All') query = query.eq('status', status);
  if (riskFlag !== 'All') query = query.eq('risk_flag', riskFlag);
  if (wasteCategory !== 'All') query = query.contains('waste_categories', [wasteCategory]);

  const [{ data: recyclers }, { data: allRecyclers }] = await Promise.all([
    query,
    (supabase as any)
      .from('recyclers')
      .select('state, waste_categories, status, risk_flag')
  ]);

  const recyclerIds = (recyclers || []).map((r: any) => r.id);
  const { data: capacityRows } = recyclerIds.length
    ? await (supabase as any)
        .from('recycler_capacity_log')
        .select('recycler_id, month, utilization_pct')
        .in('recycler_id', recyclerIds)
        .order('month', { ascending: false })
    : { data: [] as any[] };

  const utilizationByRecycler = new Map<string, number>();
  for (const row of capacityRows || []) {
    if (!utilizationByRecycler.has(row.recycler_id)) {
      utilizationByRecycler.set(row.recycler_id, Number(row.utilization_pct || 0));
    }
  }

  const stateOptions: string[] = Array.from(new Set((allRecyclers || []).map((r: any) => String(r.state || '')).filter(Boolean))).sort() as string[];
  const wasteOptions: string[] = Array.from(
    new Set((allRecyclers || []).flatMap((r: any) => r.waste_categories || []).map((v: any) => String(v || '')).filter(Boolean))
  ).sort() as string[];
  const statusOptions: string[] = Array.from(new Set((allRecyclers || []).map((r: any) => String(r.status || '')).filter(Boolean))).sort() as string[];
  const riskOptions: string[] = Array.from(new Set((allRecyclers || []).map((r: any) => String(r.risk_flag || '')).filter(Boolean))).sort() as string[];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Recycler Directory</h1>
          <p className="mt-1 text-sm text-slate-400">State-wise directory with risk and CPCB expiry monitoring.</p>
        </div>
        <Link
          href="/admin/recyclers/new"
          className="inline-flex btn-primary"
        >
          Add Recycler
        </Link>
      </div>

      <form className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2 xl:grid-cols-5">
        <select name="state" defaultValue={state} className="input">
          <option value="All">State: All</option>
          {stateOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select name="waste_category" defaultValue={wasteCategory} className="input">
          <option value="All">Waste: All</option>
          {wasteOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select name="status" defaultValue={status} className="input">
          <option value="All">Status: All</option>
          {statusOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select name="risk_flag" defaultValue={riskFlag} className="input">
          <option value="All">Risk: All</option>
          {riskOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">
          Apply Filters
        </button>
      </form>

      <section className="hidden overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Categories</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Utilization%</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">CPCB Expiry</th>
            </tr>
          </thead>
          <tbody>
            {(recyclers || []).map((row: any) => {
              const utilization = utilizationByRecycler.get(row.id);
              const expirySoon = getExpirySoon(row.cpcb_cert_expiry);

              return (
                <tr key={row.id} className={`border-b border-slate-800/60 ${expirySoon ? 'bg-amber-900/20' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-100">
                    <Link href={`/admin/recyclers/${row.id}`} className="hover:text-blue-300">
                      {row.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{row.state || '-'}</td>
                  <td className="px-4 py-3 text-slate-200">{(row.waste_categories || []).join(', ') || '-'}</td>
                  <td className="px-4 py-3 text-slate-200">{formatNumber(row.capacity_mt_pa)} MT/yr</td>
                  <td className="px-4 py-3 text-slate-200">{utilization != null ? `${utilization.toFixed(1)}%` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass[row.status] || 'bg-slate-900 text-slate-200'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskBadgeClass[row.risk_flag] || 'bg-slate-900 text-slate-200'}`}>
                      {row.risk_flag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{row.cpcb_cert_expiry || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 sm:hidden">
        {(recyclers || []).map((row: any) => {
          const utilization = utilizationByRecycler.get(row.id);
          const expirySoon = getExpirySoon(row.cpcb_cert_expiry);

          return (
            <article key={row.id} className={`rounded-xl border p-4 ${expirySoon ? 'border-amber-600/50 bg-amber-900/20' : 'border-slate-800 bg-slate-900/60'}`}>
              <div className="flex items-start justify-between gap-2">
                <Link href={`/admin/recyclers/${row.id}`} className="text-sm font-semibold text-slate-100 hover:text-blue-300">
                  {row.company_name}
                </Link>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskBadgeClass[row.risk_flag] || 'bg-slate-900 text-slate-200'}`}>
                  {row.risk_flag}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">State: {row.state || '-'}</p>
              <p className="text-xs text-slate-400">Categories: {(row.waste_categories || []).join(', ') || '-'}</p>
              <p className="text-xs text-slate-400">Capacity: {formatNumber(row.capacity_mt_pa)} MT/yr</p>
              <p className="text-xs text-slate-400">Utilization: {utilization != null ? `${utilization.toFixed(1)}%` : '-'}</p>
              <p className="text-xs text-slate-400">CPCB Expiry: {row.cpcb_cert_expiry || '-'}</p>
              <div className="mt-2">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass[row.status] || 'bg-slate-900 text-slate-200'}`}>
                  {row.status}
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
