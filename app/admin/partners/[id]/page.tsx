import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Partner Detail | Admin',
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const TIER_META: Record<number, { name: string; stars: number; color: string }> = {
  1: { name: 'Direct Sales Power',    stars: 5, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  2: { name: 'Trusted Advisors',      stars: 4, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  3: { name: 'Networked Influencers', stars: 3, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  4: { name: 'Regional Specialists',  stars: 3, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  5: { name: 'Emerging/Digital',      stars: 2, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
};

const STATUS_COLOR: Record<string, string> = {
  Probationary: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  Active:       'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  Senior:       'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
};

function formatINR(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getServiceClient();

  const { data: partner } = await db
    .from('partners')
    .select(`
      id, profile_id, company_name, partner_type, partner_tier, partner_status,
      persona_label, state, city, contact_person, email, phone,
      outreach_tier, stage, commission_type, commission_value,
      contract_date, contract_renewal_date, agreement_signed,
      nda_signed, non_compete_expires,
      kit_sent, training_completed, portal_access, assigned_rm,
      portal_user_id, csm_id,
      created_at
    `)
    .eq('id', id)
    .maybeSingle();

  if (!partner) notFound();

  const [
    { data: manager },
    { data: portalUser },
    { data: csm },
    { data: leads },
    { data: earnings },
    { data: clients },
  ] = await Promise.all([
    partner.assigned_rm
      ? db.from('profiles').select('full_name, email').eq('id', partner.assigned_rm).maybeSingle()
      : Promise.resolve({ data: null }),
    partner.portal_user_id
      ? db.from('profiles').select('full_name, email').eq('id', partner.portal_user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    partner.csm_id
      ? db.from('profiles').select('full_name, email').eq('id', partner.csm_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from('partner_leads')
      .select('id, client_company, stage, deal_value_inr, submitted_at')
      .eq('partner_id', id)
      .order('submitted_at', { ascending: false })
      .limit(10),
    db.from('partner_earnings')
      .select('id, period_month, gross_revenue_inr, commission_inr, payment_status')
      .eq('partner_id', id)
      .order('period_month', { ascending: false })
      .limit(8),
    db.from('partner_clients')
      .select('id, client_id, clients:client_id(id, profiles:profile_id(company_name, full_name))')
      .eq('partner_id', id)
      .limit(10),
  ]);

  const tierMeta = partner.partner_tier ? TIER_META[partner.partner_tier] : null;
  const totalEarned   = (earnings || []).filter((e: any) => e.payment_status === 'Paid').reduce((s: number, e: any) => s + Number(e.commission_inr || 0), 0);
  const pendingEarned = (earnings || []).filter((e: any) => e.payment_status !== 'Paid').reduce((s: number, e: any) => s + Number(e.commission_inr || 0), 0);
  const convertedLeads = (leads || []).filter((l: any) => l.stage === 'Converted').length;

  const commissionDisplay = partner.commission_type
    ? `${partner.commission_type}${partner.commission_value ? ` — ${partner.commission_type === 'Revenue Share' ? `${partner.commission_value}%` : formatINR(Number(partner.commission_value))}` : ''}`
    : null;

  return (
    <div className="space-y-4 p-4 sm:p-6">

      {/* Back */}
      <Link href="/admin/partners" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        All Partners
      </Link>

      {/* ── Header ── */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-900/30 text-xl font-bold text-indigo-300">
            {(partner.company_name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-slate-100 truncate">{partner.company_name}</h1>
            <p className="text-sm text-slate-400">{partner.contact_person || '—'} · {partner.email || '—'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tierMeta && (
                <Badge cls={tierMeta.color}>
                  Tier {partner.partner_tier} — {tierMeta.name} {'★'.repeat(tierMeta.stars)}
                </Badge>
              )}
              <Badge cls={STATUS_COLOR[partner.partner_status] || 'text-slate-400 bg-slate-800 border-slate-700'}>
                {partner.partner_status}
              </Badge>
              {partner.partner_type && (
                <Badge cls="text-slate-300 bg-slate-800 border-slate-700">{partner.partner_type}</Badge>
              )}
              {partner.persona_label && (
                <Badge cls="text-violet-300 bg-violet-900/20 border-violet-700/30">{partner.persona_label}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-xs px-2 py-1 rounded border ${partner.portal_access ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-500 bg-slate-800 border-slate-700'}`}>
              {partner.portal_access ? '✓ Portal Active' : 'Portal Inactive'}
            </span>
            <span className={`text-xs px-2 py-1 rounded border ${partner.agreement_signed ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'}`}>
              {partner.agreement_signed ? '✓ Agreement Signed' : '⚠ Agreement Pending'}
            </span>
            <span className={`text-xs px-2 py-1 rounded border ${partner.nda_signed ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'}`}>
              {partner.nda_signed ? '✓ NDA Signed' : '✗ NDA Pending'}
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-800 pt-4">
          {[
            { label: 'Clients',        value: (clients || []).length },
            { label: 'Leads',          value: (leads || []).length },
            { label: 'Converted',      value: convertedLeads },
            { label: 'Earned (Paid)',  value: formatINR(totalEarned) },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Profile ── */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Profile & Contract</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Phone',            value: partner.phone },
              { label: 'Location',         value: [partner.city, partner.state].filter(Boolean).join(', ') || null },
              { label: 'Commission',       value: commissionDisplay },
              { label: 'Contract Date',    value: formatDate(partner.contract_date) },
              { label: 'Renewal Date',     value: formatDate(partner.contract_renewal_date) },
              { label: 'Non-Compete Exp.', value: formatDate(partner.non_compete_expires) },
              { label: 'Rel. Manager',     value: manager?.full_name },
              { label: 'Portal User',      value: portalUser?.full_name },
              { label: 'CSM',              value: csm?.full_name },
              { label: 'Joined',           value: formatDate(partner.created_at) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-slate-500">{f.label}</p>
                <p className="mt-0.5 text-slate-200">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Onboarding checklist */}
          <div className="mt-2 border-t border-slate-800 pt-3 space-y-1.5">
            {[
              { label: 'NDA Signed',           done: partner.nda_signed },
              { label: 'Agreement Signed',     done: partner.agreement_signed },
              { label: 'Welcome Kit Sent',     done: partner.kit_sent },
              { label: 'Training Completed',   done: partner.training_completed },
              { label: 'Portal Access',        done: partner.portal_access },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2 text-xs">
                <div className={`h-4 w-4 shrink-0 rounded-full flex items-center justify-center border ${r.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                  {r.done && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={r.done ? 'text-emerald-400' : 'text-slate-500'}>{r.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Leads ── */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Recent Leads</h2>
            <span className="text-xs text-slate-500">{(leads || []).length} total</span>
          </div>
          {(leads || []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-600">No leads submitted yet</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                  <th className="px-4 py-2.5">Company</th>
                  <th className="px-4 py-2.5">Stage</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {(leads || []).map((l: any) => (
                  <tr key={l.id} className="border-b border-slate-800/60">
                    <td className="px-4 py-2.5 text-slate-200 font-medium truncate max-w-[160px]">{l.client_company}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${l.stage === 'Converted' ? 'bg-emerald-500/15 text-emerald-300' : l.stage === 'Lost' ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>
                        {l.stage}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400 text-xs">{l.deal_value_inr > 0 ? formatINR(l.deal_value_inr) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

      </div>

      {/* ── Commissions ── */}
      {(earnings || []).length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Commission History</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-500">Paid: <span className="text-emerald-400 font-semibold">{formatINR(totalEarned)}</span></span>
              <span className="text-slate-500">Pending: <span className="text-amber-400 font-semibold">{formatINR(pendingEarned)}</span></span>
            </div>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 text-right">Commission</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {(earnings || []).map((e: any) => (
                <tr key={e.id} className="border-b border-slate-800/60">
                  <td className="px-4 py-2.5 text-slate-200">{new Date(e.period_month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400 text-xs">{formatINR(Number(e.gross_revenue_inr))}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-200">{formatINR(Number(e.commission_inr))}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${e.payment_status === 'Paid' ? 'bg-emerald-500/15 text-emerald-300' : e.payment_status === 'Processing' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-700 text-slate-400'}`}>
                      {e.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Clients ── */}
      {(clients || []).length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-200">Linked Clients</h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {(clients || []).map((c: any) => {
              const name = c.clients?.profiles?.company_name || c.clients?.profiles?.full_name || c.client_id;
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-7 w-7 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-300">
                    {(name || '?')[0].toUpperCase()}
                  </div>
                  <p className="text-sm text-slate-200">{name}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
