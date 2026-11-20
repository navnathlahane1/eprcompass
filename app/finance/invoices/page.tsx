'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_no: string;
  client_id: string;
  client_name: string;
  amount_inr: number;
  tax_inr: number;
  total_inr: number;
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  status: string;
  notes: string | null;
  pdf_path: string | null;
}

interface Summary {
  total: number; draft: number; sent: number; paid: number; overdue: number; cancelled: number;
  totalValue: number; collected: number; outstanding: number;
}

const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-slate-700/60 text-slate-400',
  sent:     'bg-blue-500/20 text-blue-300',
  paid:     'bg-emerald-500/20 text-emerald-300',
  overdue:  'bg-rose-500/20 text-rose-300',
  cancelled:'bg-slate-600/30 text-slate-500',
};

function fmt(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function dueDanger(inv: Invoice) {
  if (inv.status === 'paid' || inv.status === 'cancelled') return false;
  if (!inv.due_date) return false;
  return new Date(inv.due_date) < new Date();
}

// ── Quick Upload Modal ────────────────────────────────────────────────────────

function UploadModal({ inv, onClose, onDone }: { inv: Invoice; onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  async function upload(file: File) {
    setUploading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/finance/invoices/${inv.id}/document`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      onDone();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0c1022] p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-slate-100">Upload Invoice</p>
            <p className="mt-0.5 text-xs text-slate-500">{inv.invoice_no} · {inv.client_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {inv.pdf_path && (
          <p className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
            An invoice document is already uploaded. Uploading will replace it.
          </p>
        )}

        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-700 py-6 text-sm font-medium text-slate-400 transition hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-50">
          {uploading
            ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            : (
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                </svg>
                Click to choose file
              </>
            )}
        </button>
        <p className="mt-1.5 text-center text-[10px] text-slate-600">PDF, PNG or JPG · max 10MB</p>

        <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />

        {err && <p className="mt-2 text-xs text-rose-400">{err}</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type SortKey = 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'due_asc';

export default function InvoicesPage() {
  const [invoices,    setInvoices]    = useState<Invoice[]>([]);
  const [summary,     setSummary]     = useState<Summary | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [status,      setStatus]      = useState('');
  const [search,      setSearch]      = useState('');
  const [searchQ,     setSearchQ]     = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [uploadInv,   setUploadInv]   = useState<Invoice | null>(null);

  // Filter state
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [amtMin,      setAmtMin]      = useState('');
  const [amtMax,      setAmtMax]      = useState('');
  const [sortKey,     setSortKey]     = useState<SortKey>('newest');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status)  params.set('status', status);
    if (searchQ) params.set('search', searchQ);
    fetch(`/api/finance/invoices?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => { setInvoices(d.invoices ?? []); setSummary(d.summary ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, searchQ]);

  useEffect(() => { load(); }, [load]);

  // Client-side filtering + sorting
  const displayed = useMemo(() => {
    let list = [...invoices];

    if (dateFrom) list = list.filter(i => i.issued_date >= dateFrom);
    if (dateTo)   list = list.filter(i => i.issued_date <= dateTo);
    if (amtMin)   list = list.filter(i => i.total_inr >= parseFloat(amtMin));
    if (amtMax)   list = list.filter(i => i.total_inr <= parseFloat(amtMax));

    switch (sortKey) {
      case 'oldest':     list.sort((a, b) => a.issued_date.localeCompare(b.issued_date)); break;
      case 'amount_high':list.sort((a, b) => b.total_inr - a.total_inr); break;
      case 'amount_low': list.sort((a, b) => a.total_inr - b.total_inr); break;
      case 'due_asc':    list.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')); break;
      default:           list.sort((a, b) => b.issued_date.localeCompare(a.issued_date)); break;
    }

    return list;
  }, [invoices, dateFrom, dateTo, amtMin, amtMax, sortKey]);

  const hasExtraFilters = dateFrom || dateTo || amtMin || amtMax || sortKey !== 'newest';

  function clearAllFilters() {
    setStatus(''); setSearch(''); setSearchQ('');
    setDateFrom(''); setDateTo(''); setAmtMin(''); setAmtMax('');
    setSortKey('newest');
  }

  return (
    <div className="space-y-5">
      {uploadInv && (
        <UploadModal inv={uploadInv} onClose={() => setUploadInv(null)} onDone={load} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Invoices</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {summary ? `${summary.total} invoices · ${fmt(summary.totalValue)} total` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              showFilters || hasExtraFilters
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
            }`}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {hasExtraFilters && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                {[dateFrom, dateTo, amtMin, amtMax, sortKey !== 'newest'].filter(Boolean).length}
              </span>
            )}
          </button>
          <Link href="/finance/invoices/create"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </Link>
        </div>
      </div>

      {/* Status pills */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            { label: 'All',       value: summary.total,     key: '',          color: 'text-slate-300' },
            { label: 'Draft',     value: summary.draft,     key: 'draft',     color: 'text-slate-400' },
            { label: 'Sent',      value: summary.sent,      key: 'sent',      color: 'text-blue-400' },
            { label: 'Overdue',   value: summary.overdue,   key: 'overdue',   color: 'text-rose-400' },
            { label: 'Paid',      value: summary.paid,      key: 'paid',      color: 'text-emerald-400' },
            { label: 'Cancelled', value: summary.cancelled, key: 'cancelled', color: 'text-slate-600' },
          ].map(pill => (
            <button key={pill.key} onClick={() => setStatus(pill.key)}
              className={`flex flex-col items-center rounded-xl border p-2.5 transition ${
                status === pill.key ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-800/80 bg-[#0c1022] hover:border-slate-700'
              }`}>
              <span className={`text-xl font-bold tabular-nums ${pill.color}`}>{pill.value}</span>
              <span className="text-[10px] text-slate-600">{pill.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Value cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Billed', value: fmt(summary.totalValue), color: 'text-slate-100',   bg: 'bg-slate-700/30' },
            { label: 'Collected',    value: fmt(summary.collected),  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Outstanding',  value: fmt(summary.outstanding),color: 'text-amber-400',   bg: 'bg-amber-500/10' },
          ].map(v => (
            <div key={v.label} className={`rounded-xl border border-slate-800/80 ${v.bg} p-3`}>
              <p className="text-[10px] text-slate-600">{v.label}</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${v.color}`}>{v.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Advanced Filters</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Date range */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Issued From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Issued To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
            </div>

            {/* Amount range */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Min Amount (₹)</label>
              <input type="number" min="0" placeholder="0" value={amtMin} onChange={e => setAmtMin(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Max Amount (₹)</label>
              <input type="number" min="0" placeholder="∞" value={amtMax} onChange={e => setAmtMax(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50" />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Sort by:</span>
            {([
              { key: 'newest',      label: 'Newest first' },
              { key: 'oldest',      label: 'Oldest first' },
              { key: 'amount_high', label: 'Amount ↓' },
              { key: 'amount_low',  label: 'Amount ↑' },
              { key: 'due_asc',     label: 'Due date' },
            ] as { key: SortKey; label: string }[]).map(s => (
              <button key={s.key} onClick={() => setSortKey(s.key)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                  sortKey === s.key
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/30 text-slate-500 hover:text-slate-300'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={clearAllFilters}
              className="text-xs font-medium text-slate-500 transition hover:text-rose-400">
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search client or invoice number…"
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearchQ(search)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 transition" />
        </div>
        <button onClick={() => setSearchQ(search)}
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200">
          Search
        </button>
        {(status || searchQ || hasExtraFilters) && (
          <button onClick={clearAllFilters} className="text-xs text-slate-500 transition hover:text-slate-300">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] py-16 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto mb-3 h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-slate-500">No invoices found</p>
          <Link href="/finance/invoices/create" className="mt-2 inline-block text-xs text-emerald-400 hover:text-emerald-300 transition">
            Create one →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <div className="border-b border-slate-800/60 px-4 py-2.5 flex items-center justify-between">
            <p className="text-[10px] text-slate-600">{displayed.length} invoice{displayed.length !== 1 ? 's' : ''} shown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Invoice</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Client</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Due</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Issued</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Doc</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {displayed.map(inv => (
                  <tr key={inv.id} className={`transition hover:bg-slate-800/20 ${dueDanger(inv) ? 'bg-rose-500/[0.03]' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/finance/invoices/${inv.id}`}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition">
                        {inv.invoice_no}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{inv.client_name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold tabular-nums text-slate-100">{fmt(inv.total_inr)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[inv.status] || 'bg-slate-700/50 text-slate-400'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${dueDanger(inv) ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
                        {fmtDate(inv.due_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(inv.issued_date)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setUploadInv(inv)}
                        title={inv.pdf_path ? 'Replace invoice document' : 'Upload invoice document'}
                        className={`flex items-center justify-center rounded-md border p-1.5 transition ${
                          inv.pdf_path
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'border-slate-700 text-slate-600 hover:border-slate-600 hover:text-slate-400'
                        }`}>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                          {inv.pdf_path
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                          }
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/finance/invoices/${inv.id}`}
                        className="rounded-md border border-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-slate-700 hover:text-slate-300">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
