'use client';

import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  active:      'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  blacklisted: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  suspended:   'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

const CATEGORIES = ['goods','services','works','IT','consulting','infrastructure'];

function StarRating({ score }: { score: number | null }) {
  const s = score ?? 0;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className={`h-3 w-3 ${i <= Math.round(s / 2) ? 'text-amber-400' : 'text-slate-700'}`} fill="currentColor">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
      <span className="ml-1 text-[10px] text-slate-500">{s.toFixed(1)}</span>
    </div>
  );
}

const EMPTY_VENDOR = {
  name: '', pan: '', gstin: '', category: [] as string[],
  empanelled_date: '', expiry_date: '', past_performance_score: '',
  contact_name: '', contact_email: '', contact_phone: '', notes: '',
};

export default function VendorsPage() {
  const [vendors,   setVendors]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(EMPTY_VENDOR);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search)  params.set('search', search);
      if (statusF) params.set('status', statusF);
      const r = await fetch(`/api/tendering/vendors?${params}`);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setVendors(d.vendors ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, statusF]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCategory(cat: string) {
    setForm(v => ({
      ...v,
      category: v.category.includes(cat) ? v.category.filter(c => c !== cat) : [...v.category, cat],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const r = await fetch('/api/tendering/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category: form.category.length ? form.category : null,
          past_performance_score: form.past_performance_score ? parseFloat(form.past_performance_score) : null,
          empanelled_date: form.empanelled_date || null,
          expiry_date: form.expiry_date || null,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setFormError(d.error || 'Failed to create');
        return;
      }
      setShowModal(false);
      setForm(EMPTY_VENDOR);
      load();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Vendor Registry</h1>
          <p className="text-sm text-slate-400 mt-0.5">{vendors.length} vendors registered.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Vendor
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blacklisted">Blacklisted</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {vendors.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 gap-2">
          <p className="text-slate-400 text-sm font-medium">No vendors found</p>
          <p className="text-slate-600 text-xs">Add your first vendor to the registry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vendors.map((v: any) => {
            const isBlacklisted = v.empanelment_status === 'blacklisted';
            return (
              <div key={v.id} className={`rounded-xl border bg-slate-900/50 p-4 space-y-3 ${isBlacklisted ? 'border-rose-500/30' : 'border-slate-800'}`}>
                {isBlacklisted && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    Blacklisted vendor
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{v.name}</p>
                    {v.gstin && <p className="text-[10px] text-slate-500 mt-0.5">GSTIN: {v.gstin}</p>}
                    {v.pan  && <p className="text-[10px] text-slate-500">PAN: {v.pan}</p>}
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[v.empanelment_status] ?? ''}`}>
                    {v.empanelment_status}
                  </span>
                </div>

                {v.category?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {v.category.map((c: string) => (
                      <span key={c} className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 capitalize">{c}</span>
                    ))}
                  </div>
                )}

                <StarRating score={v.past_performance_score} />

                {v.expiry_date && (
                  <p className="text-[11px] text-slate-500">
                    Expires: {new Date(v.expiry_date).toLocaleDateString('en-IN')}
                  </p>
                )}

                {v.contact_name && (
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-xs text-slate-300">{v.contact_name}</p>
                    {v.contact_email && <p className="text-[11px] text-slate-500">{v.contact_email}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-base font-semibold text-slate-100">Add Vendor</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Vendor Name', key: 'name', required: true },
                  { label: 'PAN', key: 'pan', required: false },
                  { label: 'GSTIN', key: 'gstin', required: false },
                  { label: 'Contact Name', key: 'contact_name', required: false },
                  { label: 'Contact Email', key: 'contact_email', required: false },
                  { label: 'Contact Phone', key: 'contact_phone', required: false },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {f.label} {f.required && <span className="text-rose-400">*</span>}
                    </label>
                    <input required={f.required} value={(form as any)[f.key]}
                      onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Empanelled Date</label>
                  <input type="date" value={form.empanelled_date} onChange={e => setForm(v => ({ ...v, empanelled_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry Date</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(v => ({ ...v, expiry_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Performance Score (0–10)</label>
                <input type="number" min={0} max={10} step={0.1} value={form.past_performance_score}
                  onChange={e => setForm(v => ({ ...v, past_performance_score: e.target.value }))}
                  placeholder="e.g. 8.5"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        form.category.includes(cat)
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
