'use client';

import { useEffect, useState } from 'react';

const CATEGORIES = ['goods', 'services', 'works', 'epr'];
const PORTALS    = ['GeM', 'CPPP', 'State', 'Private'];

function fmt(n: number | null) {
  if (n == null) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const EMPTY_FORM = {
  title: '', authority: '', category: 'epr', portal: 'GeM',
  submission_deadline: '', emd_amount_inr: '', estimated_value_inr: '',
  description: '', eligibility_notes: '', opening_date: '', source_url: '', tags: '',
};

export default function GovtTendersPage() {
  const [tenders,   setTenders]   = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [portFilter,setPortFilter]= useState('');
  const [page,      setPage]      = useState(1);
  const [showSlide, setShowSlide] = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState('');
  const [editId,    setEditId]    = useState<string | null>(null);

  async function load(p = page) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (search)    params.set('search', search);
      if (catFilter) params.set('category', catFilter);
      if (portFilter)params.set('portal', portFilter);
      const r = await fetch(`/api/tendering/govt-tenders?${params}`);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setTenders(d.tenders ?? []);
      setTotal(d.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [search, catFilter, portFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggleActive(id: string, current: boolean) {
    await fetch(`/api/tendering/govt-tenders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    load(page);
  }

  function openEdit(t: any) {
    setEditId(t.id);
    setForm({
      title: t.title, authority: t.authority, category: t.category,
      portal: t.portal ?? '', submission_deadline: t.submission_deadline?.slice(0, 16) ?? '',
      emd_amount_inr: t.emd_amount_inr ?? '', estimated_value_inr: t.estimated_value_inr ?? '',
      description: t.description ?? '', eligibility_notes: t.eligibility_notes ?? '',
      opening_date: t.opening_date?.slice(0, 16) ?? '',
      source_url: t.source_url ?? '',
      tags: (t.tags ?? []).join(', '),
    });
    setShowSlide(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        emd_amount_inr:      form.emd_amount_inr      ? parseFloat(String(form.emd_amount_inr))      : null,
        estimated_value_inr: form.estimated_value_inr ? parseFloat(String(form.estimated_value_inr)) : null,
        portal:              form.portal || null,
        opening_date:        form.opening_date || null,
        source_url:          form.source_url || null,
        tags:                form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : null,
      };

      const url    = editId ? `/api/tendering/govt-tenders/${editId}` : '/api/tendering/govt-tenders';
      const method = editId ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) { const d = await r.json(); setFormError(d.error || 'Failed'); return; }
      setShowSlide(false); setForm(EMPTY_FORM); setEditId(null); load(1);
    } catch (err: any) {
      setFormError(err.message || 'Failed');
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
          <h1 className="text-xl font-bold text-slate-100">Govt Tenders for Recyclers</h1>
          <p className="text-sm text-slate-400 mt-0.5">Upload and manage tenders visible to subscribed recyclers. {total} published.</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowSlide(true); }}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Upload Tender
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenders…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.toUpperCase()}</option>)}
        </select>
        <select value={portFilter} onChange={e => setPortFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Portals</option>
          {PORTALS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <svg className="h-7 w-7 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        </div>
      ) : error ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <p className="text-rose-400 text-sm">{error}</p>
          <button onClick={() => load(page)} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Retry</button>
        </div>
      ) : tenders.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 gap-2">
          <p className="text-slate-400 text-sm font-medium">No tenders yet</p>
          <p className="text-slate-600 text-xs">Upload your first government tender for recyclers.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-900">
                  <tr>
                    {['Tender No', 'Title', 'Authority', 'Portal', 'EMD', 'Deadline', 'Uploaded By', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {tenders.map((t: any, i: number) => {
                    const days = t.days_remaining;
                    const dl   = days != null
                      ? days < 0  ? { text: 'Expired', cls: 'text-slate-500 line-through' }
                      : days <= 2 ? { text: `${days}d`, cls: 'text-rose-400 font-bold' }
                      : days <= 7 ? { text: `${days}d`, cls: 'text-amber-400' }
                      : { text: `${days}d`, cls: 'text-slate-400' }
                      : { text: '—', cls: 'text-slate-600' };

                    return (
                      <tr key={t.id} className={`transition-colors hover:bg-slate-800/30 ${i % 2 === 1 ? 'bg-slate-900/30' : ''}`}>
                        <td className="px-4 py-3"><span className="font-mono text-xs text-amber-400">{t.tender_no}</span></td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-medium text-slate-200 truncate">{t.title}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{t.category}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[130px] truncate">{t.authority}</td>
                        <td className="px-4 py-3">
                          {t.portal && <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">{t.portal}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{fmt(t.emd_amount_inr)}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <span className={dl.cls}>{dl.text}</span>
                          <p className="text-[10px] text-slate-600">{t.submission_deadline ? new Date(t.submission_deadline).toLocaleDateString('en-IN') : '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.uploaded_by_name}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleActive(t.id, t.is_active)}
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                              t.is_active
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/20'
                            }`}>
                            {t.is_active ? 'Live' : 'Hidden'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(t)} title="Edit"
                            className="text-slate-500 hover:text-amber-400 transition-colors">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 text-xs">{total} tenders</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-xs text-slate-400">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload / Edit slide-over */}
      {showSlide && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSlide(false)} />
          <div className="relative z-10 ml-auto flex h-full w-full max-w-md flex-col bg-slate-900 border-l border-slate-700 overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-base font-semibold text-slate-100">{editId ? 'Edit Tender' : 'Upload New Tender'}</h2>
              <button onClick={() => setShowSlide(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="flex-1 p-5 space-y-4">
              {formError && <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">{formError}</div>}

              {[
                { label: 'Title', key: 'title', type: 'text', req: true },
                { label: 'Issuing Authority', key: 'authority', type: 'text', req: true },
                { label: 'Submission Deadline', key: 'submission_deadline', type: 'datetime-local', req: true },
                { label: 'Opening Date', key: 'opening_date', type: 'datetime-local', req: false },
                { label: 'EMD Amount (₹)', key: 'emd_amount_inr', type: 'number', req: false },
                { label: 'Estimated Value (₹)', key: 'estimated_value_inr', type: 'number', req: false },
                { label: 'Source URL', key: 'source_url', type: 'url', req: false },
                { label: 'Tags (comma separated)', key: 'tags', type: 'text', req: false },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label} {f.req && <span className="text-rose-400">*</span>}</label>
                  <input type={f.type} required={f.req}
                    value={(form as any)[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category <span className="text-rose-400">*</span></label>
                  <select required value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
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
              </div>

              {[
                { label: 'Description', key: 'description' },
                { label: 'Eligibility Notes', key: 'eligibility_notes' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</label>
                  <textarea rows={3} value={(form as any)[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
                </div>
              ))}

              <div className="flex gap-3 pt-2 pb-4">
                <button type="button" onClick={() => setShowSlide(false)} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Upload Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
