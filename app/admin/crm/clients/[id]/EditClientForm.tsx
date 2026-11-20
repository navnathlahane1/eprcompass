'use client';

import { useState } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';

const CATEGORIES = ['PIBO', 'Recycler', 'Importer', 'Brand Owner'] as const;
const STATUSES = ['Onboarding', 'Active', 'At Risk', 'Churned'] as const;
const WASTE_OPTIONS = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'] as const;
const STATES = INDIA_STATES_UTS;

interface Manager {
  id: string;
  full_name: string | null;
}

interface Props {
  clientId: string;
  initial: {
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
    gstin: string | null;
    state: string | null;
    category: string;
    status: string;
    waste_categories: string[];
    assigned_manager_id: string | null;
    notes: string | null;
    renewal_date: string | null;
    onboarded_date: string | null;
  };
  managers: Manager[];
}

export default function EditClientForm({ clientId, initial, managers }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...initial });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleWaste(cat: string) {
    setForm((prev) => ({
      ...prev,
      waste_categories: prev.waste_categories.includes(cat)
        ? prev.waste_categories.filter((w) => w !== cat)
        : [...prev.waste_categories, cat],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          company_name: form.company_name,
          phone: form.phone,
          gstin: form.gstin,
          state: form.state,
          category: form.category,
          status: form.status,
          waste_categories: form.waste_categories,
          assigned_manager_id: form.assigned_manager_id || null,
          notes: form.notes,
          renewal_date: form.renewal_date || null,
          onboarded_date: form.onboarded_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Update failed.');
      } else {
        setSuccess(true);
        // Refresh the page data by reloading after a short delay
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <h2 className="text-sm font-semibold text-slate-100">Edit Client Details</h2>
        <span className="text-xs text-slate-500">{open ? 'Collapse ▲' : 'Expand ▼'}</span>
      </button>

      {open && (
        <form onSubmit={handleSave} className="border-t border-slate-800/60 p-4 space-y-4">

          {/* Contact fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
              <input
                type="text"
                value={form.full_name || ''}
                onChange={(e) => set('full_name', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                value={form.company_name || ''}
                onChange={(e) => set('company_name', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.gstin || ''}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                maxLength={15}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
              <select
                value={form.state || ''}
                onChange={(e) => set('state', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select
                value={form.category || ''}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
              <select
                value={form.status || ''}
                onChange={(e) => set('status', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Manager</label>
              <select
                value={form.assigned_manager_id || ''}
                onChange={(e) => set('assigned_manager_id', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name || m.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Onboarded Date</label>
              <input
                type="date"
                value={form.onboarded_date || ''}
                onChange={(e) => set('onboarded_date', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Renewal Date</label>
              <input
                type="date"
                value={form.renewal_date || ''}
                onChange={(e) => set('renewal_date', e.target.value)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Waste Categories</label>
            <div className="flex flex-wrap gap-2">
              {WASTE_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWaste(w)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    form.waste_categories.includes(w)
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-700 text-slate-400 hover:bg-slate-950'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-rose-950/30 border border-rose-800/40 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 px-3 py-2 text-sm text-emerald-300">
              Saved successfully. Refreshing…
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary transition"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(''); setSuccess(false); }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
