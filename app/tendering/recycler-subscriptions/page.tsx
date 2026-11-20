'use client';

import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  trial:     'bg-amber-500/10 text-amber-300 border-amber-500/20',
  expired:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
  cancelled: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

const PLAN_COLORS: Record<string, string> = {
  basic:   'text-blue-300',
  pro:     'text-violet-300',
  premium: 'text-amber-300',
};

export default function RecyclerSubscriptionsPage() {
  const [subs,      setSubs]      = useState<any[]>([]);
  const [recyclers, setRecyclers] = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [statusF,   setStatusF]   = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ recycler_id: '', plan_code: 'basic', billing_cycle: 'monthly', amount_paid_inr: '', notes: '' });
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState('');

  async function load(p = page) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (statusF) params.set('status', statusF);
      if (search)  params.set('search', search);
      const r = await fetch(`/api/tendering/recycler-subscriptions?${params}`);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setSubs(d.subscriptions ?? []);
      setTotal(d.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecyclers() {
    // Fetch recyclers list for the add-subscription form
    try {
      const r = await fetch('/api/tendering/recycler-subscriptions?limit=200');
      if (!r.ok) return;
      // Just use the subscription list to get recycler options — or fall back to a dummy list
    } catch {}
  }

  useEffect(() => { setPage(1); load(1); }, [statusF, search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadRecyclers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleActivate(id: string) {
    await fetch(`/api/tendering/recycler-subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    load(page);
  }

  async function handleExpire(id: string) {
    await fetch(`/api/tendering/recycler-subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'expired' }),
    });
    load(page);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(''); setSaving(true);
    try {
      const r = await fetch('/api/tendering/recycler-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount_paid_inr: form.amount_paid_inr ? parseFloat(form.amount_paid_inr) : null,
          duration_months: form.billing_cycle === 'annual' ? 12 : 1,
        }),
      });
      if (!r.ok) { const d = await r.json(); setFormError(d.error || 'Failed'); return; }
      setShowModal(false);
      setForm({ recycler_id: '', plan_code: 'basic', billing_cycle: 'monthly', amount_paid_inr: '', notes: '' });
      load(1);
    } catch (err: any) {
      setFormError(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Recycler Subscriptions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage tender alert service subscriptions for recyclers. {total} total.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Subscription
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'active', 'trial', 'expired', 'cancelled'] as const).map(s => (
          <button key={s} onClick={() => setStatusF(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              statusF === s ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
        <div className="relative ml-auto">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recycler…"
            className="rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 w-48" />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><svg className="h-7 w-7 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : error ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <p className="text-rose-400 text-sm">{error}</p>
          <button onClick={() => load(page)} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Retry</button>
        </div>
      ) : subs.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 gap-2">
          <p className="text-slate-400 text-sm font-medium">No subscriptions found</p>
          <p className="text-slate-600 text-xs">Add the first recycler subscription to get started.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-900">
                  <tr>
                    {['Recycler', 'Plan', 'Billing', 'Start', 'End', 'Amount Paid', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {subs.map((s: any, i: number) => (
                    <tr key={s.id} className={`hover:bg-slate-800/30 transition-colors ${i % 2 === 1 ? 'bg-slate-900/30' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-200">{s.recycler_name}</p>
                        <p className="text-[10px] text-slate-500">{s.recycler_code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold capitalize ${PLAN_COLORS[s.plan_code] ?? 'text-slate-300'}`}>{s.plan_name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 capitalize">{s.billing_cycle}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{s.start_date ? new Date(s.start_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={new Date(s.end_date) < new Date() ? 'text-rose-400' : 'text-slate-400'}>
                          {s.end_date ? new Date(s.end_date).toLocaleDateString('en-IN') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {s.amount_paid_inr ? `₹${Number(s.amount_paid_inr).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[s.status] ?? ''}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {s.status === 'trial' && (
                            <button onClick={() => handleActivate(s.id)}
                              className="rounded px-2 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                              Activate
                            </button>
                          )}
                          {s.status === 'active' && (
                            <button onClick={() => handleExpire(s.id)}
                              className="rounded px-2 py-1 text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                              Expire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">{total} subscriptions</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-xs text-slate-400">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Add Subscription</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            {formError && <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">{formError}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Recycler ID <span className="text-rose-400">*</span></label>
                <input required value={form.recycler_id} onChange={e => setForm(v => ({ ...v, recycler_id: e.target.value }))}
                  placeholder="UUID from recyclers table"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</label>
                  <select value={form.plan_code} onChange={e => setForm(v => ({ ...v, plan_code: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500">
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Billing</label>
                  <select value={form.billing_cycle} onChange={e => setForm(v => ({ ...v, billing_cycle: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Paid (₹)</label>
                <input type="number" min={0} value={form.amount_paid_inr} onChange={e => setForm(v => ({ ...v, amount_paid_inr: e.target.value }))}
                  placeholder="e.g. 2499"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Activating…' : 'Activate Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
