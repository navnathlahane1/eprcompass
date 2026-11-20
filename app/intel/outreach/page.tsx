'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type Draft = {
  id: string; to_email: string; to_name: string; subject: string; status: string;
  company_name: string | null; company_state: string | null; created_at: string; sent_at: string | null; error_message: string | null;
};
type Contact = {
  id: string; company_id: string; person_name: string; designation: string | null;
  email: string | null; source: string; confidence_score: number | null; seniority_level: string | null; enriched_at: string | null;
};
type Job = {
  id: string; company_id: string; company_name: string | null; job_type: string;
  status: string; results_count: number | null; credits_used: number | null; created_at: string; completed_at: string | null;
};
type Summary = { drafts_pending: number; drafts_sent: number; total_contacts: number; jobs_active: number };
type DraftStatusBreakdown = Record<string, number>;
type SendPilotCredits = { total: number; used: number; remaining: number; plan?: string | null };

const DRAFT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Pending Approval', color: 'border-amber-600/50 bg-amber-500/10 text-amber-200' },
  approved: { label: 'Approved', color: 'border-teal-600/50 bg-teal-500/10 text-teal-200' },
  rejected: { label: 'Rejected', color: 'border-rose-600/50 bg-rose-500/10 text-rose-200' },
  sent: { label: 'Sent', color: 'border-cyan-600/50 bg-cyan-500/10 text-cyan-200' },
  failed: { label: 'Failed', color: 'border-slate-700 bg-slate-800/50 text-slate-400' },
};

const JOB_STATUS_COLORS: Record<string, string> = {
  completed: 'text-teal-300', processing: 'text-amber-300', queued: 'text-slate-300',
  failed: 'text-rose-300', no_results: 'text-slate-500',
};

