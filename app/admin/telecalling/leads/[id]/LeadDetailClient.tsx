'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import EnrichmentBadge from '@/components/telecalling/EnrichmentBadge';
import FollowupWidget from '@/components/telecalling/FollowupWidget';
import CallLogModal from '@/components/telecalling/CallLogModal';
import { useSoftphone } from '@/components/telecalling/SoftphoneContext';

const EPR_CATEGORIES = [
  'EPR - Plastic',
  'EPR - E-Waste',
  'EPR - Battery',
  'EPR - Tyre',
  'EPR - General',
];

interface Props {
  lead: Record<string, any>;
  calls: any[];
  followups: any[];
  enrichment: Record<string, any> | null;
}

interface ConvertForm {
  email: string;
  full_name: string;
  company_name: string;
  phone: string;
  state: string;
  category: string;
  assigned_manager_id: string;
}

interface ConvertResult {
  clientId: string;
  email: string;
  temporaryPassword: string;
  phone: string;
  companyName: string;
  portalUrl: string;
  whatsappSent: boolean;
  whatsappError: string | null;
  whatsappMessage: string;
}

function fmtDuration(s: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function LeadDetailClient({ lead, calls, followups, enrichment }: Props) {
  const router = useRouter();
  const [showCallModal, setShowCallModal] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const softphone = useSoftphone();
  const leadPhone = lead.phone || lead.mobile || '';

  // Convert to client modal state
  const [showConvert, setShowConvert] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertResult, setConvertResult] = useState<ConvertResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Onboard as Client/Partner — placeholder, not wired up yet
  const [onboardToast, setOnboardToast] = useState(false);

  const companyFromLead = lead.company_name || lead.company || '';
  const contactFromLead = lead.contact_name || lead.name || '';

  const [form, setForm] = useState<ConvertForm>({
    email: lead.email || '',
    full_name: contactFromLead,
    company_name: companyFromLead,
    phone: lead.phone || lead.mobile || '',
    state: lead.state || '',
    category: 'EPR - General',
    assigned_manager_id: '',
  });

  async function triggerEnrich() {
    setEnriching(true);
    await fetch(`/api/admin/telecalling/leads/${lead.id}/enrich`, { method: 'POST' });
    setEnriching(false);
    router.refresh();
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setConverting(true);
    setConvertError(null);
    try {
      const res = await fetch(`/api/admin/telecalling/leads/${lead.id}/convert-to-client`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setConvertError(data.error || 'Conversion failed');
        return;
      }
      setConvertResult(data);
      router.refresh();
    } catch (err: any) {
      setConvertError(err.message || 'Network error');
    } finally {
      setConverting(false);
    }
  }

  function copyCredentials() {
    if (!convertResult) return;
    const text = [
      `Portal Login: ${convertResult.portalUrl}`,
      `Email: ${convertResult.email}`,
      `Temporary Password: ${convertResult.temporaryPassword}`,
      '',
      'Please login and change your password on first sign-in.',
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function closeConvert() {
    setShowConvert(false);
    setConvertResult(null);
    setConvertError(null);
    setCopied(false);
  }

  const isConverted = lead.tc_status === 'Converted';
  const isInterested = lead.tc_status === 'Interested';

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/telecalling/leads" className="text-sm text-slate-500 hover:text-slate-400">← Leads</Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{companyFromLead || 'Unnamed Lead'}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-500">{contactFromLead}</span>
            <span className="text-sm text-slate-500">{lead.phone}</span>
            <EnrichmentBadge status={lead.tc_enrichment_status} score={enrichment?.lead_score} />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => softphone.dial(leadPhone, lead.id)}
            disabled={!leadPhone || softphone.status === 'UNCONFIGURED' || softphone.status === 'ON_CALL' || softphone.status === 'CALLING'}
            title={softphone.status === 'UNCONFIGURED' ? 'Desktop calling is not set up for your account yet — ask an admin' : undefined}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-blue-700 text-blue-400 hover:bg-blue-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            📞 Call
          </button>
          <button onClick={() => setShowCallModal(true)} className="btn-primary">
            Log Call
          </button>
          {(!lead.tc_enrichment_status || lead.tc_enrichment_status === 'none' || lead.tc_enrichment_status === 'failed') && (
            <button
              onClick={triggerEnrich}
              disabled={enriching}
              className="px-4 py-2 border border-purple-300 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-950/30 disabled:opacity-50"
            >
              {enriching ? 'Queueing…' : 'Enrich with AI'}
            </button>
          )}
          {/* Convert to Client — always available for admin, highlighted when Interested/Converted */}
          <button
            onClick={() => setShowConvert(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isConverted
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                : isInterested
                ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600'
                : 'border border-emerald-700 text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            Convert to Client
          </button>
          {/* Onboard as Client/Partner — placeholder, flow not built yet */}
          <button
            onClick={() => {
              setOnboardToast(true);
              setTimeout(() => setOnboardToast(false), 2500);
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-violet-700 text-violet-400 hover:bg-violet-950/40"
          >
            Onboard this Client/Partner
          </button>
        </div>
      </div>

      {onboardToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 border border-violet-700 text-slate-100 text-sm px-4 py-3 rounded-lg shadow-lg">
          Onboarding flow coming soon
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
            <h2 className="font-semibold text-slate-100 mb-4">Lead Info</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Email', lead.email],
                ['Phone', lead.phone],
                ['State', lead.state],
                ['Status', lead.tc_status || 'New'],
                ['Calls Made', lead.tc_call_count || 0],
                ['Last Called', lead.tc_last_called_at ? new Date(lead.tc_last_called_at).toLocaleDateString() : '—'],
                ['Next Call', lead.tc_next_call_at ? new Date(lead.tc_next_call_at).toLocaleDateString() : '—'],
                ['Stage', lead.stage],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-100">{String(value ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* AI Enrichment */}
          {enrichment && (
            <div className="bg-violet-950/30 rounded-xl border border-violet-800/40 p-5">
              <h2 className="font-semibold text-slate-100 mb-3">AI Enrichment</h2>
              {enrichment.ai_summary && <p className="text-sm text-slate-200 mb-4">{enrichment.ai_summary}</p>}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  ['EPR Category', enrichment.epr_category],
                  ['EPR Applicability', enrichment.epr_applicability_score != null ? `${enrichment.epr_applicability_score}/100` : '—'],
                  ['Lead Score', enrichment.lead_score != null ? `${enrichment.lead_score}/100` : '—'],
                  ['Compliance Probability', enrichment.compliance_probability != null ? `${enrichment.compliance_probability}%` : '—'],
                  ['Industry', enrichment.industry_inferred],
                  ['Size Estimate', enrichment.size_estimate],
                  ['Decision Maker', enrichment.decision_maker_estimate],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-100">{String(value ?? '—')}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Call history */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
            <h2 className="font-semibold text-slate-100 mb-4">Call History ({calls.length})</h2>
            {calls.length === 0 ? (
              <p className="text-sm text-slate-500">No calls logged yet</p>
            ) : (
              <div className="space-y-2">
                {calls.map((call: any) => (
                  <div key={call.id} className="flex items-start justify-between text-sm py-2 border-b border-slate-800/60 last:border-0">
                    <div>
                      <span className="font-medium text-slate-100">{call.disposition || call.status}</span>
                      {call.notes && <p className="text-xs text-slate-500 mt-0.5">{call.notes}</p>}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{fmtDuration(call.duration_seconds)}</div>
                      <div>{new Date(call.created_at).toLocaleDateString()}</div>
                      {call.agent?.full_name && <div>{call.agent.full_name}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Followups sidebar */}
        <div>
          <h2 className="font-semibold text-slate-100 mb-3">Pending Follow-ups</h2>
          {followups.length === 0 ? (
            <p className="text-sm text-slate-500">No pending follow-ups</p>
          ) : (
            <div className="space-y-3">
              {followups.map((f: any) => (
                <FollowupWidget key={f.id} followup={f} onUpdate={() => router.refresh()} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Call log modal ───────────────────────────────────────────────────── */}
      {showCallModal && (
        <CallLogModal
          leadId={lead.id}
          leadName={companyFromLead || contactFromLead}
          onClose={() => setShowCallModal(false)}
          onSaved={() => { setShowCallModal(false); router.refresh(); }}
        />
      )}

      {/* ── Convert to Client modal ─────────────────────────────────────────── */}
      {showConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">

            {/* ── Success state ── */}
            {convertResult ? (
              <div className="p-6">

                {/* Title */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-emerald-400 text-xl">✓</div>
                  <div>
                    <h2 className="font-bold text-slate-100 text-base">Account created for {convertResult.companyName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{convertResult.email}</p>
                  </div>
                </div>

                {/* WhatsApp delivery status */}
                {convertResult.whatsappSent ? (
                  <div className="flex items-start gap-3 bg-emerald-950/50 border border-emerald-800/40 rounded-xl px-4 py-3 mb-4">
                    <span className="text-xl mt-0.5">💬</span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">WhatsApp sent automatically</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Login credentials delivered to {convertResult.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-800/30 rounded-xl px-4 py-3 mb-4">
                    <span className="text-xl mt-0.5">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">WhatsApp not delivered</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {convertResult.whatsappError || (!convertResult.phone ? 'No phone number on file' : 'Auto-send failed')}
                        {' '}— use the button below to send manually.
                      </p>
                    </div>
                  </div>
                )}

                {/* Credentials card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Login Credentials</p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-200 font-medium">{convertResult.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Password</span>
                      <span className="text-emerald-400 font-bold tracking-wider font-mono">{convertResult.temporaryPassword}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Portal</span>
                      <span className="text-slate-400 text-xs">{convertResult.portalUrl}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-800">Client must change password on first login</p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {/* Send via WhatsApp Web — always available as manual fallback */}
                  {convertResult.phone && (
                    <a
                      href={`https://wa.me/${convertResult.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}?text=${encodeURIComponent(convertResult.whatsappMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25d366]/10 border border-[#25d366]/30 text-[#25d366] rounded-xl text-sm font-semibold hover:bg-[#25d366]/20 transition-colors"
                    >
                      💬 {convertResult.whatsappSent ? 'Open in WhatsApp (already sent)' : 'Send via WhatsApp'}
                    </a>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={copyCredentials}
                      className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      {copied ? '✓ Copied' : 'Copy Credentials'}
                    </button>
                    <button
                      onClick={closeConvert}
                      className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Form state */
              <form onSubmit={handleConvert}>
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                  <div>
                    <h2 className="font-bold text-slate-100">Convert to Client</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Creates a portal login account for this lead</p>
                  </div>
                  <button type="button" onClick={closeConvert} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
                </div>

                <div className="p-5 space-y-3">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email <span className="text-rose-400">*</span></label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
                      placeholder="client@company.com"
                    />
                  </div>

                  {/* Contact name + Company name side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={form.company_name}
                        onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
                        placeholder="Company Ltd"
                      />
                    </div>
                  </div>

                  {/* Phone + State */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
                        placeholder="9XXXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
                      <select
                        value={form.state}
                        onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="">Select State / UT</option>
                        {INDIA_STATES_UTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* EPR Category */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">EPR Category <span className="text-rose-400">*</span></label>
                    <select
                      required
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
                    >
                      {EPR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* AI enrichment hint */}
                  {enrichment?.epr_category && (
                    <p className="text-xs text-violet-400">
                      AI suggested: <span className="font-semibold">{enrichment.epr_category}</span>
                    </p>
                  )}

                  {convertError && (
                    <p className="text-sm text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg px-3 py-2">{convertError}</p>
                  )}
                </div>

                <div className="flex gap-3 p-5 pt-0">
                  <button
                    type="submit"
                    disabled={converting}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {converting ? 'Creating Account…' : 'Create Client Account'}
                  </button>
                  <button
                    type="button"
                    onClick={closeConvert}
                    className="px-5 py-2.5 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
