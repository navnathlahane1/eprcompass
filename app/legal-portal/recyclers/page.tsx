'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DocSummary {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

interface Recycler {
  id: string;
  name: string;
  company_name: string;
  recycler_code: string;
  verification_status: string;
  state: string;
  epr_categories: string[];
  doc_summary: DocSummary;
}

type FilterMode = 'all' | 'needs_review' | 'all_verified';

const STATUS_BADGE: Record<string, string> = {
  VERIFIED: 'bg-emerald-900/40 text-emerald-400 border-emerald-700',
  PENDING: 'bg-amber-900/40 text-amber-400 border-amber-700',
  SUSPENDED: 'bg-red-900/40 text-red-400 border-red-700',
};

export default function LegalRecyclersPage() {
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    fetch('/api/legal-portal/recyclers')
      .then((r) => r.json())
      .then((d) => setRecyclers(d.recyclers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = recyclers.filter((r) => {
    const name = (r.company_name || r.name).toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (filter === 'needs_review') return r.doc_summary.pending > 0;
    if (filter === 'all_verified') return r.doc_summary.pending === 0 && r.doc_summary.verified > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Recyclers</h1>
        <p className="text-slate-400 text-sm mt-1">Search and filter recyclers for document review.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by company name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
        <div className="flex gap-2">
          {(['all', 'needs_review', 'all_verified'] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filter === f
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'needs_review' ? 'Needs Review' : 'All Verified'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 font-medium px-4 py-3">Company</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3">State</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3">EPR Categories</th>
                <th className="text-right text-slate-400 font-medium px-4 py-3">Pending</th>
                <th className="text-right text-slate-400 font-medium px-4 py-3">Verified</th>
                <th className="text-right text-slate-400 font-medium px-4 py-3">Total</th>
                <th className="text-left text-slate-400 font-medium px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No recyclers match your filters.
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-slate-100 font-medium">{r.company_name || r.name}</div>
                      <div className="text-slate-500 text-xs">{r.recycler_code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{r.state}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(r.epr_categories ?? []).slice(0, 3).map((cat) => (
                          <span key={cat} className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                            {cat}
                          </span>
                        ))}
                        {(r.epr_categories ?? []).length > 3 && (
                          <span className="text-slate-500 text-xs">+{r.epr_categories.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={r.doc_summary.pending > 0 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                        {r.doc_summary.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">{r.doc_summary.verified}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{r.doc_summary.total}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          STATUS_BADGE[r.verification_status] ?? 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}
                      >
                        {r.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/legal-portal/recyclers/${r.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
