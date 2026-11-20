'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EnrichmentBadge from '@/components/telecalling/EnrichmentBadge';
import CallLogModal from '@/components/telecalling/CallLogModal';
import FollowupWidget from '@/components/telecalling/FollowupWidget';
import CallPrepSheet from '@/components/telecalling/CallPrepSheet';
import QuickSendModal from '@/components/telecalling/QuickSendModal';
import IntelSyncBadge from '@/components/telecalling/IntelSyncBadge';
import AssociatedPeoplePanel from '@/components/telecalling/AssociatedPeoplePanel';
import { trackEvent } from '@/lib/analytics';

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number | null) {
  if (!n) return null;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const PROPOSAL_STATUS_STYLE: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-800',
  sent: 'text-blue-400 bg-blue-900/30',
  viewed: 'text-purple-400 bg-purple-900/30',
  accepted: 'text-green-400 bg-green-900/30',
  rejected: 'text-red-400 bg-red-900/30',
};

interface Props {
  lead: any;
  calls: any[];
  followups: any[];
  enrichment: any;
}

export default function LeadDetailClient({ lead, calls, followups, enrichment }: Props) {
  const [showCallModal, setShowCallModal] = useState(false);
  const [showPrepSheet, setShowPrepSheet] = useState(false);
  const [showQuickSend, setShowQuickSend] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [markingSent, setMarkingSent] = useState<string | null>(null);
  const router = useRouter();
  const lastCall = calls[0] || null;

  const loadProposals = useCallback(async () => {
    const res = await fetch(`/api/telecalling/proposals?lead_id=${lead.id}`);
    const data = await res.json();
    setProposals(data.proposals ?? []);
  }, [lead.id]);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  const isInterestedNoProposal =
    (lead.tc_status === 'Interested' || calls.some((c: any) => c.disposition === 'Interested')) &&
    proposals.length === 0;

  const hasSentProposal = proposals.some((p: any) => p.status !== 'draft');

  async function markProposalSent(proposalId: string) {
    setMarkingSent(proposalId);
    await fetch(`/api/telecalling/proposals/${proposalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent', lead_id: lead.id }),
    });
    trackEvent('Telecalling Proposal Sent', {});
    setMarkingSent(null);
    loadProposals();
  }

  async function handleEnrich() {
    await fetch(`/api/admin/telecalling/leads/${lead.id}/enrich`, { method: 'POST' });
    trackEvent('Telecalling Lead Enriched', {});
    router.refresh();
  }

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link href="/telecalling/leads" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to Leads
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{lead.company_name || lead.company || lead.contact_name}</h1>
          <div className="text-sm text-slate-400 mt-0.5">{lead.contact_name} {lead.designation ? `· ${lead.designation}` : ''}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <IntelSyncBadge
            intelCompanyId={lead.intel_company_id}
            enrichmentLevel={lead.intel_enrichment_level}
            companyName={lead.company_name || lead.company}
          />
          <EnrichmentBadge
            status={lead.tc_enrichment_status || 'none'}
            score={enrichment?.epr_applicability_score}
            onClick={handleEnrich}
          />
          <button
            onClick={() => setShowPrepSheet(s => !s)}
            className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${showPrepSheet ? 'bg-teal-500/20 border-teal-500/40 text-teal-200' : 'border-slate-700 text-slate-300 hover:bg-slate-800/40'}`}
          >
            ⚡ Prep
          </button>
          <button
            onClick={() => setShowQuickSend(true)}
            className="px-3 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/40"
          >
            📤 Send
          </button>
          <button
            onClick={() => setShowCallModal(true)}
            className="px-4 py-2 bg-teal-500/15 border border-teal-500/30 text-white rounded-lg text-sm font-medium hover:bg-teal-500/20"
          >
            Log Call
          </button>
        </div>
      </div>

      {/* Feature 1: Call Prep Sheet */}
      {showPrepSheet && (
        <div className="mb-6">
          <CallPrepSheet lead={lead} enrichment={enrichment} lastCall={lastCall} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
            <h2 className="font-semibold text-slate-200 mb-4">Lead Info</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Phone', lead.phone],
                ['Email', lead.email],
                ['State', lead.state],
                ['Industry', lead.industry],
                ['Employees', lead.no_of_employees],
                ['Status', lead.tc_status || 'New'],
                ['Calls Made', lead.tc_call_count || 0],
                ['Last Called', lead.tc_last_called_at ? new Date(lead.tc_last_called_at).toLocaleDateString('en-IN') : '—'],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-medium text-slate-200 mt-0.5">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* AI Enrichment */}
          {enrichment && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
              <h2 className="font-semibold text-purple-800 mb-3">AI Intelligence</h2>
              <p className="text-sm text-purple-700 mb-4">{enrichment.ai_summary}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['EPR Category', enrichment.epr_category],
                  ['Size', enrichment.size_estimate],
                  ['EPR Score', enrichment.epr_applicability_score != null ? `${enrichment.epr_applicability_score}/100` : null],
                  ['Lead Score', enrichment.lead_score != null ? `${enrichment.lead_score}/100` : null],
                  ['Compliance Prob.', enrichment.compliance_probability != null ? `${enrichment.compliance_probability}%` : null],
                  ['Decision Maker', enrichment.decision_maker_estimate],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-purple-600">{label}</dt>
                    <dd className="font-medium text-purple-800 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Interested but no proposal alert */}
          {isInterestedNoProposal && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">Client is Interested — Proposal Not Sent Yet</p>
                <p className="text-xs text-amber-400/70 mt-0.5">Create a proposal for this lead so the client can review your offering.</p>
              </div>
              <Link
                href={`/telecalling/proposals`}
                className="shrink-0 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition"
              >
                Create Proposal →
              </Link>
            </div>
          )}

          {/* Proposals for this lead */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200">Proposals ({proposals.length})</h2>
              {hasSentProposal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/30 border border-blue-700/30 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                  ✓ Proposal Sent
                </span>
              )}
            </div>
            {proposals.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">
                No proposals created yet.{' '}
                <Link href="/telecalling/proposals" className="text-teal-400 hover:underline">Create one →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-800 last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PROPOSAL_STATUS_STYLE[p.status] ?? PROPOSAL_STATUS_STYLE.draft}`}>
                          {p.status}
                        </span>
                        {p.amount_inr && <span className="text-[11px] font-semibold text-emerald-400">{fmtMoney(p.amount_inr)}</span>}
                      </div>
                      <p className="text-sm font-medium text-slate-200 truncate">{p.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Created {fmt(p.created_at)}{p.sent_at ? ` · Sent ${fmt(p.sent_at)}` : ''}
                      </p>
                    </div>
                    {p.status === 'draft' && (
                      <button
                        onClick={() => markProposalSent(p.id)}
                        disabled={markingSent === p.id}
                        className="shrink-0 rounded-lg bg-blue-900/40 hover:bg-blue-900/70 border border-blue-700/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition disabled:opacity-50"
                      >
                        {markingSent === p.id ? 'Marking…' : 'Mark Sent'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated People — syncs to Intel if intel_company_id is set */}
          <AssociatedPeoplePanel
            leadId={lead.id}
            intelCompanyId={lead.intel_company_id || null}
          />

          {/* Call History */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
            <h2 className="font-semibold text-slate-200 mb-4">My Call History ({calls.length})</h2>
            {calls.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">No calls logged yet</div>
            ) : (
              <div className="space-y-3">
                {calls.map((call: any) => (
                  <div key={call.id} className="flex items-start justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {call.disposition || call.status}
                        {call.duration_seconds > 0 && <span className="text-slate-500 font-normal"> · {fmtDuration(call.duration_seconds)}</span>}
                      </div>
                      {call.notes && <div className="text-xs text-slate-400 mt-0.5">{call.notes}</div>}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {new Date(call.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Follow-ups sidebar */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-200">Pending Follow-ups</h2>
          {followups.length === 0 ? (
            <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-4 text-sm text-slate-500 text-center">
              No pending follow-ups
            </div>
          ) : (
            followups.map((f: any) => (
              <FollowupWidget key={f.id} followup={f} onUpdate={() => router.refresh()} />
            ))
          )}
        </div>
      </div>

      {showCallModal && (
        <CallLogModal
          leadId={lead.id}
          leadName={lead.contact_name || lead.company_name || ''}
          onClose={() => setShowCallModal(false)}
          onSaved={() => { setShowCallModal(false); router.refresh(); }}
        />
      )}

      {/* Feature 5: Quick Send */}
      {showQuickSend && (
        <QuickSendModal
          lead={lead}
          enrichment={enrichment}
          onClose={() => setShowQuickSend(false)}
        />
      )}
    </div>
  );
}
