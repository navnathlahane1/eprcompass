'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

interface RecyclerRow {
  id: string;
  name: string;
  recycler_code: string;
  verification_status: string;
  contact_email: string;
  state: string;
  epr_categories: string[];
  onboarded_at: string | null;
  documents: { doc_type: string; status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-800 border-amber-300',
  VERIFIED:    'bg-green-100 text-green-800 border-green-300',
  SUSPENDED:   'bg-red-100 text-red-800 border-red-300',
  BLACKLISTED: 'bg-gray-200 text-gray-700 border-gray-400',
};

const REQUIRED_DOCS = ['CPCB Cert', 'GST', 'Bank Details'];

function DocSummary({ docs }: { docs: { doc_type: string; status: string }[] }) {
  const map: Record<string, string> = {};
  for (const d of docs) map[d.doc_type] = d.status;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {REQUIRED_DOCS.map((dt) => {
        const s = map[dt];
        const cls = !s
          ? 'bg-gray-100 text-gray-500 border-gray-200'
          : s === 'Verified'
          ? 'bg-green-50 text-green-700 border-green-200'
          : s === 'Pending'
          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
          : 'bg-red-50 text-red-700 border-red-200';
        return (
          <span key={dt} className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${cls}`}>
            {dt}: {s ?? 'Missing'}
          </span>
        );
      })}
    </div>
  );
}

export default function RecyclerApprovalsPage() {
  const [recyclers, setRecyclers] = useState<RecyclerRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [tab, setTab]             = useState<'PENDING' | 'VERIFIED' | 'SUSPENDED'>('PENDING');
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback((status: string) => {
    // Cancel any still-in-flight request from a previous tab switch — without
    // this, a slower earlier request can resolve after a faster later one and
    // silently overwrite the correct list with stale data for the wrong tab.
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError('');
    fetch(`/api/iam/recycler-approvals?status=${status}`, { signal: ctrl.signal })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ctrl.signal.aborted) return;
        if (!ok) { setError(d.error ?? 'Failed to load recyclers'); setRecyclers([]); return; }
        setRecyclers(d.recyclers ?? []);
      })
      .catch((e) => {
        if (e.name === 'AbortError' || ctrl.signal.aborted) return;
        setError('Network error while loading recyclers');
        setRecyclers([]);
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const tabs = [
    { key: 'PENDING',   label: 'Pending Review' },
    { key: 'VERIFIED',  label: 'Approved' },
    { key: 'SUSPENDED', label: 'Suspended' },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Recycler Approvals</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Review documents and approve recycler accounts to unlock portal features.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {error ? (
        <div className="rounded-xl border border-rose-700/50 bg-rose-950/30 p-6 text-center">
          <p className="text-rose-300 text-sm font-medium">Couldn't load recyclers</p>
          <p className="text-rose-400/80 text-xs mt-1">{error}</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : recyclers.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center">
          <p className="text-slate-400 text-sm">No recyclers with status: {tab}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recyclers.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4 hover:border-teal-600/50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{r.name}</span>
                    <span className="text-xs font-mono text-slate-400">{r.recycler_code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.verification_status] ?? 'bg-slate-700 text-slate-300'}`}>
                      {r.verification_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.contact_email} · {r.state} · {(r.epr_categories ?? []).join(', ') || '—'}
                  </p>
                  {r.onboarded_at && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Onboarded: {new Date(r.onboarded_at).toLocaleDateString('en-IN')}
                    </p>
                  )}
                  <DocSummary docs={r.documents} />
                </div>
                <Link
                  href={`/iam/recycler-approvals/${r.id}`}
                  className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                >
                  Review →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
