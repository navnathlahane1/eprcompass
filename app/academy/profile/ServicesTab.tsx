'use client';

import { useEffect, useState } from 'react';

interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  key_topics: string[];
  delivery_mode: string[];
  duration_hours: string;
  max_participants: string;
  language: string;
  pricing_model: string;
  price_amount: string;
  price_currency: string;
  price_notes: string;
  status: string;
  review_notes?: string;
}

const EMPTY_SVC: Omit<Service, 'id' | 'status'> = {
  title: '', category: '', description: '', key_topics: [],
  delivery_mode: [], duration_hours: '', max_participants: '',
  language: 'English', pricing_model: 'per_session',
  price_amount: '', price_currency: 'INR', price_notes: '',
};

const CATEGORIES = [
  'E-Waste', 'Plastic Waste', 'Battery Waste', 'Tyre Waste', 'Used Oil',
  'Corporate Sustainability', 'EPR Compliance', 'Environmental Audit',
  'Awareness Program', 'Other',
];
const DELIVERY_OPTS = ['Online Live', 'Classroom', 'Hybrid', 'Self-Paced'];
const PRICING_MODELS = [
  { value: 'per_session',     label: 'Per Session (flat fee)' },
  { value: 'per_participant', label: 'Per Participant' },
  { value: 'per_day',         label: 'Per Day' },
  { value: 'custom',          label: 'Custom / Negotiable' },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:            { label: 'Draft',            cls: 'bg-slate-700 text-slate-300' },
  pending_approval: { label: 'Pending Review',   cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  approved:         { label: 'Approved',         cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  rejected:         { label: 'Returned',         cls: 'bg-red-500/15 text-red-300 border border-red-500/30' },
};

function CheckGroup({ options, value, onChange }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${value.includes(o) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<string | null>(null); // service id or 'new'
  const [form, setForm]         = useState<Omit<Service, 'id' | 'status'>>(EMPTY_SVC);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  async function load() {
    setLoading(true);
    const res = await fetch('/api/academy/trainer-services');
    if (res.ok) { const { services: s } = await res.json(); setServices(s ?? []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm({ ...EMPTY_SVC }); setEditing('new'); }
  function openEdit(s: Service) {
    setForm({
      title: s.title, category: s.category, description: s.description ?? '',
      key_topics: s.key_topics ?? [], delivery_mode: s.delivery_mode ?? [],
      duration_hours: String(s.duration_hours ?? ''), max_participants: String(s.max_participants ?? ''),
      language: s.language ?? 'English', pricing_model: s.pricing_model,
      price_amount: String(s.price_amount ?? ''), price_currency: s.price_currency ?? 'INR',
      price_notes: s.price_notes ?? '',
    });
    setEditing(s.id);
  }

  async function save() {
    if (!form.title || !form.category || !form.delivery_mode.length || !form.pricing_model) {
      showToast('Fill in required fields'); return;
    }
    setSaving(true);
    const payload = {
      ...form,
      duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      price_amount: form.price_amount ? parseFloat(form.price_amount) : null,
    };
    let res: Response;
    if (editing === 'new') {
      res = await fetch('/api/academy/trainer-services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      res = await fetch('/api/academy/trainer-services', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing, ...payload }) });
    }
    setSaving(false);
    if (res.ok) { setEditing(null); load(); showToast('Service saved'); }
    else { const d = await res.json(); showToast(d.error ?? 'Save failed'); }
  }

  async function submit(id: string) {
    const res = await fetch('/api/academy/trainer-services', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'submit' }),
    });
    if (res.ok) { load(); showToast('Submitted for director review'); }
  }

  async function del(id: string) {
    if (!confirm('Delete this service?')) return;
    await fetch(`/api/academy/trainer-services?id=${id}`, { method: 'DELETE' });
    load();
  }

  if (editing) {
    return (
      <div className="space-y-5">
        {toast && <div className="rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white">{toast}</div>}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">{editing === 'new' ? 'New Service' : 'Edit Service'}</h2>
          <button onClick={() => setEditing(null)} className="text-sm text-slate-400 hover:text-slate-200">Cancel</button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Service Title <span className="text-red-400">*</span></label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. E-Waste Awareness Workshop"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Category <span className="text-red-400">*</span></label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none">
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              placeholder="What participants will learn and outcomes of the session…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Key Topics <span className="text-slate-500 text-xs">(comma-separated)</span></label>
            <input value={form.key_topics.join(', ')} onChange={e => setForm(f => ({ ...f, key_topics: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
              placeholder="EPR Rules 2022, Extended Producer Responsibility, Compliance Filing…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Delivery Mode <span className="text-red-400">*</span></label>
            <CheckGroup options={DELIVERY_OPTS} value={form.delivery_mode} onChange={v => setForm(f => ({ ...f, delivery_mode: v }))} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Duration (hours)</label>
              <input type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))}
                placeholder="3" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Max Participants</label>
              <input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))}
                placeholder="30" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Language</label>
              <input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                placeholder="English" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h3 className="font-medium text-white">Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Pricing Model <span className="text-red-400">*</span></label>
              <select value={form.pricing_model} onChange={e => setForm(f => ({ ...f, pricing_model: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none">
                {PRICING_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Rate (₹)</label>
              <input type="number" value={form.price_amount} onChange={e => setForm(f => ({ ...f, price_amount: e.target.value }))}
                placeholder="15000" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Pricing Notes</label>
            <input value={form.price_notes} onChange={e => setForm(f => ({ ...f, price_notes: e.target.value }))}
              placeholder="e.g. Group discounts available, includes materials, travel extra…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2 text-sm font-medium text-white transition-colors">
            {saving ? 'Saving…' : 'Save Service'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm text-white shadow-xl">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">My Services</h2>
          <p className="text-sm text-slate-400 mt-0.5">Add the training services you want to offer, then submit for director approval</p>
        </div>
        <button onClick={openNew} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors">
          + Add Service
        </button>
      </div>

      {loading && (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
      )}

      {!loading && services.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
          <p className="text-slate-500">No services yet. Add a service to get started.</p>
        </div>
      )}

      {services.map(s => {
        const meta = STATUS_META[s.status] ?? STATUS_META.draft;
        return (
          <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-white truncate">{s.title}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{s.category} · {(s.delivery_mode ?? []).join(', ')}{s.duration_hours ? ` · ${s.duration_hours}h` : ''}</p>
                {s.price_amount && (
                  <p className="text-sm text-emerald-400 mt-1">
                    ₹{Number(s.price_amount).toLocaleString('en-IN')} {PRICING_MODELS.find(m => m.value === s.pricing_model)?.label ?? s.pricing_model}
                  </p>
                )}
                {s.status === 'rejected' && s.review_notes && (
                  <p className="mt-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">Returned: {s.review_notes}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {(s.status === 'draft' || s.status === 'rejected') && (
                  <>
                    <button onClick={() => openEdit(s)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 transition-colors">Edit</button>
                    <button onClick={() => submit(s.id)} className="rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs text-white transition-colors">Submit</button>
                    <button onClick={() => del(s.id)} className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:border-red-700 transition-colors">Delete</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
