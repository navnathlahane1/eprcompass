import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = { title: 'My Clients | Partner Portal' };

function statusBadge(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Churned') return 'bg-rose-100 text-rose-800';
  if (status === 'At Risk') return 'bg-orange-100 text-orange-800';
  return 'bg-amber-100 text-amber-800';
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(`${d}T00:00:00Z`).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function PartnerClientsPage() {
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

  const { data: rows } = await (supabase as any)
    .from('partner_clients')
    .select(`
      id, referred_at,
      clients:client_id (
        id, status, waste_categories, renewal_date, ltv_inr,
        profiles:profile_id ( full_name, company_name, email )
      )
    `)
    .eq('partner_id', partner.id)
    .order('referred_at', { ascending: false });

  const clients = (rows || []).map((r: any) => ({
    id: r.clients?.id,
    companyName: r.clients?.profiles?.company_name || r.clients?.profiles?.full_name || 'Unknown',
    email: r.clients?.profiles?.email,
    status: r.clients?.status || 'Onboarding',
    wasteCategories: r.clients?.waste_categories || [],
    renewalDate: r.clients?.renewal_date,
    ltv: Number(r.clients?.ltv_inr || 0),
    referredAt: r.referred_at,
  }));

  // Fetch onboarding checklists for all clients
  const clientIds = clients.map((c: any) => c.id).filter(Boolean);
  const checklistMap: Record<string, number> = {};
  if (clientIds.length > 0) {
    try {
      const { data: checklists } = await (supabase as any)
        .from('onboarding_checklists')
        .select('entity_id, completion_pct')
        .eq('entity_type', 'client')
        .in('entity_id', clientIds);
      for (const cl of (checklists || [])) {
        checklistMap[cl.entity_id] = Number(cl.completion_pct || 0);
      }
    } catch { /* graceful fallback */ }
  }

  const activeCount = clients.filter((c: any) => c.status === 'Active').length;
  const renewingSoon = clients.filter((c: any) => {
    const d = daysUntil(c.renewalDate);
    return d !== null && d >= 0 && d <= 60;
  }).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Clients</h1>
        <p className="text-sm text-slate-500">Clients referred through your partner account.</p>
      </div>

      <TourTarget id="clients-summary-cards" className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clients', value: clients.length, color: 'text-slate-900' },
          { label: 'Active', value: activeCount, color: 'text-emerald-700' },
          { label: 'Renewing ≤ 60d', value: renewingSoon, color: renewingSoon > 0 ? 'text-amber-700' : 'text-slate-900' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </TourTarget>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">No clients yet</p>
          <p className="mt-1 text-xs text-slate-400">Clients you refer will appear here once onboarded by the team.</p>
        </div>
      ) : (
        <TourTarget id="clients-table" className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Waste Categories</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Renewal Date</th>
                <th className="px-4 py-3">Onboarding</th>
                <th className="px-4 py-3">Referred On</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => {
                const days = daysUntil(c.renewalDate);
                const urgent = days !== null && days >= 0 && days <= 30;
                const onboardingPct = checklistMap[c.id] ?? null;
                return (
                  <tr key={c.id || c.companyName} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/partner/clients/${c.id}`} className="font-medium text-slate-900 hover:text-indigo-700 hover:underline">{c.companyName}</a>
                      {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.wasteCategories.slice(0, 3).map((w: string) => (
                          <span key={w} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">{w}</span>
                        ))}
                        {c.wasteCategories.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">+{c.wasteCategories.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={urgent ? 'font-semibold text-amber-700' : 'text-slate-700'}>{formatDate(c.renewalDate)}</span>
                      {urgent && (
                        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{days}d</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {onboardingPct === null ? (
                        <span className="text-xs text-slate-400">Not started</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${onboardingPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              style={{ width: `${onboardingPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">{onboardingPct}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(c.referredAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TourTarget>
      )}
    </div>
  );
}
