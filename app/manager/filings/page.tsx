'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Filing {
  id: string;
  client_id: string;
  client_name: string;
  category: string;
  current_status: string;
  sla_due_at: string | null;
  updated_at: string;
  fy_label: string;
  overdue: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  'Received':           'bg-blue-500/20 text-blue-300',
  'Under Review':       'bg-amber-500/20 text-amber-300',
  'Clarification':      'bg-orange-500/20 text-orange-300',
  'Approved':           'bg-emerald-500/20 text-emerald-300',
  'Certificate Issued': 'bg-teal-500/20 text-teal-300',
  'Rejected':           'bg-rose-500/20 text-rose-300',
  'Pending':            'bg-slate-500/20 text-slate-400',
};

const ALL_STATUSES = [
  'Received', 'Under Review', 'Clarification', 'Approved', 'Certificate Issued', 'Rejected',
];

const FILING_STATUSES = ALL_STATUSES;

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function relativeTime(d: string) {
  const diff  = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return fmtDate(d);
}

export default function ManagerFilingsPage() {
  const searchParams = useSearchParams();
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get('overdue') === 'true');

  // Inline status update
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const fetchFilings = useCallback(async () => {
    setLoading(true); setError('');
    const params = new URLSearchParams();
    if (search)        params.set('search', search);
    if (statusFilter)  params.set('status', statusFilter);
    if (overdueOnly)   params.set('overdue', 'true');
    const res = await fetch(`/api/manager/filings?${params}`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || `Failed to load filings (${res.status}).`);
      setLoading(false); return;
    }
    const data = await res.json();
    setFilings(data.filings ?? []);
    setLoading(false);
  }, [search, statusFilter, overdueOnly]);

  useEffect(() => { fetchFilings(); }, [fetchFilings]);

  async function updateFilingStatus(filingId: string, newStatus: string) {
    setUpdatingId(filingId);
    const res = await fetch(`/api/manager/filings/${filingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setFilings(prev => prev.map(f => f.id === filingId ? { ...f, current_status: newStatus, overdue: false } : f));
      setUpdateMsg({ id: filingId, ok: true, text: 'Status updated.' });
    } else {
      setUpdateMsg({ id: filingId, ok: false, text: data.error || 'Update failed.' });
    }
    setUpdatingId(null);
    setTimeout(() => setUpdateMsg(null), 3000);
  }

  const overdueCount = filings.filter(f => f.overdue).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">All Filings</h1>
          <p className="text-sm text-slate-400 mt-0.5">EPR filing statuses across all your assigned clients.</p>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            {overdueCount} overdue
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search client, category, FY…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] h-9 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setOverdueOnly(p => !p)}
          className={`h-9 rounded-lg border px-4 text-xs font-medium transition ${
            overdueOnly
              ? 'border-rose-500/60 bg-rose-500/15 text-rose-300'
              : 'border-slate-700/60 bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Overdue only
        </button>
      </div>

      {/* Count */}
      {!loading && <div className="text-xs text-slate-600">{filings.length} filing{filings.length !== 1 ? 's' : ''}</div>}

      {/* Error */}
      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filings.length === 0 && (
        <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-300">No filings found</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting your filters.</p>
        </div>
      )}

      {/* Filing rows */}
      {!loading && !error && filings.length > 0 && (
        <div className="space-y-2">
          {filings.map(f => {
            const msg = updateMsg?.id === f.id ? updateMsg : null;
            return (
              <div
                key={f.id}
                className={`rounded-xl border bg-[#0c1022] p-4 ${f.overdue ? 'border-rose-500/30' : 'border-slate-800/70'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/manager/clients/${f.client_id}`}
                        className="text-sm font-semibold text-slate-200 hover:text-teal-300 transition truncate"
                      >
                        {f.client_name}
                      </Link>
                      <span className="text-xs text-slate-500">{f.category}</span>
                      {f.fy_label && (
                        <span className="text-[11px] border border-slate-700 text-slate-500 rounded px-1.5 py-0.5">{f.fy_label}</span>
                      )}
                      {f.overdue && (
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded px-1.5 py-0.5">OVERDUE</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-[11px] text-slate-600">
                      {f.sla_due_at && <span>SLA: {fmtDate(f.sla_due_at)}</span>}
                      <span>Updated: {relativeTime(f.updated_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[f.current_status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                      {f.current_status}
                    </span>
                    <select
                      value={f.current_status}
                      disabled={updatingId === f.id}
                      onChange={e => updateFilingStatus(f.id, e.target.value)}
                      className="h-7 rounded-md border border-slate-700/60 bg-slate-800 px-2 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                    >
                      {FILING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {updatingId === f.id && (
                      <svg className="h-4 w-4 animate-spin text-teal-400 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    )}
                  </div>
                </div>
                {msg && (
                  <p className={`mt-2 text-[11px] ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
