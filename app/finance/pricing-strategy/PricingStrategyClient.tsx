'use client';

import { useState, useEffect, useCallback } from 'react';

interface ServicePrice {
  id: string;
  name: string;
  category: string;
  description: string | null;
  base_price_inr: number;
  gst_rate: number;
  unit: string;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'General', 'Registration', 'Annual Plan', 'Advisory',
  'Filing', 'Renewal', 'Network', 'Compliance',
];

const UNITS = [
  'per registration', 'per year', 'per engagement', 'per filing',
  'per audit', 'per renewal', 'per certificate', 'per quarter',
  'per recycler', 'lump sum',
];

const GST_RATES = [0, 5, 12, 18, 28];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CATEGORY_COLORS: Record<string, string> = {
  Registration:  'bg-blue-900/40 text-blue-300',
  'Annual Plan': 'bg-purple-900/40 text-purple-300',
  Advisory:      'bg-amber-900/40 text-amber-300',
  Filing:        'bg-teal-900/40 text-teal-300',
  Renewal:       'bg-emerald-900/40 text-emerald-300',
  Network:       'bg-cyan-900/40 text-cyan-300',
  Compliance:    'bg-indigo-900/40 text-indigo-300',
  General:       'bg-slate-800 text-slate-400',
};

function categoryBadge(cat: string) {
  const cls = CATEGORY_COLORS[cat] ?? 'bg-slate-800 text-slate-400';
  return <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>{cat}</span>;
}

const EMPTY_FORM = {
  name: '', category: 'Registration', description: '',
  base_price_inr: '', gst_rate: '18', unit: 'per registration',
  is_active: true, sort_order: '0', notes: '',
};

type FormState = typeof EMPTY_FORM;

export default function PricingStrategyClient() {
  const [services, setServices]     = useState<ServicePrice[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isCFO, setIsCFO]           = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showInactive, setShowInactive]     = useState(false);

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<ServicePrice | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/finance/pricing');
      const json = await res.json();
      setServices(json.services ?? []);
      // If we can POST, we're CFO — we'll detect via role header absence
      // Instead check via a simple profile call
      const me = await fetch('/api/finance/dashboard').catch(() => null);
      // Simpler: attempt check via a known CFO indicator on next request
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check role via a lightweight endpoint
    fetch('/api/finance/tasks?limit=1&countOnly=1')
      .then(r => r.headers.get('x-finance-role') ?? '')
      .catch(() => '')
      .then(() => {});

    // Better: try a POST preflight to detect CFO
    fetch('/api/finance/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(r => {
        // 400 = bad input but authorized (CFO); 403 = not CFO
        if (r.status === 400 || r.status === 201) setIsCFO(true);
      })
      .catch(() => {});

    load();
  }, [load]);

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category))).sort()];

  const filtered = services.filter(s => {
    if (!showInactive && !s.is_active) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(s: ServicePrice) {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      description: s.description ?? '',
      base_price_inr: String(s.base_price_inr),
      gst_rate: String(s.gst_rate),
      unit: s.unit,
      is_active: s.is_active,
      sort_order: String(s.sort_order),
      notes: s.notes ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  function setField(k: keyof FormState, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.base_price_inr) {
      setError('Name and base price are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name:           form.name.trim(),
        category:       form.category,
        description:    form.description.trim() || null,
        base_price_inr: Number(form.base_price_inr),
        gst_rate:       Number(form.gst_rate),
        unit:           form.unit,
        is_active:      form.is_active,
        sort_order:     Number(form.sort_order),
        notes:          form.notes.trim() || null,
      };

      const url    = editing ? `/api/finance/pricing/${editing.id}` : '/api/finance/pricing';
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Save failed'); setSaving(false); return; }
      setModalOpen(false);
      await load();
    } catch {
      setError('Network error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/finance/pricing/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteId(null);
      await load();
    }
    setDeleting(false);
  }

  const totalActive = services.filter(s => s.is_active).length;
  const avgPrice    = services.length
    ? services.reduce((s, x) => s + x.base_price_inr, 0) / services.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Pricing Strategy</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Master list of services and standard prices — shared with telecallers and used for invoice calculation.
          </p>
        </div>
        {isCFO && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Services',  value: String(services.length) },
          { label: 'Active Services', value: String(totalActive) },
          { label: 'Categories',      value: String(new Set(services.map(s => s.category)).size) },
          { label: 'Avg Base Price',  value: fmt(avgPrice) },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-slate-900/70 border border-slate-700/50 p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="text-lg font-bold text-slate-100 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 ml-auto text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="accent-emerald-500"
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-2">
          <svg className="h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No services found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Service Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Base Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">GST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Total (incl. GST)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                {isCFO && <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(s => {
                const gstAmt = (s.base_price_inr * s.gst_rate) / 100;
                const total  = s.base_price_inr + gstAmt;
                return (
                  <tr key={s.id} className={`hover:bg-slate-800/30 transition-colors ${!s.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{s.name}</div>
                      {s.description && <div className="text-xs text-slate-500 mt-0.5">{s.description}</div>}
                      {s.notes && <div className="text-xs text-slate-600 italic mt-0.5">{s.notes}</div>}
                    </td>
                    <td className="px-4 py-3">{categoryBadge(s.category)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">{fmt(s.base_price_inr)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{s.gst_rate}%</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">{fmt(total)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                        s.is_active ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isCFO && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded px-2.5 py-1 text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="rounded px-2.5 py-1 text-xs font-medium bg-rose-900/40 text-rose-300 hover:bg-rose-800/50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1526] border border-slate-700/60 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-100">
                {editing ? 'Edit Service' : 'Add Service'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300 transition">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-rose-400 bg-rose-900/20 border border-rose-700/30 rounded-lg px-3 py-2">{error}</p>}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Service Name *</label>
                <input
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. EPR Registration – Plastic"
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setField('category', e.target.value)}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Unit</label>
                  <select
                    value={form.unit}
                    onChange={e => setField('unit', e.target.value)}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Base Price (₹) *</label>
                  <input
                    type="number" min="0" step="100"
                    value={form.base_price_inr}
                    onChange={e => setField('base_price_inr', e.target.value)}
                    placeholder="15000"
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">GST Rate (%)</label>
                  <select
                    value={form.gst_rate}
                    onChange={e => setField('gst_rate', e.target.value)}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>

              {form.base_price_inr && (
                <div className="rounded-lg bg-emerald-900/20 border border-emerald-700/30 px-4 py-3 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Base</span>
                    <span>{fmt(Number(form.base_price_inr))}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 mt-1">
                    <span>GST ({form.gst_rate}%)</span>
                    <span>{fmt((Number(form.base_price_inr) * Number(form.gst_rate)) / 100)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-300 mt-2 pt-2 border-t border-emerald-700/30">
                    <span>Total</span>
                    <span>{fmt(Number(form.base_price_inr) * (1 + Number(form.gst_rate) / 100))}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <input
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Short description of the service"
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Internal Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="Notes visible to all staff"
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Sort Order</label>
                  <input
                    type="number" min="0"
                    value={form.sort_order}
                    onChange={e => setField('sort_order', e.target.value)}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-600/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setField('is_active', e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-5 py-2 text-sm font-medium text-white transition-colors"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0d1526] border border-slate-700/60 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Delete Service?</h3>
            <p className="text-sm text-slate-400">This will permanently remove the service from the pricing list.</p>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
