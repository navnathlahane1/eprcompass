'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { STATUS_COLORS, PRIORITY_COLORS, STATUSES } from '@/lib/serviceRequests/constants';
import type { ServiceRequestStatus, ServiceRequestPriority } from '@/lib/serviceRequests/constants';

type SR = {
  id: string;
  category: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  clients?: {
    profiles?: { full_name?: string; company_name?: string } | null;
  } | null;
  profiles?: { full_name?: string } | null; // assigned_to
  service_request_quotes?: { total_amount?: number; quote_status?: string }[];
};

export default function ServiceRequestsAdminClient({ requests: initial }: { requests: SR[] }) {
  const [requests] = useState(initial);
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchStatus = activeStatus === 'All' || r.status === activeStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.subject.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.clients?.profiles?.company_name?.toLowerCase().includes(q) ||
        false;
      return matchStatus && matchSearch;
    });
  }, [requests, activeStatus, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: requests.length };
    STATUSES.forEach(s => {
      map[s] = requests.filter(r => r.status === s).length;
    });
    return map;
  }, [requests]);

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(['All', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeStatus === s
                ? 'bg-teal-600 text-white'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-teal-400 hover:text-teal-600'
            }`}
          >
            {s}
            {counts[s] > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${activeStatus === s ? 'bg-teal-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject, category, company…"
            className="w-full rounded-lg border border-slate-800 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/60 p-10 text-center">
          <p className="text-sm text-slate-500">No service requests match the current filter.</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8ecf0] bg-[#f0f4f8]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client / Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">Quote</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(r => {
                const quote = r.service_request_quotes?.[0];
                return (
                  <tr key={r.id} className="hover:bg-slate-950 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-100 truncate max-w-[180px]">{r.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.clients?.profiles?.company_name || r.clients?.profiles?.full_name || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 hidden sm:table-cell text-xs">{r.category}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[r.priority as ServiceRequestPriority] || 'bg-slate-900 text-slate-400'}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status as ServiceRequestStatus] || 'bg-slate-900 text-slate-400'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                      {r.profiles?.full_name || <span className="text-slate-600">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {quote?.total_amount
                        ? <span className="text-teal-700 font-medium">₹{Number(quote.total_amount).toLocaleString('en-IN')}</span>
                        : <span className="text-slate-600 text-xs">No quote</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell text-xs">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/service-requests/${r.id}`}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline whitespace-nowrap"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