export default function OutreachPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [draftBreakdown, setDraftBreakdown] = useState<DraftStatusBreakdown>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState<'drafts' | 'contacts' | 'jobs'>('drafts');
  const [search, setSearch] = useState('');
  const [sendPilotApiKey, setSendPilotApiKey] = useState('');
  const [sendPilotApiKeySaving, setSendPilotApiKeySaving] = useState(false);
  const [sendPilotApiKeyMessage, setSendPilotApiKeyMessage] = useState<string | null>(null);
  const [sendPilotCredits, setSendPilotCredits] = useState<SendPilotCredits | null>(null);
  const [sendPilotCreditsLoading, setSendPilotCreditsLoading] = useState(false);
  const [sendPilotBulkLimit, setSendPilotBulkLimit] = useState(20);
  const [sendPilotBulkTier, setSendPilotBulkTier] = useState<'hot' | 'warm' | 'both'>('both');
  const [sendPilotBulkForce, setSendPilotBulkForce] = useState(false);
  const [sendPilotBulkRunning, setSendPilotBulkRunning] = useState(false);
  const [sendPilotBulkMessage, setSendPilotBulkMessage] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.access_token || '';
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/outreach/overview`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
      setDrafts(data.drafts || []);
      setContacts(data.recent_contacts || []);
      setJobs(data.recent_jobs || []);
      setDraftBreakdown(data.draft_status_breakdown || {});
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const loadSendPilotCredits = useCallback(async () => {
    setSendPilotCreditsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/admin/sendpilot/credits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.error === 'no_api_key') {
        setSendPilotCredits(null);
        return;
      }
      setSendPilotCredits(data.credits || null);
    } catch (err) {
      setSendPilotBulkMessage(err instanceof Error ? err.message : 'Failed to load SendPilot credits');
    } finally {
      setSendPilotCreditsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadSendPilotCredits();
  }, [loadSendPilotCredits]);

  const filteredDrafts = useMemo(() => {
    let d = drafts;
    if (filterStatus) d = d.filter(x => x.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(x => (x.company_name || '').toLowerCase().includes(q) || (x.to_email || '').toLowerCase().includes(q) || (x.subject || '').toLowerCase().includes(q));
    }
    return d;
  }, [drafts, filterStatus, search]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c => (c.person_name || '').toLowerCase().includes(q) || (c.designation || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
  }, [contacts, search]);

  async function handleApprove(id: string) {
    const token = await getToken();
    if (!token) return;
    await fetch(`${getIntelApiBaseUrl()}/api/intel/outbound/drafts/${id}/approve`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({}),
    });
    load();
  }

  async function handleReject(id: string) {
    const token = await getToken();
    if (!token) return;
    await fetch(`${getIntelApiBaseUrl()}/api/intel/outbound/drafts/${id}/reject`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ reason: 'Rejected from outreach center' }),
    });
    load();
  }

  async function handleSaveSendPilotApiKey() {
    const apiKey = sendPilotApiKey.trim();
    if (!apiKey) {
      setSendPilotApiKeyMessage('Please enter an API key first.');
      return;
    }
    setSendPilotApiKeySaving(true);
    setSendPilotApiKeyMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/admin/sendpilot/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ api_key: apiKey })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSendPilotApiKeyMessage('SendPilot API key saved.');
      setSendPilotApiKey('');
      await loadSendPilotCredits();
    } catch (err) {
      setSendPilotApiKeyMessage(err instanceof Error ? err.message : 'Failed to save SendPilot key');
    } finally {
      setSendPilotApiKeySaving(false);
    }
  }

  async function handleRunSendPilotBulkDiscover() {
    setSendPilotBulkRunning(true);
    setSendPilotBulkMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in.');
      const tierPayload = sendPilotBulkTier === 'both' ? ['hot', 'warm'] : [sendPilotBulkTier];
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/admin/sendpilot/bulk-discover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          limit: Math.min(300, Math.max(1, Number(sendPilotBulkLimit) || 20)),
          tier: tierPayload,
          force: sendPilotBulkForce
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const queued = Number(data.queued || 0);
      setSendPilotBulkMessage(`Queued ${queued} company discovery jobs (${tierPayload.join(', ')} tier).`);
      await Promise.all([load(), loadSendPilotCredits()]);
    } catch (err) {
      setSendPilotBulkMessage(err instanceof Error ? err.message : 'Failed to trigger SendPilot bulk discovery');
    } finally {
      setSendPilotBulkRunning(false);
    }
  }

  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Outreach</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-violet-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Outreach Command Center</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Review and approve AI-generated email drafts, monitor contact discovery jobs, and manage outbound pipeline.
            </p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh
          </button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">{error}</p>}

        {/* KPIs */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Pending Approval', value: loading ? '—' : summary?.drafts_pending ?? 0, accent: 'text-amber-200', bar: 'bg-amber-400' },
            { label: 'Emails Sent', value: loading ? '—' : summary?.drafts_sent ?? 0, accent: 'text-teal-200', bar: 'bg-teal-400' },
            { label: 'Contacts Found', value: loading ? '—' : summary?.total_contacts ?? 0, accent: 'text-cyan-200', bar: 'bg-cyan-400' },
            { label: 'Jobs Running', value: loading ? '—' : summary?.jobs_active ?? 0, accent: 'text-violet-200', bar: 'bg-violet-400' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className={`mb-2.5 h-0.5 w-7 rounded-full ${k.bar}`} />
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{k.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${k.accent}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* SendPilot Control Panel */}
        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">SendPilot Control</p>
              <p className="mt-0.5 text-xs text-slate-400">Manage API key, check credits, and queue discovery runs from Intel.</p>
            </div>
            <button
              onClick={loadSendPilotCredits}
              disabled={sendPilotCreditsLoading}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-40"
            >
              {sendPilotCreditsLoading ? 'Refreshing…' : 'Refresh Credits'}
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Credits Remaining</p>
              <p className="mt-1 text-lg font-bold text-cyan-200 tabular-nums">{sendPilotCredits?.remaining ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Credits Used</p>
              <p className="mt-1 text-lg font-bold text-slate-200 tabular-nums">{sendPilotCredits?.used ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Credits Total</p>
              <p className="mt-1 text-lg font-bold text-slate-200 tabular-nums">{sendPilotCredits?.total ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Plan</p>
              <p className="mt-1 text-lg font-bold text-slate-200">{sendPilotCredits?.plan || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-300">Save SendPilot API Key</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={sendPilotApiKey}
                  onChange={(e) => setSendPilotApiKey(e.target.value)}
                  placeholder="sp_live_xxxxxxxxx"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  onClick={handleSaveSendPilotApiKey}
                  disabled={sendPilotApiKeySaving}
                  className="rounded-md border border-cyan-600/50 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
                >
                  {sendPilotApiKeySaving ? 'Saving…' : 'Save Key'}
                </button>
              </div>
              {sendPilotApiKeyMessage && <p className="mt-2 text-xs text-slate-400">{sendPilotApiKeyMessage}</p>}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-300">Bulk Discovery</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="text-xs text-slate-400">
                  Limit
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={sendPilotBulkLimit}
                    onChange={(e) => setSendPilotBulkLimit(Number(e.target.value) || 20)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Tier
                  <select
                    value={sendPilotBulkTier}
                    onChange={(e) => setSendPilotBulkTier(e.target.value as 'hot' | 'warm' | 'both')}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="both">Hot + Warm</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                  </select>
                </label>
                <label className="flex items-end gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={sendPilotBulkForce}
                    onChange={(e) => setSendPilotBulkForce(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500"
                  />
                  Force rerun
                </label>
              </div>
              <button
                onClick={handleRunSendPilotBulkDiscover}
                disabled={sendPilotBulkRunning}
                className="mt-3 rounded-md border border-violet-600/50 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/20 disabled:opacity-40"
              >
                {sendPilotBulkRunning ? 'Queueing…' : 'Run Bulk Discovery'}
              </button>
              {sendPilotBulkMessage && <p className="mt-2 text-xs text-slate-400">{sendPilotBulkMessage}</p>}
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-700 p-0.5">
            {(['drafts', 'contacts', 'jobs'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${view === v ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-slate-200'}`}>
                {v === 'drafts' ? `Drafts (${drafts.length})` : v === 'contacts' ? `Contacts (${contacts.length})` : `Jobs (${jobs.length})`}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-violet-400 focus:outline-none" />
          {view === 'drafts' && (
            <div className="flex gap-1">
              {Object.keys(DRAFT_STATUS_CONFIG).map(s => (
                <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${filterStatus === s ? DRAFT_STATUS_CONFIG[s].color : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                  {DRAFT_STATUS_CONFIG[s].label} ({draftBreakdown[s] ?? 0})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drafts */}
        {view === 'drafts' && (
          <div className="space-y-2">
            {loading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No email drafts yet. Run enrichment to generate personalized outreach.</p>
              </div>
            ) : filteredDrafts.map(d => {
              const cfg = DRAFT_STATUS_CONFIG[d.status] || DRAFT_STATUS_CONFIG.failed;
              return (
                <div key={d.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        {d.company_name && (
                          <span className="text-xs font-semibold text-slate-300">{d.company_name}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-100">{d.subject}</p>
                      <p className="mt-0.5 text-xs text-slate-400">To: {d.to_name ? `${d.to_name} <${d.to_email}>` : d.to_email}</p>
                      {d.error_message && <p className="mt-1 text-[11px] text-rose-400">Error: {d.error_message}</p>}
                    </div>
                    {d.status === 'pending_approval' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleApprove(d.id)}
                          className="rounded-md border border-teal-600/50 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-200 hover:bg-teal-500/20">
                          Approve
                        </button>
                        <button onClick={() => handleReject(d.id)}
                          className="rounded-md border border-rose-600/50 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] tabular-nums text-slate-600">{new Date(d.created_at).toLocaleString('en-IN')}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Contacts */}
        {view === 'contacts' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
            {loading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No contacts found. Run SendPilot contact discovery on target companies.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Seniority</th>
                      <th className="px-4 py-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => (
                      <tr key={c.id} className="border-b border-slate-900/80 hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-semibold text-slate-100">{c.person_name}</td>
                        <td className="px-4 py-3 text-slate-300">{c.designation || '—'}</td>
                        <td className="px-4 py-3">
                          {c.email ? <a href={`mailto:${c.email}`} className="text-violet-400 hover:text-violet-300">{c.email}</a> : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{c.source}</td>
                        <td className="px-4 py-3 text-slate-400 capitalize">{c.seniority_level || '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                          {c.confidence_score != null ? `${Math.round(c.confidence_score * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Jobs */}
        {view === 'jobs' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
            {loading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No SendPilot jobs run yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Results</th>
                      <th className="px-4 py-3 text-right">Credits</th>
                      <th className="px-4 py-3">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id} className="border-b border-slate-900/80">
                        <td className="px-4 py-3">
                          <Link href={`/intel/companies/${j.company_id}`} className="font-semibold text-slate-100 hover:text-violet-300">
                            {j.company_name || j.company_id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-400">{j.job_type.replace(/_/g, ' ')}</td>
                        <td className={`px-4 py-3 font-semibold capitalize ${JOB_STATUS_COLORS[j.status] || 'text-slate-400'}`}>{j.status}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{j.results_count ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">{j.credits_used ?? '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-500">{new Date(j.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </div>
    </div>
  );
}
