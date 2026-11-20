'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type Credits = {
  total: number;
  used: number;
  remaining: number;
  plan: string;
};

type SendPilotJob = {
  id: string;
  company_id: string;
  company_name: string | null;
  job_type: string;
  status: string;
  sendpilot_search_id: string | null;
  results_count: number | null;
  credits_used: number | null;
  error_message: string | null;
  triggered_by: string;
  started_at: string;
  completed_at: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  completed: 'border-emerald-700/50 bg-emerald-500/10 text-emerald-300',
  processing: 'border-amber-700/50 bg-amber-500/10 text-amber-300',
  no_results: 'border-slate-600 bg-slate-800/50 text-slate-400',
  failed: 'border-red-700/50 bg-red-500/10 text-red-300',
};

export default function SendPilotAdminPage() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [jobs, setJobs] = useState<SendPilotJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const BASE = getIntelApiBaseUrl();

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${BASE}/intel/admin/sendpilot/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setJobs(body.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [BASE, getToken, statusFilter, page]);

  const loadCredits = useCallback(async () => {
    setCreditsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${BASE}/intel/admin/sendpilot/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCredits(await res.json());
    } catch {
      // credits are nice-to-have, don't block the page
    } finally {
      setCreditsLoading(false);
    }
  }, [BASE, getToken]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  async function handleBulkDiscover() {
    if (!confirm('Queue contact discovery for all unenriched companies? This will consume SendPilot credits.')) return;
    setBulkRunning(true);
    setBulkResult(null);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/intel/admin/sendpilot/bulk-discover`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setBulkResult(`Queued discovery for ${body.queued} companies`);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk discover failed');
    } finally {
      setBulkRunning(false);
    }
  }

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setApiKeySaving(true);
    setApiKeyMsg(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/intel/admin/sendpilot/settings`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendpilot_api_key: apiKeyInput.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setApiKeyMsg('API key saved successfully.');
      setApiKeyInput('');
      await loadCredits();
    } catch (err) {
      setApiKeyMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setApiKeySaving(false);
    }
  }

  const creditsPct = credits ? Math.round((credits.remaining / Math.max(credits.total, 1)) * 100) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">SendPilot Contact Discovery</h1>
        <p className="mt-1 text-sm text-slate-400">Manage automated LinkedIn contact discovery for EPR compliance leads</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Credits KPI */}
      <div className="grid gap-4 sm:grid-cols-3">
        {credits ? (
          <>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Credits Remaining</p>
              <p className="mt-2 text-2xl font-bold text-slate-100">{credits.remaining.toLocaleString()}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    (creditsPct ?? 0) > 30 ? 'bg-emerald-500' : (creditsPct ?? 0) > 10 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${creditsPct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">{creditsPct}% of {credits.total.toLocaleString()} total</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Credits Used</p>
              <p className="mt-2 text-2xl font-bold text-slate-100">{credits.used.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Plan</p>
              <p className="mt-2 text-lg font-semibold capitalize text-slate-100">{credits.plan || '—'}</p>
              <button
                type="button"
                onClick={loadCredits}
                disabled={creditsLoading}
                className="mt-2 text-[11px] text-teal-400 hover:text-teal-300 disabled:opacity-50"
              >
                {creditsLoading ? 'Refreshing…' : 'Refresh credits'}
              </button>
            </div>
          </>
        ) : (
          <div className="col-span-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-500">
              {creditsLoading ? 'Loading credits…' : 'Credits unavailable — check your API key.'}
            </p>
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleBulkDiscover}
          disabled={bulkRunning}
          className="rounded-md border border-teal-600/50 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-200 transition hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bulkRunning ? 'Queueing…' : 'Bulk Discover (50 companies)'}
        </button>
        {bulkResult && (
          <span className="text-sm text-emerald-300">{bulkResult}</span>
        )}
      </div>

      {/* API Key update */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm font-semibold text-slate-300">Update SendPilot API Key</p>
        <p className="mt-1 text-[11px] text-slate-500">Stored in intel_settings. Env var SENDPILOT_API_KEY is the fallback.</p>
        <div className="mt-3 flex gap-3">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sp_live_…"
            className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveApiKey}
            disabled={apiKeySaving || !apiKeyInput.trim()}
            className="rounded-md border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {apiKeySaving ? 'Saving…' : 'Save Key'}
          </button>
        </div>
        {apiKeyMsg && (
          <p className={`mt-2 text-[11px] ${apiKeyMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
            {apiKeyMsg}
          </p>
        )}
      </div>

      {/* Jobs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-300">Discovery Jobs</p>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="no_results">No Results</option>
              <option value="failed">Failed</option>
            </select>
            <button
              type="button"
              onClick={loadJobs}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No jobs found.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Results</th>
                    <th className="py-2 pr-4">Credits</th>
                    <th className="py-2 pr-4">Triggered By</th>
                    <th className="py-2 pr-4">Started</th>
                    <th className="py-2">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2 pr-4">
                        <a
                          href={`/intel/companies/${job.company_id}`}
                          className="font-medium text-teal-300 hover:text-teal-200"
                        >
                          {job.company_name || job.company_id.slice(0, 8)}
                        </a>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[job.status] || 'border-slate-700 text-slate-400'}`}>
                          {job.status}
                        </span>
                        {job.status === 'failed' && job.error_message && (
                          <p className="mt-0.5 text-[10px] text-red-400 max-w-[180px] truncate" title={job.error_message}>
                            {job.error_message}
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-300">{job.results_count ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-300">{job.credits_used ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-500 capitalize">{job.triggered_by}</td>
                      <td className="py-2 pr-4 text-slate-500 text-[11px]">
                        {new Date(job.started_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2 text-slate-500 text-[11px]">
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>{jobs.length} records shown</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 hover:bg-slate-700 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2 py-0.5">Page {page + 1}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={jobs.length < PAGE_SIZE}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 hover:bg-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
