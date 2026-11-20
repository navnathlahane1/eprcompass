import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = { title: 'Client Filings | Partner Portal' };

function statusBadge(status: string) {
  if (status === 'Approved' || status === 'Filed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Overdue') return 'bg-rose-100 text-rose-800';
  if (status === 'In Progress') return 'bg-blue-100 text-blue-800';
  if (status === 'Rejected') return 'bg-orange-100 text-orange-800';
  return 'bg-amber-100 text-amber-800';
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function PartnerFilingsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners').select('id').eq('profile_id', user.id).maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  // Fetch services for all clients of this partner
  const { data: rows } = await (supabase as any)
    .from('partner_clients')
    .select(`
      clients:client_id (
        id,
        profiles:profile_id ( full_name, company_name ),
        services (
          id, service_type, waste_category, status, due_date, start_date
        )
      )
    `)
    .eq('partner_id', partner.id);

  // Flatten into filing rows
  const filings: any[] = [];
  for (const row of (rows || [])) {
    const c = row.clients;
    const company = c?.profiles?.company_name || c?.profiles?.full_name || 'Unknown';
    for (const svc of (c?.services || [])) {
      filings.push({
        client: company,
        serviceType: svc.service_type,
        category: svc.waste_category,
        status: svc.status,
        dueDate: svc.due_date,
        startDate: svc.start_date,
      });
    }
  }

  // Sort by due_date desc
  filings.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const overdueCount = filings.filter((f) => f.status === 'Overdue').length;
  const inProgressCount = filings.filter((f) => f.status === 'In Progress').length;
  const completedCount = filings.filter((f) => ['Approved', 'Filed'].includes(f.status)).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Client Filings</h1>
        <p className="text-sm text-slate-500">EPR service and filing status for your referred clients.</p>
      </div>

      <TourTarget id="filings-summary-cards" className="grid grid-cols-3 gap-3">
        {[
          { label: 'Overdue', value: overdueCount, color: overdueCount > 0 ? 'text-rose-700' : 'text-slate-900' },
          { label: 'In Progress', value: inProgressCount, color: 'text-blue-700' },
          { label: 'Completed', value: completedCount, color: 'text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </TourTarget>

      {filings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">No filings yet</p>
          <p className="mt-1 text-xs text-slate-400">Filing data will appear once clients have active services.</p>
        </div>
      ) : (
        <TourTarget id="filings-table" className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filings.map((f, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{f.client}</td>
                  <td className="px-4 py-3 text-slate-700">{f.serviceType}</td>
                  <td className="px-4 py-3 text-slate-700">{f.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${f.status === 'Overdue' ? 'font-semibold text-rose-700' : 'text-slate-700'}`}>
                    {formatDate(f.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TourTarget>
      )}
    </div>
  );
}
