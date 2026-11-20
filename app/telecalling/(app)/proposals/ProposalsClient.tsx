'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const STATUS_TABS = ['all', 'draft', 'sent', 'accepted', 'rejected'] as const;
const STATUS_COLORS: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-800',
  sent: 'text-blue-400 bg-blue-900/30',
  viewed: 'text-purple-400 bg-purple-900/30',
  accepted: 'text-green-400 bg-green-900/30',
  rejected: 'text-red-400 bg-red-900/30',
};

const DEFAULT_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #1e293b;">
  <div style="background: #0f172a; color: white; padding: 32px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">EPR Compliance Proposal</h1>
    <p style="margin: 8px 0 0; opacity: 0.7;">Prepared by EPR Compass</p>
  </div>
  <div style="padding: 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear [Client Name],</p>
    <p>Thank you for your interest in EPR compliance services. We are pleased to present this proposal for your organization's Extended Producer Responsibility (EPR) registration and compliance management.</p>

    <h2 style="color: #0f172a; margin-top: 24px;">Our Services</h2>
    <ul>
      <li>EPR Registration with CPCB/State PCBs</li>
      <li>Annual EPR Target Setting &amp; Planning</li>
      <li>Recycler Network Management</li>
      <li>Quarterly Compliance Reports</li>
      <li>Renewal &amp; Audit Support</li>
    </ul>

    <h2 style="color: #0f172a; margin-top: 24px;">Investment</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
      <tr style="background: #0f172a; color: white;">
        <th style="padding: 10px 14px; text-align: left; border-radius: 6px 0 0 0;">Service</th>
        <th style="padding: 10px 14px; text-align: right; border-radius: 0 6px 0 0;">Amount (INR)</th>
      </tr>
      <tr style="background: white; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px;">EPR Registration</td>
        <td style="padding: 10px 14px; text-align: right;">₹[Amount]</td>
      </tr>
      <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px;">Annual Compliance Management</td>
        <td style="padding: 10px 14px; text-align: right;">₹[Amount]</td>
      </tr>
    </table>

    <p style="margin-top: 24px;">This proposal is valid until [Valid Until]. Please reach out to discuss any questions.</p>

    <p>Warm regards,<br/><strong>[Your Name]</strong><br/>EPR Compass</p>
  </div>
