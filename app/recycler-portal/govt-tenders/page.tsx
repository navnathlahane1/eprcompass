'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CATEGORIES = ['goods','services','works','epr'];
const PORTALS    = ['GeM','CPPP','State','Private'];

function fmt(n: number | null) {
  if (n == null) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function RecyclerGovtTendersPage() {
  const [tenders,    setTenders]    = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [sub,        setSub]        = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [isSubError, setIsSubError] = useState(false);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [portFilter, setPortFilter] = useState('');
  const [page,       setPage]       = useState(1);

  async function load(p = page) {
    setLoading(true); setError(''); setIsSubError(false);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (search)    params.set('search', search);
      if (catFilter) params.set('category', catFilter);
      if (portFilter)params.set('portal', portFilter);
      const r = await fetch(`/api/recycler-portal/govt-tenders?${params}`);
      if (r.status === 402) {
        setIsSubError(true);
        setError('subscription_required');
        return;
      }
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setTenders(d.tenders ?? []);
      setTotal(d.total ?? 0);
      setSub(d.subscription ?? null);
    } catch (e: any) {
      if (!isSubError) setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [search, catFilter, portFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / 20);

  if (!loading && isSubError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Subscribe to Access Tenders</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-sm">
            Access government and private tenders sourced from GeM, CPPP, and State portals. Choose a plan to get started.
          </p>
        </div>
        <Link href="/recycler-portal/tender-services"
          className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
          View Plans →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Government Tenders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} active tenders sourced from {sub?.plan_code ? `your ${sub.plan_code} plan` : 'all portals'}.
            {sub?.end_date && <span className="ml-2 text-green-600 font-medium">Plan valid till {new Date(sub.end_date).toLocaleDateString('en-IN')}</span>}
          </p>
        </div>
        <Link href="/recycler-portal/filing-requests"
          className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
          Request Filing
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenders…"
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
        <select value={portFilter} onChange={e => setPortFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500">
          <option value="">All Portals</option>
          {PORTALS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><svg className="h-7 w-7 animate-spin text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : error ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => load(page)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Retry</button>
        </div>
      ) : tenders.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white gap-2">
          <p className="text-gray-500 text-sm font-medium">No tenders found</p>
          <p className="text-gray-400 text-xs">Try adjusting your filters or check back later for new uploads.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {tenders.map((t: any) => {
              const days = t.days_remaining;
              const urgentClass = days != null && days <= 2 ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white';
              const dayLabel = days != null
                ? days < 0  ? { text: 'Deadline passed', cls: 'text-gray-400 line-through' }
                : days === 0 ? { text: 'Today!', cls: 'text-red-600 font-bold animate-pulse' }
                : days <= 2  ? { text: `${days}d remaining`, cls: 'text-red-600 font-bold' }
                : days <= 7  ? { text: `${days}d remaining`, cls: 'text-amber-600 font-semibold' }
                : { text: `${days}d remaining`, cls: 'text-gray-500' }
                : { text: '—', cls: 'text-gray-400' };

              return (
                <Link key={t.id} href={`/recycler-portal/govt-tenders/${t.id}`}
                  className={`block rounded-xl border ${urgentClass} p-4 hover:shadow-sm transition-all`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t.tender_no}</span>
                        {t.portal && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{t.portal}</span>}
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{t.category}</span>
                      </div>
                      <h3 className="mt-1.5 text-sm font-semibold text-gray-900 leading-snug">{t.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{t.authority}</p>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      <p className={`text-xs ${dayLabel.cls}`}>{dayLabel.text}</p>
                      {t.emd_amount_inr && <p className="text-xs text-gray-400">EMD: {fmt(t.emd_amount_inr)}</p>}
                      {t.estimated_value_inr && <p className="text-xs font-medium text-gray-700">{fmt(t.estimated_value_inr)}</p>}
                    </div>
                  </div>
                  {t.description && (
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">{t.description}</p>
                  )}
                  {t.tags?.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {t.tags.slice(0, 4).map((tag: string) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">{total} tenders</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-xs text-gray-500">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
