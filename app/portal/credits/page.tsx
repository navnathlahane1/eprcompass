import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';
import { calculateObligation } from '@/lib/compliance';

function formatINR(value: number) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

function getCurrentFY(date = new Date()) {
  const year = date.getFullYear();
  if (date.getMonth() >= 3) {
    return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
  }
  return `${year - 1}-${String(year % 100).padStart(2, '0')}`;
}

export default async function PortalCreditsPage() {
  const actor = await resolveClientActor();
  if (!actor) {
    return <div className="p-6 text-sm text-red-700">Please sign in to view credits.</div>;
  }

  const supabase = adminClient();
  const client = { id: actor.clientId };

  const { data: transactions, error: transactionsError } = await (supabase as any)
    .from('credit_transactions')
    .select('id, waste_category, quantity_kg, quantity_mt, agreed_rate_per_kg_inr, agreed_rate_inr, total_value_inr, status, requested_at, completed_at')
    .eq('buyer_client_id', client.id)
    .order('requested_at', { ascending: false });

  const purchased = (transactions || []).filter((row: any) => row.status === 'Completed');
  const pending = (transactions || []).filter((row: any) => ['Requested', 'Approved', 'Payment Pending', 'Disputed'].includes(row.status));

  const fy = getCurrentFY();
  const categories: Array<'Plastic' | 'E-Waste' | 'Battery' | 'Tyre' | 'Oil'> = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'];

  const obligationRows = await Promise.all(
    categories.map(async (category) => {
      try {
        const result = await calculateObligation(client.id, category as any, fy, supabase as any);
        return { category, obligation: result.obligated_mt * 1000, fulfilled: result.fulfilled_mt * 1000, gap: result.gap_mt * 1000, error: null };
      } catch {
        return { category, obligation: null, fulfilled: null, gap: null, error: 'Quantity records unavailable or require review' };
      }
    })
  );

  return (
    <div className="space-y-5">
      {transactionsError && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Credit transactions could not be loaded. Retry before relying on this account summary.</p>}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">My Credits</h1>
        <p className="mt-1 text-sm text-slate-600">Purchased credits, pending requests, and compliance coverage.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">My Purchased Credits</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Qty (KG)</th>
                <th className="py-2 pr-3">Rate (₹/KG)</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {purchased.map((row: any) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-700">{row.waste_category}</td>
                  <td className="py-2 pr-3 text-slate-700">{Number(row.quantity_kg || (Number(row.quantity_mt || 0) * 1000)).toLocaleString('en-IN')}</td>
                  <td className="py-2 pr-3 text-slate-700">{formatINR(Number(row.agreed_rate_per_kg_inr || (Number(row.agreed_rate_inr || 0) / 1000)))}</td>
                  <td className="py-2 pr-3 text-slate-700">{formatINR(Number(row.total_value_inr || 0))}</td>
                  <td className="py-2 pr-3 text-slate-700">{row.status}</td>
                  <td className="py-2 text-slate-700">{row.completed_at ? new Date(row.completed_at).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              ))}
              {!transactionsError && purchased.length === 0 ? <tr><td colSpan={6} className="py-4 text-center text-slate-500">No purchased credits yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">My Pending Requests</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Qty (KG)</th>
                <th className="py-2 pr-3">Rate (₹/KG)</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((row: any) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-700">{row.waste_category}</td>
                  <td className="py-2 pr-3 text-slate-700">{Number(row.quantity_kg || (Number(row.quantity_mt || 0) * 1000)).toLocaleString('en-IN')}</td>
                  <td className="py-2 pr-3 text-slate-700">{formatINR(Number(row.agreed_rate_per_kg_inr || (Number(row.agreed_rate_inr || 0) / 1000)))}</td>
                  <td className="py-2 pr-3 text-slate-700">{formatINR(Number(row.total_value_inr || 0))}</td>
                  <td className="py-2 pr-3">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{row.status}</span>
                  </td>
                  <td className="py-2 text-slate-700">{new Date(row.requested_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!transactionsError && pending.length === 0 ? <tr><td colSpan={6} className="py-4 text-center text-slate-500">No pending requests.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Recorded quantities (FY {fy})</h2>
        <p className="mt-2 text-xs text-slate-600">Credit eligibility and allocation require staff validation. Recorded fulfillment is not proof of regulatory approval.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-3">Waste Category</th>
                <th className="py-2 pr-3">Obligation (KG)</th>
                <th className="py-2 pr-3">Fulfilled (KG)</th>
                <th className="py-2 pr-3">Obligation Gap (KG)</th>
                <th className="py-2">Record status</th>
              </tr>
            </thead>
            <tbody>
              {obligationRows.map((row) => {
                return (
                  <tr key={row.category} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-700">{row.category}</td>
                    <td className="py-2 pr-3 text-slate-700">{row.obligation?.toLocaleString('en-IN') ?? '--'}</td>
                    <td className="py-2 pr-3 text-slate-700">{row.fulfilled?.toLocaleString('en-IN') ?? '--'}</td>
                    <td className="py-2 pr-3 text-slate-700">{row.gap?.toLocaleString('en-IN') ?? '--'}</td>
                    <td className="py-2 text-slate-700">{row.error || 'Recorded; subject to validation'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