</div>`;

function autoFillTemplate(template: string, vars: { clientName?: string; amount?: string; validUntil?: string }) {
  let result = template;
  if (vars.clientName && result.includes('[Client Name]')) {
    result = result.replaceAll('[Client Name]', vars.clientName);
  }
  if (vars.amount && result.includes('[Amount]')) {
    result = result.replaceAll('[Amount]', vars.amount);
  }
  if (vars.validUntil && result.includes('[Valid Until]')) {
    const fmt = new Date(vars.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    result = result.replaceAll('[Valid Until]', fmt);
  }
  return result;
}

interface Lead {
  id: string;
  company_name: string | null;
  name: string | null;
  email: string | null;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  amount_inr: number | null;
  valid_until: string | null;
  sent_at: string | null;
  created_at: string;
  content_html?: string | null;
  share_token?: string | null;
  lead: { id: string; company_name: string | null; name: string | null; email: string | null } | null;
}

const EMPTY_FORM = { lead_id: '', title: '', amount_inr: '', valid_until: '', content_html: DEFAULT_TEMPLATE };

export default function ProposalsClient() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<'preview' | 'edit'>('preview');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [chatText, setChatText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  function showBanner(type: 'success' | 'error', message: string) {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 6000);
  }

  function closeModal() {
    setShowCreate(false);
    setShowAiPanel(false);
    setChatText('');
    setAiError('');
    setEditingId(null);
    setContentTab('preview');
    setForm(EMPTY_FORM);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setContentTab('preview');
    setShowCreate(true);
  }

  function openEdit(p: Proposal) {
    setForm({
      lead_id: p.lead?.id || '',
      title: p.title,
      amount_inr: p.amount_inr ? String(p.amount_inr) : '',
      valid_until: p.valid_until || '',
      content_html: p.content_html || DEFAULT_TEMPLATE,
    });
    setEditingId(p.id);
    setContentTab('preview');
    setShowCreate(true);
  }

  function shareLink(p: Proposal) {
    if (!p.share_token) return null;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '');
    return `${site}/proposal/${p.share_token}`;
  }

  async function copyLink(p: Proposal) {
    const link = shareLink(p);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showBanner('error', 'Could not copy link — copy it manually: ' + link);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusTab });
    const res = await fetch(`/api/telecalling/proposals?${params}`);
    const data = await res.json();
    setProposals(data.proposals ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, statusTab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/admin/telecalling/leads?limit=200&page=1')
      .then(r => r.json())
      .then(d => setLeads((d.leads ?? []).slice(0, 100).map((l: Lead & Record<string, unknown>) => ({
        id: l.id, company_name: l.company_name, name: l.name, email: l.email,
      }))));
  }, []);

  async function generateFromChat() {
    if (!chatText.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/telecalling/ai-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_text: chatText, lead_id: form.lead_id || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? 'AI generation failed'); return; }

      // Auto-fill the form with AI output
      const matchedLead = data.client_name
        ? leads.find(l =>
            (l.company_name ?? '').toLowerCase().includes(data.client_name.toLowerCase()) ||
            (l.name ?? '').toLowerCase().includes(data.client_name.toLowerCase())
          )
        : null;

      setForm(f => ({
        ...f,
        lead_id: matchedLead?.id || f.lead_id,
        title: data.title || f.title,
        amount_inr: data.amount_inr ? String(data.amount_inr) : f.amount_inr,
        content_html: data.content_html || f.content_html,
      }));
      trackEvent('Telecalling AI Proposal Generated', {});
      setShowAiPanel(false);
    } catch {
      setAiError('Network error — please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch(isEdit ? `/api/telecalling/proposals/${editingId}` : '/api/telecalling/proposals', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showBanner('error', data.error || 'Could not save the proposal — please try again.');
        return;
      }
      trackEvent(isEdit ? 'Telecalling Proposal Edited' : 'Telecalling Proposal Created', {});
      showBanner('success', isEdit ? 'Proposal updated.' : 'Proposal saved as draft.');
      closeModal();
      load();
    } catch {
      showBanner('error', 'Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function sendToClient(p: Proposal) {
    setSending(p.id);
    try {
      const res = await fetch(`/api/telecalling/proposals/${p.id}/send`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showBanner('error', data.error || 'Could not send the proposal.');
        return;
      }
      trackEvent('Telecalling Proposal Sent', { emailed: data.emailed });
      showBanner(
        'success',
        data.emailed
          ? `Emailed to the client and marked as sent. Link: ${data.link}`
          : `Marked as sent. ${data.emailReason || ''} Use the "Copy Link" button to share it manually.`
      );
      load();
    } catch {
      showBanner('error', 'Network error — please try again.');
    } finally {
      setSending(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this draft proposal? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/telecalling/proposals/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showBanner('error', data.error || 'Could not delete the proposal.');
        return;
      }
      showBanner('success', 'Draft deleted.');
      load();
    } catch {
      showBanner('error', 'Network error — please try again.');
    } finally {
      setDeleting(null);
    }
  }

  async function updateStatus(id: string, status: string, leadId: string) {
    try {
      const res = await fetch(`/api/telecalling/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, lead_id: leadId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showBanner('error', data.error || 'Could not update the proposal status.');
        return;
      }
      trackEvent('Telecalling Proposal Status Changed', { status });
      showBanner('success', `Marked as ${status}.`);
      load();
    } catch {
      showBanner('error', 'Network error — please try again.');
    }
  }

  function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function fmtMoney(n: number | null) {
    if (!n) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div>
      {banner && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
          banner.type === 'success'
            ? 'border-emerald-700/40 bg-emerald-950/40 text-emerald-300'
            : 'border-red-700/40 bg-red-950/40 text-red-300'
        }`}>
          <span className="break-words">{banner.message}</span>
          <button onClick={() => setBanner(null)} className="shrink-0 text-current opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Proposals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and track proposals for interested clients</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Proposal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700/60 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setStatusTab(tab); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              statusTab === tab ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-slate-400">No proposals yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft}`}>
                      {p.status}
                    </span>
                    {p.amount_inr && (
                      <span className="text-[11px] font-semibold text-emerald-400">{fmtMoney(p.amount_inr)}</span>
                    )}
                    {p.valid_until && (
                      <span className="text-[10px] text-slate-500">Valid till {fmt(p.valid_until)}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{p.title}</p>
                  {p.lead && (
                    <p className="text-xs text-slate-400 mt-1">
                      {p.lead.company_name || p.lead.name || '—'}
                      {p.lead.email && <span className="text-slate-500"> · {p.lead.email}</span>}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-600 mt-1">Created {fmt(p.created_at)}{p.sent_at ? ` · Sent ${fmt(p.sent_at)}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => setViewProposal(p)}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                  >
                    Preview
                  </button>
                  {p.status === 'draft' && (
                    <>
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition disabled:opacity-50"
                      >
                        {deleting === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                      {p.lead && (
                        <button
                          onClick={() => sendToClient(p)}
                          disabled={sending === p.id}
                          className="rounded-lg bg-blue-900/40 hover:bg-blue-900/70 border border-blue-700/30 px-3 py-1.5 text-xs font-semibold text-blue-400 transition disabled:opacity-50"
                        >
                          {sending === p.id ? 'Sending…' : 'Send to Client'}
                        </button>
                      )}
                    </>
                  )}
                  {p.status !== 'draft' && p.share_token && (
                    <button
                      onClick={() => copyLink(p)}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                    >
                      {copiedId === p.id ? 'Copied!' : 'Copy Link'}
                    </button>
                  )}
                  {(p.status === 'sent' || p.status === 'viewed') && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(p.id, 'accepted', p.lead?.id as unknown as string ?? '')}
                        className="rounded-lg bg-green-900/30 hover:bg-green-900/60 border border-green-700/30 px-3 py-1.5 text-xs font-semibold text-green-400 transition"
                      >
                        Accepted
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, 'rejected', p.lead?.id as unknown as string ?? '')}
                        className="rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition"
                      >
                        Rejected
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 30 && (
        <div className="flex justify-center gap-3 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded bg-slate-800 text-slate-300 disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-500">{page}</span>
          <button disabled={proposals.length < 30} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded bg-slate-800 text-slate-300 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl mb-8">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">{showAiPanel ? 'Generate from WhatsApp Chat' : editingId ? 'Edit Proposal' : 'New Proposal'}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAiPanel(v => !v); setAiError(''); }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    showAiPanel
                      ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                      : 'bg-violet-900/30 border-violet-700/30 text-violet-400 hover:bg-violet-900/60 hover:text-violet-300'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Generate
                </button>
                <button onClick={closeModal} className="text-slate-500 hover:text-slate-300">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* AI Panel — paste WhatsApp chat */}
            {showAiPanel && (
              <div className="p-5 space-y-3 border-b border-slate-800 bg-violet-950/20">
                <p className="text-xs text-slate-400">
                  Paste the WhatsApp conversation below. The AI will read it and auto-fill the proposal title, amount, and email content.
                </p>
                <textarea
                  rows={8}
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  placeholder="Paste your WhatsApp chat here…&#10;&#10;e.g.:&#10;Client: We produce plastic packaging. Do you handle EPR registration?&#10;You: Yes, we handle CPCB EPR registration starting from ₹15,000…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:border-violet-500 focus:outline-none resize-y font-mono"
                />
                {aiError && <p className="text-xs text-red-400">{aiError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAiPanel(false); setAiError(''); }}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    Fill manually instead
                  </button>
                  <button
                    type="button"
                    onClick={generateFromChat}
                    disabled={aiLoading || !chatText.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Proposal
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Client Lead *</label>
                  <select
                    required
                    value={form.lead_id}
                    onChange={e => {
                      const newId = e.target.value;
                      const lead = leads.find(l => l.id === newId);
                      const clientName = lead?.company_name || lead?.name || '';
                      setForm(f => ({
                        ...f,
                        lead_id: newId,
                        content_html: clientName ? autoFillTemplate(f.content_html, { clientName }) : f.content_html,
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">— Select lead —</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.company_name || l.name || l.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Proposal Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. EPR Compliance Package 2025"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    value={form.amount_inr}
                    onChange={e => {
                      const amount = e.target.value;
                      setForm(f => ({
                        ...f,
                        amount_inr: amount,
                        content_html: amount ? autoFillTemplate(f.content_html, { amount }) : f.content_html,
                      }));
                    }}
                    placeholder="e.g. 50000"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => {
                      const validUntil = e.target.value;
                      setForm(f => ({
                        ...f,
                        valid_until: validUntil,
                        content_html: validUntil ? autoFillTemplate(f.content_html, { validUntil }) : f.content_html,
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-400">Proposal Content</label>
                  <div className="flex rounded-lg border border-slate-700 overflow-hidden text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setContentTab('preview')}
                      className={`px-3 py-1 transition ${contentTab === 'preview' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentTab('edit')}
                      className={`px-3 py-1 transition ${contentTab === 'edit' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Edit HTML
                    </button>
                  </div>
                </div>
                {contentTab === 'preview' ? (
                  <iframe
                    title="Proposal preview"
                    srcDoc={form.content_html}
                    sandbox=""
                    className="w-full h-64 rounded-lg border border-slate-700 bg-white"
                  />
                ) : (
                  <textarea
                    rows={10}
                    value={form.content_html}
                    onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-300 focus:border-teal-500 focus:outline-none resize-y"
                  />
                )}
                <p className="text-[10px] text-slate-600 mt-1">
                  This is what the client will see. Placeholders fill in automatically when you pick a lead, amount, or valid-until date — switch to &ldquo;Edit HTML&rdquo; only if you need to change the wording or layout.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                  {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Proposal Modal (read-only preview, any status) */}
      {viewProposal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl mb-8">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-100">{viewProposal.title}</h2>
                <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[viewProposal.status] ?? STATUS_COLORS.draft}`}>
                  {viewProposal.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {viewProposal.share_token && (
                  <button
                    onClick={() => copyLink(viewProposal)}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                  >
                    {copiedId === viewProposal.id ? 'Copied!' : 'Copy Link'}
                  </button>
                )}
                <button onClick={() => setViewProposal(null)} className="text-slate-500 hover:text-slate-300">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-5">
              <iframe
                title="Proposal"
                srcDoc={viewProposal.content_html || '<p style="font-family: sans-serif; color: #64748b;">No content.</p>'}
                sandbox=""
                className="w-full h-[28rem] rounded-lg border border-slate-700 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

