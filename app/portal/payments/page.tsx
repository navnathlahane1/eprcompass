import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function PaymentsPage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6 text-sm text-red-700">Please sign in to view payments.</div>;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!client) {
    return <div className="p-6 text-sm text-slate-700">No client account is linked to this profile.</div>;
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('id, invoice_no, service_id, amount_inr, due_date, status')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  const serviceIds = [...new Set((payments ?? []).map((row) => row.service_id))];

  const { data: services } = serviceIds.length
    ? await supabase.from('services').select('id, service_type').in('id', serviceIds)
    : { data: [] as Array<{ id: string; service_type: string }> };

  const serviceById = new Map((services ?? []).map((service) => [service.id, service.service_type]));

  const now = new Date();

  return (
    <div className="space-y-4">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Payments</h1>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Service</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Due</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(payments ?? []).map((row) => {
              const pastDue =
                row.due_date &&
                new Date(`${row.due_date}T00:00:00Z`) < now &&
                row.status !== 'Paid';

              return (
                <tr key={row.id} className={pastDue ? 'bg-rose-50' : ''}>
                  <td className="px-4 py-3 text-slate-900">{row.invoice_no || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{serviceById.get(row.service_id) || row.service_id}</td>
                  <td className="px-4 py-3 text-slate-700">{formatINR(Number(row.amount_inr ?? 0))}</td>
                  <td className="px-4 py-3 text-slate-700">{row.due_date || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.status === 'Overdue' || pastDue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {(payments ?? []).map((row) => {
          const pastDue =
            row.due_date &&
            new Date(`${row.due_date}T00:00:00Z`) < now &&
            row.status !== 'Paid';

          return (
            <article key={row.id} className={`rounded-xl border p-4 ${pastDue ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-sm font-semibold text-slate-900">Invoice: {row.invoice_no || '-'}</p>
              <p className="mt-1 text-xs text-slate-600">Service: {serviceById.get(row.service_id) || row.service_id}</p>
              <p className="mt-1 text-xs text-slate-600">Amount: {formatINR(Number(row.amount_inr ?? 0))}</p>
              <p className="mt-1 text-xs text-slate-600">Due: {row.due_date || '-'}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  row.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : row.status === 'Overdue' || pastDue
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                {row.status}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
