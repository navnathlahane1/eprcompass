'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';

const TABS = ['Profile', 'Leads', 'Earnings', 'Onboarding'];
const STAGES = ['Applied', 'Training', 'Assessment', 'Certified', 'Agreement'];

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function stageBadge(stage: string) {
  if (stage === 'Converted') return 'bg-emerald-100 text-emerald-800';
  if (stage === 'Accepted') return 'bg-blue-900/30 text-blue-300';
  if (stage === 'Rejected') return 'bg-rose-900/30 text-rose-300';
  if (stage === 'Reviewed') return 'bg-violet-900/30 text-purple-800';
  return 'bg-slate-100 text-slate-700';
}

export default function CEPCProfileClient({ consultant, initialLeads, initialEarnings, currentUserId, onboardingChecklist }: { consultant: any; initialLeads: any[]; initialEarnings: any[]; currentUserId: string | null; onboardingChecklist: any }) {
  const [tab, setTab] = useState('Profile');
  const [leads, setLeads] = useState(initialLeads || []);
  const [earnings, setEarnings] = useState(initialEarnings || []);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const stageIndexRaw = STAGES.indexOf(consultant.onboarding_stage);
  const stageIndex = stageIndexRaw === -1 ? (consultant.onboarding_stage === 'Active' ? STAGES.length : 0) : stageIndexRaw;
  const progressPct = Math.max(0, Math.min(100, (stageIndex / (STAGES.length - 1)) * 100));

  const pendingCommission = useMemo(() => {
    return (earnings || [])
      .filter((row) => row.payment_status !== 'Paid')
      .reduce((sum, row) => sum + Number(row.commission_inr || 0), 0);
  }, [earnings]);

  async function reviewLead(leadId: string, nextStage: 'Accepted' | 'Rejected') {
    setWorkingId(leadId);
    try {
      const patch = {
        stage: nextStage,
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUserId
      };

      const { error } = await (supabase as any)
        .from('cepc_leads')
        .update(patch)
        .eq('id', leadId);
      if (error) throw error;

      setLeads((prev) => prev.map((row) => (row.id === leadId ? { ...row, ...patch } : row)));
    } finally {
      setWorkingId(null);
    }
  }

  async function convertLead(leadId: string) {
    setWorkingId(leadId);
    try {
      const { data, error } = await (supabase as any)
        .rpc('convert_cepc_lead_to_client', {
          p_lead_id: leadId,
          p_category: 'PIBO',
          p_assigned_manager: consultant.assigned_manager || null
        });

      if (error) throw error;

      setLeads((prev) => prev.map((row) => (row.id === leadId ? { ...row, stage: 'Converted', converted_client_id: data } : row)));
    } finally {
      setWorkingId(null);
    }
  }

  async function markPaidBulk() {
    if (!bulkIds.length) return;
    const paidAt = new Date().toISOString();

    const { error } = await (supabase as any)
      .from('cepc_earnings')
      .update({ payment_status: 'Paid', paid_at: paidAt })
      .in('id', bulkIds);

    if (error) throw error;

    setEarnings((prev) => prev.map((row) => (bulkIds.includes(row.id) ? { ...row, payment_status: 'Paid', paid_at: paidAt } : row)));
    setBulkIds([]);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">{consultant.full_name}</h1>
        <p className="mt-1 text-sm text-slate-400">Tier: {consultant.certification_tier} · State: {consultant.state || '-'}</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        {TABS.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === item ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === 'Profile' ? (
        <section className="space-y-4">
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Profile Details</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-200 sm:grid-cols-2">
              <p>Email: {consultant.email || '-'}</p>
              <p>Phone: {consultant.phone || '-'}</p>
              <p>City: {consultant.city || '-'}</p>
              <p>Certificate No: {consultant.cert_no || '-'}</p>
              <p>Certification Date: {consultant.certification_date || '-'}</p>
              <p>Expiry: {consultant.certification_expiry || '-'}</p>
              <p>Revenue Share %: {consultant.revenue_share_pct}</p>
              <p>Agreement Signed: {consultant.agreement_signed ? 'Yes' : 'No'}</p>
              <p>Territory States: {(consultant.territory_states || []).join(', ') || '-'}</p>
              <p>Territory Cities: {(consultant.territory_cities || []).join(', ') || '-'}</p>
            </div>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Onboarding Checklist</h3>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
              {STAGES.map((stage, idx) => {
                const done = idx <= stageIndex;
                return (
                  <div key={stage} className={`rounded-md border px-2 py-2 text-center text-xs font-semibold ${done ? 'border-blue-700/50 bg-blue-950/30 text-blue-300' : 'border-slate-800 bg-slate-950 text-slate-500'}`}>
                    {stage}
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      ) : null}

      {tab === 'Leads' ? (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-100">CEPC Leads</h3>
          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="py-2 pr-3">Company</th>
                  <th className="py-2 pr-3">Contact</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Stage</th>
                  <th className="py-2 pr-3">Deal</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3 text-slate-100">{lead.client_company}</td>
                    <td className="py-2 pr-3 text-slate-200">{lead.contact_name || '-'}</td>
                    <td className="py-2 pr-3 text-slate-200">{lead.state || '-'}</td>
                    <td className="py-2 pr-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${stageBadge(lead.stage)}`}>{lead.stage}</span></td>
                    <td className="py-2 pr-3 text-slate-200">{formatINR(Number(lead.deal_value_inr || 0))}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {lead.stage === 'Submitted' || lead.stage === 'Reviewed' ? (
                          <>
                            <button
                              disabled={workingId === lead.id}
                              onClick={() => reviewLead(lead.id, 'Accepted')}
                              className="rounded-md border border-emerald-600/50 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/40"
                            >
                              Accept
                            </button>
                            <button
                              disabled={workingId === lead.id}
                              onClick={() => reviewLead(lead.id, 'Rejected')}
                              className="rounded-md border border-rose-700/50 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-950/30"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}

                        {lead.stage === 'Accepted' ? (
                          <button
                            disabled={workingId === lead.id}
                            onClick={() => convertLead(lead.id)}
                            className="btn-primary"
                          >
                            Convert to Client
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 sm:hidden">
            {leads.map((lead) => (
              <article key={lead.id} className="rounded-lg border border-slate-800 p-3">
                <p className="text-sm font-semibold text-slate-100">{lead.client_company}</p>
                <p className="text-xs text-slate-400">{lead.contact_name || '-'} · {lead.state || '-'}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stageBadge(lead.stage)}`}>{lead.stage}</span>
                  <span className="text-xs text-slate-200">{formatINR(Number(lead.deal_value_inr || 0))}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'Earnings' ? (
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Monthly Earnings</h3>
            <div className="text-sm font-semibold text-slate-100">Pending Commission: {formatINR(pendingCommission)}</div>
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="py-2 pr-3"></th>
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Gross Revenue</th>
                  <th className="py-2 pr-3">Commission %</th>
                  <th className="py-2 pr-3">Commission</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Paid At</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((row) => {
                  const selectable = row.payment_status !== 'Paid';
                  const checked = bulkIds.includes(row.id);
                  return (
                    <tr key={row.id} className="border-b border-slate-800/60">
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          disabled={!selectable}
                          checked={checked}
                          onChange={(e) => {
                            setBulkIds((prev) =>
                              e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                            );
                          }}
                        />
                      </td>
                      <td className="py-2 pr-3 text-slate-200">{row.period_month}</td>
                      <td className="py-2 pr-3 text-slate-200">{formatINR(Number(row.gross_revenue_inr || 0))}</td>
                      <td className="py-2 pr-3 text-slate-200">{Number(row.commission_pct || 0)}%</td>
                      <td className="py-2 pr-3 text-slate-200">{formatINR(Number(row.commission_inr || 0))}</td>
                      <td className="py-2 pr-3 text-slate-200">{row.payment_status}</td>
                      <td className="py-2 pr-3 text-slate-200">{row.paid_at ? new Date(row.paid_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={markPaidBulk}
            disabled={bulkIds.length === 0}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Mark as Paid (Bulk)
          </button>
        </section>
      ) : null}

      {tab === 'Onboarding' ? (
        onboardingChecklist ? (
          <OnboardingChecklist checklistId={onboardingChecklist.id} initialChecklist={onboardingChecklist} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">Checklist unavailable.</div>
        )
      ) : null}
    </div>
  );
}
