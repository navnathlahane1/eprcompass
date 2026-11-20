'use client';

import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  new:        'bg-blue-500/10 text-blue-300 border-blue-500/20',
  evaluating: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  bidding:    'bg-amber-500/10 text-amber-300 border-amber-500/20',
  submitted:  'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  won:        'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  lost:       'bg-rose-500/10 text-rose-300 border-rose-500/20',
  cancelled:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const ALL_STATUSES = ['new','evaluating','bidding','submitted','won','lost','cancelled'];
const CATEGORIES   = ['goods','services','works'];
const PORTALS      = ['GeM','CPPP','State','Private'];

function fmt(n: number | null) {
  if (n == null) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const EMPTY_FORM = {
  title: '', authority: '', category: 'goods', portal: '', submission_deadline: '',
  emd_amount_inr: '', estimated_value_inr: '', published_date: '', notes: '',
};

export default function AllTendersPage() {
  const [tenders,    setTenders]    = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [portFilter, setPortFilter] = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);

  const [showSlide,  setShowSlide]  = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  async function load(p = page) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (catFilter)    params.set('category', catFilter);
      if (portFilter)   params.set('portal', portFilter);
      if (search)       params.set('search', search);
      const r = await fetch(`/api/tendering/tenders?${params}`);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setTenders(d.tenders ?? []);
      setTotal(d.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [statusFilter, catFilter, portFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/tendering/tenders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load(page);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const r = await fetch('/api/tendering/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          emd_amount_inr: form.emd_amount_inr ? parseFloat(form.emd_amount_inr) : null,
          estimated_value_inr: form.estimated_value_inr ? parseFloat(form.estimated_value_inr) : null,
          portal: form.portal || null,
          published_date: form.published_date || null,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setFormError(d.error || 'Failed to create');
        return;
      }
      setShowSlide(false);
      setForm(EMPTY_FORM);
      load(1);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create tender');
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.ceil(total / 20);
  const now = new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">All Tenders</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} tenders in the pipeline.</p>
        </div>
        <button onClick={() => setShowSlide(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Tender
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tenders…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>

        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>

        <select value={portFilter} onChange={e => setPortFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Portals</option>
          {PORTALS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <svg className="h-7 w-7 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : error ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <p className="text-rose-400 text-sm">{error}</p>
          <button onClick={() => load(page)} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Retry</button>
        </div>
      ) : tenders.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 gap-2">
          <p className="text-slate-400 text-sm font-medium">No tenders found</p>
          <p className="text-slate-600 text-xs">Try adjusting your filters or create a new tender.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-900">
                  <tr>
                    {['Tender No', 'Title', 'Authority', 'Category', 'Portal', 'EMD', 'Deadline', 'Status', 'Assigned', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {tenders.map((t: any, i: number) => {
                    const days = t.days_remaining;
                    const urgentText = days != null
                      ? days < 0 ? 'Overdue'
                      : days === 0 ? 'Today'
                      : `${days}d`
                      : '—';
                    const urgentCls = days != null && days <= 2 ? 'text-rose-400 font-bold' : days != null && days <= 7 ? 'text-amber-400' : 'text-slate-500';

                    return (
                      <tr key={t.id} className={`transition-colors hover:bg-slate-800/30 ${i % 2 === 1 ? 'bg-slate-900/30' : ''}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-amber-400">{t.tender_no}</span>
                          {t.corrigendum_count > 0 && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-300">
                              C{t.corrigendum_count}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-medium text-slate-200 truncate">{t.title}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[130px] truncate">{t.authority}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 capitalize">{t.category}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.portal || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{fmt(t.emd_amount_inr)}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <span className={urgentCls}>{urgentText}</span>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {t.submission_deadline ? new Date(t.submission_deadline).toLocaleDateString('en-IN') : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <select value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)}
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-transparent focus:outline-none cursor-pointer ${STATUS_COLORS[t.status] ?? ''}`}>
                            {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-slate-900 text-slate-200 capitalize">{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.assigned_name || '—'}</td>
                        <td className="px-4 py-3">
                          <button className="text-slate-500 hover:text-amber-400 transition-colors">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 text-xs">{total} tenders</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-xs text-slate-400">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* New Tender Slide-over */}
      {showSlide && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSlide(false)} />
          <div className="relative z-10 ml-auto flex h-full w-full max-w-md flex-col bg-slate-900 border-l border-slate-700 overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-base font-semibold text-slate-100">New Tender</h2>
              <button onClick={() => setShowSlide(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 p-5 space-y-4">
              {formError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">{formError}</div>
              )}

              {[
                { label: 'Title', key: 'title', type: 'text', required: true, placeholder: 'Tender title' },
                { label: 'Issuing Authority', key: 'authority', type: 'text', required: true, placeholder: 'e.g. CPCB, MoEFCC' },
                { label: 'Submission Deadline', key: 'submission_deadline', type: 'datetime-local', required: true, placeholder: '' },
                { label: 'Published Date', key: 'published_date', type: 'date', required: false, placeholder: '' },
                { label: 'EMD Amount (₹)', key: 'emd_amount_inr', type: 'number', required: false, placeholder: 'e.g. 50000' },
                { label: 'Estimated Value (₹)', key: 'estimated_value_inr', type: 'number', required: false, placeholder: 'e.g. 5000000' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {f.label} {f.required && <span className="text-rose-400">*</span>}
                  </label>
                  <input type={f.type} required={f.required} placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              ))}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category <span className="text-rose-400">*</span></label>
                <select value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))} required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500">
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Portal</label>
                <select value={form.portal} onChange={e => setForm(v => ({ ...v, portal: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500">
                  <option value="">Select…</option>
                  {PORTALS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
                  placeholder="Internal notes…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-2 pb-4">
                <button type="button" onClick={() => setShowSlide(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Creating…' : 'Create Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
