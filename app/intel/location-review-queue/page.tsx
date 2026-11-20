'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

type ReviewType =
  | 'uncertain_branch_mapping'
  | 'conflicting_primary_location'
  | 'conflicting_registered_office'
  | 'ambiguous_google_result'
  | 'duplicate_risk'
  | 'conflicting_address';

type CompanyLocation = {
  id: string;
  company_id: string;
  location_name: string | null;
  location_type: string | null;
  city: string | null;
  state: string | null;
  address_line_1: string | null;
};

type IntelCompanyRef = {
  id: string;
  canonical_name: string;
};

type ReviewQueueRow = {
  id: string;
  company_id: string;
  location_id: string | null;
  review_type: ReviewType | null;
  review_reason: string | null;
  review_payload: Record<string, unknown>;
  status: ReviewStatus;
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  company_locations: CompanyLocation | null;
  intel_companies: IntelCompanyRef | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ReviewStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
];

const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  in_review: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  dismissed: 'bg-slate-600/40 text-slate-400 border border-slate-600/40',
};

const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  uncertain_branch_mapping: 'Uncertain Branch',
  conflicting_primary_location: 'Conflicting Primary',
  conflicting_registered_office: 'Conflicting Reg. Office',
  ambiguous_google_result: 'Ambiguous Google',
  duplicate_risk: 'Duplicate Risk',
  conflicting_address: 'Conflicting Address',
};

const NEXT_STATUS: Partial<Record<ReviewStatus, ReviewStatus>> = {
  pending: 'in_review',
  in_review: 'resolved',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocationReviewQueuePage() {
  const [rows, setRows] = useState<ReviewQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── API helpers ─────────────────────────────────────────────────────────────

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = await getToken();
    if (!token) { setError('Missing session token.'); setLoading(false); return; }

    const params = new URLSearchParams({ limit: '200' });
    if (statusFilter !== 'all') params.set('status', statusFilter);

    try {
      const res = await fetch(
        `${getIntelApiBaseUrl()}/api/intel/location-review-queue?${params}`,
        { headers: { authorization: `Bearer ${token}` } }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to load queue');
      setRows(body.rows ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function updateStatus(row: ReviewQueueRow, newStatus: ReviewStatus) {
    setActionLoading(row.id);
    const token = await getToken();
    if (!token) { setActionLoading(null); return; }

    try {
      const res = await fetch(
        `${getIntelApiBaseUrl()}/api/intel/location-review-queue/${row.id}`,
        {
          method: 'PATCH',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Update failed');

      setRows(prev => prev.map(r => r.id === row.id ? { ...r, ...body.row } : r));
      showToast(`Status → ${newStatus}`, true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed', false);
    } finally {
      setActionLoading(null);
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const inReviewCount = rows.filter(r => r.status === 'in_review').length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen px-6 py-8 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-xl transition-all
          ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
            <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            <span className="text-[11px] text-slate-400">Location Review Queue</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-7 rounded-full bg-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Location Review Queue</h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Flagged multi-location conflicts requiring manual review
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
              {pendingCount} pending
            </span>
          )}
          {inReviewCount > 0 && (
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
              {inReviewCount} in review
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            aria-label="Refresh queue"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300
              hover:border-teal-500/50 hover:text-teal-200 disabled:opacity-40 transition"
          >
            {loading ? 'Loading…' : '↺ Refresh'}
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition
              ${statusFilter === tab.value
                ? 'bg-teal-500/20 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            <span className="ml-3 text-sm text-slate-400">Loading queue…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <svg viewBox="0 0 24 24" className="mb-3 h-8 w-8 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No items in this queue</p>
            <p className="mt-1 text-xs opacity-60">
              {statusFilter === 'pending' ? 'All caught up — no pending reviews.' : `No ${statusFilter.replace('_', ' ')} items.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Review Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map(row => {
                const loc = row.company_locations;
                const co = row.intel_companies;
                const isExpanded = expandedId === row.id;
                const isActing = actionLoading === row.id;

                return (
                  <Fragment key={row.id}>
                    <tr
                      className="group hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                    >
                      {/* Company */}
                      <td className="px-4 py-3 font-medium text-slate-200 max-w-[220px]">
                        {co ? (
                          <Link
                            href={`/intel/companies/${co.id}`}
                            className="hover:text-teal-300 transition truncate block"
                            onClick={e => e.stopPropagation()}
                          >
                            {co.canonical_name}
                          </Link>
                        ) : (
                          <span className="text-slate-500 text-xs">{row.company_id.slice(0, 8)}…</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 text-slate-400 max-w-[200px]">
                        {loc ? (
                          <div>
                            <div className="text-slate-300 truncate">{loc.location_name || '—'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {[loc.city, loc.state].filter(Boolean).join(', ') || loc.address_line_1 || '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">No location data</span>
                        )}
                      </td>

                      {/* Review type */}
                      <td className="px-4 py-3">
                        {row.review_type ? (
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300 border border-slate-700">
                            {REVIEW_TYPE_LABELS[row.review_type] ?? row.review_type}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[row.status]}`}>
                          {row.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(row.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {NEXT_STATUS[row.status] && (
                            <button
                              disabled={isActing}
                              onClick={() => updateStatus(row, NEXT_STATUS[row.status]!)}
                              aria-label={`Advance to ${NEXT_STATUS[row.status]}`}
                              className="rounded-md bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-300
                                border border-teal-500/30 hover:bg-teal-500/25 disabled:opacity-40 transition"
                            >
                              {isActing ? '…' : `→ ${NEXT_STATUS[row.status]!.replace('_', ' ')}`}
                            </button>
                          )}
                          {(row.status === 'pending' || row.status === 'in_review') && (
                            <button
                              disabled={isActing}
                              onClick={() => updateStatus(row, 'dismissed')}
                              aria-label="Dismiss this review item"
                              className="rounded-md bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400
                                border border-slate-700 hover:text-slate-200 disabled:opacity-40 transition"
                            >
                              {isActing ? '…' : 'Dismiss'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr className="bg-slate-900/40">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6 text-xs md:grid-cols-3">
                            <div>
                              <div className="mb-1 font-semibold uppercase tracking-wider text-slate-500">Review Reason</div>
                              <p className="text-slate-300 leading-relaxed">{row.review_reason || '—'}</p>
                            </div>
                            <div>
                              <div className="mb-1 font-semibold uppercase tracking-wider text-slate-500">Location Type</div>
                              <p className="text-slate-300">{loc?.location_type ?? '—'}</p>
                            </div>
                            <div>
                              <div className="mb-1 font-semibold uppercase tracking-wider text-slate-500">Resolved At</div>
                              <p className="text-slate-300">{fmtDate(row.resolved_at)}</p>
                            </div>
                            {Object.keys(row.review_payload ?? {}).length > 0 && (
                              <div className="col-span-full">
                                <div className="mb-1 font-semibold uppercase tracking-wider text-slate-500">Review Payload</div>
                                <pre className="rounded-lg bg-slate-950 p-3 text-slate-400 text-xs overflow-x-auto max-h-40">
                                  {JSON.stringify(row.review_payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {!loading && rows.length > 0 && (
        <p className="mt-3 text-right text-xs text-slate-600">
          {rows.length} item{rows.length !== 1 ? 's' : ''} shown
        </p>
      )}

      <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
        <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to Intel
        </Link>
      </div>
    </div>
  );
}
