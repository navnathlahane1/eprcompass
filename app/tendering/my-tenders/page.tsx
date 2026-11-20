'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  new:        'bg-blue-500/10 text-blue-300 border-blue-500/20',
  evaluating: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  bidding:    'bg-amber-500/10 text-amber-300 border-amber-500/20',
  submitted:  'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  won:        'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  lost:       'bg-rose-500/10 text-rose-300 border-rose-500/20',
  cancelled:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const ALL_STATUSES = ['all', 'new', 'evaluating', 'bidding', 'submitted', 'won', 'lost', 'cancelled'];

export default function MyTendersPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');

  async function load() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/tendering/tenders');
      if (r.status === 403) {
        // Executive: fetch all bids instead and show tenders from them
        const br = await fetch('/api/tendering/bids');
        if (!br.ok) throw new Error(await br.text());
        const bd = await br.json();
        // Build pseudo-tender list from bids
        const seen = new Set<string>();
        const arr: any[] = [];
        for (const b of bd.bids ?? []) {
          if (!seen.has(b.tender_id)) {
            seen.add(b.tender_id);
            arr.push({
              id: b.tender_id, title: b.tender_title, tender_no: b.tender_no,
              submission_deadline: b.tender_deadline, status: 'bidding',
              bid_status: b.status, bid_no: b.bid_no,
            });
          }
        }
        setTenders(arr);
        return;
      }
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setTenders(d.tenders ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? tenders : tenders.filter(t => t.status === filter);
  const now = new Date();

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-rose-400 text-sm">{error}</p>
      <button onClick={load} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Retry</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-100">My Tenders</h1>
        <p className="text-sm text-slate-400 mt-0.5">Tenders assigned to you or bids you&apos;ve prepared.</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 gap-2">
          <p className="text-slate-400 text-sm font-medium">No tenders found</p>
          <p className="text-slate-600 text-xs">No tenders match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t: any) => {
            const deadline = t.submission_deadline ? new Date(t.submission_deadline) : null;
            const days = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400_000) : null;
            const urgentClass = days !== null && days <= 2 ? 'border-rose-500/30' : 'border-slate-800';

            return (
              <div key={t.id} className={`rounded-xl border ${urgentClass} bg-slate-900/50 p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 leading-snug truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.tender_no} {t.authority ? `· ${t.authority}` : ''}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[t.status] ?? ''}`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  {deadline ? (
                    <span className={`font-medium ${days !== null && days <= 2 ? 'text-rose-400' : days !== null && days <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {days !== null && days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d remaining`}
                    </span>
                  ) : <span className="text-slate-600">No deadline</span>}
                  {t.bid_status && (
                    <span className="text-[10px] text-slate-500">Bid: {t.bid_status}</span>
                  )}
                </div>

                <Link href={`/tendering/tenders`}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 py-1.5 text-center text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                  View Details
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
