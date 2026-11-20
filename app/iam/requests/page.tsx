'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type UserRequest = {
  id: string;
  role: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  notes: string | null;
  status: 'pending' | 'fulfilled' | 'rejected';
  rejection_reason: string | null;
  requested_by_name: string | null;
  requested_by_email: string | null;
  handled_by_name: string | null;
  handled_at: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  trainer: 'Trainer',
  guest_trainer: 'Guest Trainer',
  academy_manager: 'Academy Manager',
};

const STATUS_PILL: Record<string, string> = {
  pending:   'border-amber-500/30 bg-amber-500/10 text-amber-300',
  fulfilled: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rejected:  'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

const TABS = [
  { value: 'pending',   label: 'Pending' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'all',       label: 'All' },
] as const;

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function IamRequestsPage() {
  const [tab, setTab]         = useState<typeof TABS[number]['value']>('pending');
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason]   = useState('');
  const [busy, setBusy]       = useState(false);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/iam/user-requests?status=${status}`);
      const json = await res.json();
      if (res.ok) setRequests(json.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  async function reject(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/iam/user-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejection_reason: reason }),
      });
      if (res.ok) {
        setRejecting(null);
        setReason('');
        load(tab);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">User Requests</h1>
        <p className="text-sm text-slate-500">
          Academy Directors&rsquo; requests to provision new academy users. Open one to create the
          account pre-filled with their details.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.value
                ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                : 'border-slate-800 bg-[#0c1022] text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-10 text-center text-sm text-slate-500">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-10 text-center">
          <p className="text-sm font-medium text-slate-300">No {tab === 'all' ? '' : tab} requests</p>
          <p className="mt-1 text-xs text-slate-500">Requests raised by Academy Directors will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-100">{r.full_name}</p>
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                      {ROLE_LABELS[r.role] ?? r.role}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {r.email}{r.phone ? ` · ${r.phone}` : ''}{r.company_name ? ` · ${r.company_name}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_PILL[r.status]}`}>
                  {r.status}
                </span>
              </div>

              {r.notes && (
                <p className="mt-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">{r.notes}</p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                <span>Requested by {r.requested_by_name || r.requested_by_email || 'Academy Director'} · {fmtDate(r.created_at)}</span>
                {r.status !== 'pending' && r.handled_by_name && (
                  <span>{r.status === 'fulfilled' ? 'Created' : 'Declined'} by {r.handled_by_name} · {fmtDate(r.handled_at)}</span>
                )}
              </div>

              {r.status === 'rejected' && r.rejection_reason && (
                <p className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-300">
                  Reason: {r.rejection_reason}
                </p>
              )}

              {/* Pending actions */}
              {r.status === 'pending' && (
                <div className="mt-3 border-t border-slate-800/60 pt-3">
                  {rejecting === r.id ? (
                    <div className="space-y-2">
                      <input
                        type="text" value={reason} autoFocus
                        onChange={e => setReason(e.target.value)}
                        placeholder="Reason for declining (optional)"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-rose-500/50 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(r.id)} disabled={busy}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          {busy ? 'Declining…' : 'Confirm Decline'}
                        </button>
                        <button
                          onClick={() => { setRejecting(null); setReason(''); }}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href={`/iam/create?request=${r.id}`}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                      >
                        Create User →
                      </Link>
                      <button
                        onClick={() => { setRejecting(r.id); setReason(''); }}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
