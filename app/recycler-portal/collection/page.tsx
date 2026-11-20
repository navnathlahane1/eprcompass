'use client';

import { useEffect, useState, useCallback } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { trackEvent } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Supplier {
  id: string;
  name: string;
  supplier_type: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  waste_categories: string[];
  avg_monthly_supply_mt: number | null;
  rating: number | null;
  is_active: boolean;
}

interface Pickup {
  id: string;
  pickup_code: string;
  supplier_name: string | null;
  waste_category: string | null;
  est_qty_mt: number | null;
  actual_qty_mt: number | null;
  pickup_address: string | null;
  scheduled_date: string | null;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  manifest_no: string | null;
}

const SUPPLIER_TYPES = ['Aggregator', 'Kabadiwala', 'Bulk Consumer', 'ULB / Municipality', 'Dealer', 'Other'];
const WASTE_CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Used Oil', 'Other'];

const PICKUP_STATUS_STYLE: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_TRANSIT: 'bg-amber-100 text-amber-800 border-amber-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-300',
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function initials(n: string) { return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

// ─── Suppliers Tab ──────────────────────────────────────────────────────────────
function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<any>({ name: '', supplier_type: '', contact_person: '', phone: '', city: '', state: '', waste_categories: [], avg_monthly_supply_mt: '', rating: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recycler-portal/suppliers').then(r => r.json())
      .then(d => setSuppliers(d.suppliers ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', supplier_type: '', contact_person: '', phone: '', city: '', state: '', waste_categories: [], avg_monthly_supply_mt: '', rating: '' });
    setErr(''); setOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name, supplier_type: s.supplier_type ?? '', contact_person: s.contact_person ?? '',
      phone: s.phone ?? '', city: s.city ?? '', state: s.state ?? '',
      waste_categories: s.waste_categories ?? [], avg_monthly_supply_mt: s.avg_monthly_supply_mt ?? '', rating: s.rating ?? '',
    });
    setErr(''); setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { setErr('Name is required'); return; }
    setSaving(true); setErr('');
    try {
      const url = editing ? `/api/recycler-portal/suppliers/${editing.id}` : '/api/recycler-portal/suppliers';
      const r = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed'); return; }
      trackEvent('Recycler Supplier Saved', { is_new: !editing });
      setOpen(false); load();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    await fetch(`/api/recycler-portal/suppliers/${id}`, { method: 'DELETE' });
    trackEvent('Recycler Supplier Removed', {});
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }

  function toggleCat(c: string) {
    setForm((f: any) => ({ ...f, waste_categories: f.waste_categories.includes(c) ? f.waste_categories.filter((x: string) => x !== c) : [...f.waste_categories, c] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">+ Add Supplier</button>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : suppliers.filter(s => s.is_active).length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-700">No suppliers yet</p>
          <p className="text-xs text-gray-400 mt-1">Add aggregators, kabadiwalas, bulk consumers, and ULBs you source waste from.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.filter(s => s.is_active).map(s => (
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-bold">{initials(s.name)}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.supplier_type || 'Supplier'}</p>
                </div>
                {s.rating && <span className="ml-auto text-xs font-semibold text-amber-600">★ {s.rating}</span>}
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                {s.contact_person && <p>{s.contact_person}</p>}
                {s.phone && <a href={`tel:${s.phone}`} className="block hover:text-teal-600">{s.phone}</a>}
                {(s.city || s.state) && <p>{[s.city, s.state].filter(Boolean).join(', ')}</p>}
                {s.avg_monthly_supply_mt != null && <p className="text-gray-500">~{s.avg_monthly_supply_mt} MT/month</p>}
              </div>
              {s.waste_categories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.waste_categories.map(c => <span key={c} className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{c}</span>)}
                </div>
              )}
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button onClick={() => openEdit(s)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => remove(s.id)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="my-4 w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label><input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Type</label><select value={form.supplier_type} onChange={e => setForm((f: any) => ({ ...f, supplier_type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select…</option>{SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Contact Person</label><input value={form.contact_person} onChange={e => setForm((f: any) => ({ ...f, contact_person: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">City</label><input value={form.city} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">State</label><select value={form.state} onChange={e => setForm((f: any) => ({ ...f, state: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select State / UT</option>{INDIA_STATES_UTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Avg Supply (MT/mo)</label><input type="number" step={0.1} value={form.avg_monthly_supply_mt} onChange={e => setForm((f: any) => ({ ...f, avg_monthly_supply_mt: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Rating (1-5)</label><input type="number" min={1} max={5} value={form.rating} onChange={e => setForm((f: any) => ({ ...f, rating: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Waste Categories</label>
                <div className="flex flex-wrap gap-2">
                  {WASTE_CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => toggleCat(c)} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${form.waste_categories.includes(c) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pickups Tab ─────────────────────────────────────────────────────────────────
function PickupsTab() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ supplier_id: '', waste_category: '', est_qty_mt: '', pickup_address: '', scheduled_date: '', vehicle_number: '', driver_name: '', driver_phone: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = filter !== 'ALL' ? `?status=${filter}` : '';
    Promise.all([
      fetch(`/api/recycler-portal/pickups${q}`).then(r => r.json()),
      fetch('/api/recycler-portal/suppliers').then(r => r.json()),
    ]).then(([p, s]) => { setPickups(p.pickups ?? []); setSuppliers((s.suppliers ?? []).filter((x: Supplier) => x.is_active)); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.scheduled_date) { setErr('Scheduled date is required'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/recycler-portal/pickups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed'); return; }
      trackEvent('Recycler Pickup Scheduled', {});
      setOpen(false); setForm({ supplier_id: '', waste_category: '', est_qty_mt: '', pickup_address: '', scheduled_date: '', vehicle_number: '', driver_name: '', driver_phone: '' }); load();
    } finally { setSaving(false); }
  }

  async function advance(p: Pickup, status: string) {
    await fetch(`/api/recycler-portal/pickups/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    trackEvent('Recycler Pickup Status Changed', { status });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s === 'ALL' ? 'All' : s.replace('_', ' ')}</button>
          ))}
        </div>
        <button onClick={() => { setOpen(true); setErr(''); }} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">+ Schedule Pickup</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : pickups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center"><p className="text-sm text-gray-500">No pickups found.</p></div>
      ) : (
        <div className="space-y-3">
          {pickups.map(p => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-gray-400">{p.pickup_code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PICKUP_STATUS_STYLE[p.status]}`}>{p.status.replace('_', ' ')}</span>
                    {p.waste_category && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{p.waste_category}</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{p.supplier_name || 'Direct pickup'} · {fmt(p.scheduled_date)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.est_qty_mt != null && `Est ${p.est_qty_mt} MT`}{p.actual_qty_mt != null && ` · Actual ${p.actual_qty_mt} MT`}
                    {p.vehicle_number && ` · ${p.vehicle_number}`}{p.manifest_no && ` · ${p.manifest_no}`}
                  </p>
                  {p.pickup_address && <p className="text-xs text-gray-400 mt-0.5">{p.pickup_address}</p>}
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  {p.status === 'SCHEDULED' && <button onClick={() => advance(p, 'IN_TRANSIT')} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">Start Transit</button>}
                  {p.status === 'IN_TRANSIT' && <button onClick={() => advance(p, 'COMPLETED')} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Complete</button>}
                  {(p.status === 'SCHEDULED' || p.status === 'IN_TRANSIT') && <button onClick={() => advance(p, 'CANCELLED')} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50">Cancel</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="my-4 w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Schedule Pickup</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Supplier</label><select value={form.supplier_id} onChange={e => setForm((f: any) => ({ ...f, supplier_id: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Direct / unlisted</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Waste Category</label><select value={form.waste_category} onChange={e => setForm((f: any) => ({ ...f, waste_category: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select…</option>{WASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Est Qty (MT)</label><input type="number" step={0.1} value={form.est_qty_mt} onChange={e => setForm((f: any) => ({ ...f, est_qty_mt: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Scheduled Date *</label><input type="date" value={form.scheduled_date} onChange={e => setForm((f: any) => ({ ...f, scheduled_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Number</label><input value={form.vehicle_number} onChange={e => setForm((f: any) => ({ ...f, vehicle_number: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Driver Name</label><input value={form.driver_name} onChange={e => setForm((f: any) => ({ ...f, driver_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Driver Phone</label><input value={form.driver_phone} onChange={e => setForm((f: any) => ({ ...f, driver_phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Pickup Address</label><input value={form.pickup_address} onChange={e => setForm((f: any) => ({ ...f, pickup_address: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Scheduling…' : 'Schedule'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CollectionPage() {
  const [tab, setTab] = useState<'suppliers' | 'pickups'>('suppliers');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collection Network</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your waste-supply sources and schedule pickups with manifest tracking.</p>
      </div>
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {([['suppliers', 'Suppliers'], ['pickups', 'Pickups & Logistics']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{l}</button>
        ))}
      </div>
      {tab === 'suppliers' ? <SuppliersTab /> : <PickupsTab />}
    </div>
  );
}
