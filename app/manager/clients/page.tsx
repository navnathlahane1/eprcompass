/**
 * /manager/clients
 * List of all clients assigned to this compliance manager.
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Client {
  id: string;
  status: string;
  category: string;
  waste_categories: string[] | null;
  onboarded_date: string | null;
  renewal_date: string | null;
  health_score: number | null;
  profile_id: string | null;
  company_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  state: string | null;
  filings: { total: number; pending: number; overdue: number };
}

const STATUS_COLOR: Record<string, string> = {
  'Active':      'bg-emerald-500/20 text-emerald-300',
  'At Risk':     'bg-amber-500/20 text-amber-300',
  'Inactive':    'bg-slate-700/50 text-slate-400',
  'Churned':     'bg-rose-500/20 text-rose-300',
  'Onboarding':  'bg-blue-500/20 text-blue-300',
};

const ALL_STATUSES = ['Active', 'At Risk', 'Onboarding', 'Inactive', 'Churned'];

function HealthDot({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[11px] text-slate-600">—</span>;
  const color = score >= 75 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-xs text-slate-300 tabular-nums">{score}</span>
    </div>
  );
}

export default function ManagerClientsPage() {
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search)       params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/manager/clients?${params}`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || `Failed to load clients (${res.status}).`);
      setLoading(false); return;
    }
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Clients</h1>
          <p className="text-sm text-slate-400 mt-0.5">Clients assigned to you for compliance management.</p>
        </div>
        <div className="text-sm text-slate-500">{clients.length} client{clients.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search company, name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] h-9 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && clients.length === 0 && (
        <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-300">No clients found</p>
          <p className="text-xs text-slate-600 mt-1">
            {statusFilter || search ? 'Try adjusting your filters.' : 'No clients have been assigned to you yet.'}
          </p>
        </div>
      )}

      {/* Client cards */}
      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/manager/clients/${c.id}`}
              className="group block rounded-xl border border-slate-800/70 bg-[#0c1022] p-4 hover:border-slate-700 hover:bg-slate-800/30 transition"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-teal-300 transition">
                    {c.company_name || c.full_name || 'Unknown'}
                  </p>
                  {c.email && <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.email}</p>}
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[c.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                  {c.status}
                </span>
              </div>

              {/* Info row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mb-3">
                {c.category && <span>{c.category}</span>}
                {c.state && <span>{c.state}</span>}
                {c.renewal_date && (
                  <span>Renewal: {new Date(c.renewal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800/60">
                <HealthDot score={c.health_score} />
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500">Filings:</span>
                  <span className="text-slate-300 font-medium">{c.filings.total}</span>
                </div>
                {c.filings.pending > 0 && (
                  <span className="text-[11px] text-amber-400">{c.filings.pending} pending</span>
                )}
                {c.filings.overdue > 0 && (
                  <span className="text-[11px] text-rose-400 font-medium">{c.filings.overdue} overdue</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
