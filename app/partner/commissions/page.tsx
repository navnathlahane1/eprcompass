import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = { title: 'Commissions | Partner Portal' };

function formatINR(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

function formatMonth(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function payStatusBadge(status: string) {
  if (status === 'Paid') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Processing') return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

export default async function PartnerCommissionsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners').select('id, commission_type, commission_value').eq('profile_id', user.id).maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  const { data: earnings } = await (supabase as any)
    .from('partner_earnings')
    .select('id, gross_revenue_inr, commission_pct, commission_inr, payment_status, period_month, paid_at, notes, clients:client_id(profiles:profile_id(company_name, full_name))')
    .eq('partner_id', partner.id)
    .order('period_month', { ascending: false });

  const rows = (earnings || []).map((e: any) => ({
    ...e,
    clientName: e.clients?.profiles?.company_name || e.clients?.profiles?.full_name || '—',
    commissionInr: Number(e.commission_inr || 0),
  }));

  const totalEarned = rows.filter((r: any) => r.payment_status === 'Paid').reduce((s: number, r: any) => s + r.commissionInr, 0);
  const pending = rows.filter((r: any) => r.payment_status !== 'Paid').reduce((s: number, r: any) => s + r.commissionInr, 0);
  const totalGross = rows.reduce((s: number, r: any) => s + Number(r.gross_revenue_inr || 0), 0);

  // Forecast: fetch clients for renewal projections
  let renewalClients: any[] = [];
  let atRiskClients: any[] = [];
  try {
    const { data: pcRows } = await (supabase as any)
      .from('partner_clients')
      .select('client_id, clients:client_id(id, status, renewal_date, ltv_inr, profiles:profile_id(company_name, full_name))')
      .eq('partner_id', partner.id);

    const today = new Date();
    const in90 = new Date(today.getTime() + 90 * 86400000);
    const commPct = Number(partner.commission_value || partner.commission_pct || 0);

    for (const pc of (pcRows || [])) {
      const c = pc.clients;
      if (!c) continue;
      const name = c.profiles?.company_name || c.profiles?.full_name || 'Unknown';
      const ltv = Number(c.ltv_inr || 0);
      const estComm = commPct > 0 ? Math.round(ltv * commPct / 100) : 0;
      if (c.renewal_date) {
        const d = new Date(c.renewal_date);
        if (d >= today && d <= in90) {
          renewalClients.push({ id: c.id, name, renewalDate: c.renewal_date, ltv, estComm });
        }
      }
      if (['At Risk', 'Churned'].includes(c.status)) {
        atRiskClients.push({ id: c.id, name, status: c.status, ltv, estComm });
      }
    }
  } catch { renewalClients = []; atRiskClients = []; }

  const commissionLabel = partner.commission_type
    ? `${partner.commission_type}${partner.commission_value ? ` — ${partner.commission_type === 'Revenue Share' ? `${partner.commission_value}%` : formatINR(partner.commission_value)}` : ''}`
    : 'Not configured';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Commissions</h1>
        <p className="text-sm text-slate-500">
          Commission structure: <span className="font-medium text-slate-700">{commissionLabel}</span>
        </p>
      </div>

      {/* Summary cards */}
      <TourTarget id="commissions-summary-cards" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Earned (Paid)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{formatINR(totalEarned)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pending Payout</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${pending > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{formatINR(pending)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Revenue Generated</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{formatINR(totalGross)}</p>
        </div>
      </TourTarget>

      {/* Earnings table */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">No commission records yet</p>
          <p className="mt-1 text-xs text-slate-400">Earnings will appear here once clients are billed and commissions are processed.</p>
        </div>
      ) : (
        <TourTarget id="commissions-table" className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid On</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{formatMonth(r.period_month)}</td>
                  <td className="px-4 py-3 text-slate-700">{r.clientName}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{formatINR(Number(r.gross_revenue_inr))}</td>
                  <td className="px-4 py-3 text-slate-700">{r.commission_pct}%</td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">{formatINR(r.commissionInr)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${payStatusBadge(r.payment_status)}`}>
                      {r.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TourTarget>
      )}

      {/* Projected Renewals */}
      <TourTarget id="commissions-renewals" className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Projected Renewals (Next 90 Days)</h2>
        </div>
        {renewalClients.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">No renewals due in the next 90 days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Renewal Date</th>
                  <th className="px-4 py-2">Client LTV</th>
                  <th className="px-4 py-2">Est. Commission</th>
                </tr>
              </thead>
              <tbody>
                {renewalClients.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {new Date(c.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-700">{formatINR(c.ltv)}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold text-emerald-700">{c.estComm > 0 ? formatINR(c.estComm) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TourTarget>

      {/* At-Risk Revenue */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 bg-rose-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-rose-800">At-Risk Revenue</h2>
        </div>
        {atRiskClients.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">No at-risk clients. Great job!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Client LTV</th>
                  <th className="px-4 py-2">Potential Lost Commission</th>
                </tr>
              </thead>
              <tbody>
                {atRiskClients.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.status === 'Churned' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-700">{formatINR(c.ltv)}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold text-rose-700">{c.estComm > 0 ? formatINR(c.estComm) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">For payout queries contact <a href="mailto:supporteprcompass@gmail.com" className="text-indigo-600 font-medium hover:underline">supporteprcompass@gmail.com</a></p>
    </div>
  );
}
