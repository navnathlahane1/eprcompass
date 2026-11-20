'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const STATUS_TABS = ['all', 'pending', 'in_progress', 'done', 'blocked'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: 'Open', in_progress: 'In Progress', done: 'Resolved', blocked: 'Closed (unresolved)',
};
const STATUS_COLORS: Record<string, string> = {
  pending:     'text-yellow-400 bg-yellow-900/30',
  in_progress: 'text-blue-400 bg-blue-900/30',
  done:        'text-green-400 bg-green-900/30',
  blocked:     'text-red-400 bg-red-900/30',
};

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

export default function OpsMyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusTab, role_context: 'support_ticket' });
    const res = await fetch(`/api/ops/tasks?${params}`);
    const data = await res.json();
    setTickets(data.tasks ?? []);
    setLoading(false);
  }, [statusTab]);

  useEffect(() => { load(); }, [load]);

  async function reopen(id: string) {
    await fetch(`/api/ops/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    });
    trackEvent('Ops Ticket Reopened', {});
    load();
  }

  function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const q = search.trim().toLowerCase();
  const filtered = tickets.filter(t => !q || [t.title, t.contact_name, t.contact_email].some(v => v?.toLowerCase().includes(q)));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-100">My Tickets</h1>
        <p className="text-sm text-slate-500 mt-0.5">Full history of tickets you've handled</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-700/60 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setStatusTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
              ${statusTab === tab ? 'border-rose-400 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
            {tab === 'all' ? 'All' : STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by issue, customer name, or email…"
        className="w-full mb-6 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="font-medium text-slate-400">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[t.status] ?? STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                    <span className="text-[10px] text-slate-600">{fmt(t.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{t.title}</p>
                  {t.contact_name && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.contact_name}{[t.contact_phone, t.contact_email].filter(Boolean).length ? ` · ${[t.contact_phone, t.contact_email].filter(Boolean).join(' · ')}` : ''}
                    </p>
                  )}
                  {t.description && <p className="mt-1.5 text-xs text-slate-400">{t.description}</p>}
                </div>
                {(t.status === 'done' || t.status === 'blocked') && (
                  <button onClick={() => reopen(t.id)}
                    className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
