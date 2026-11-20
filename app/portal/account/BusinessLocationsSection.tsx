'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { trackEvent } from '@/lib/analytics';

type LocationType = 'factory' | 'warehouse' | 'office';

interface BusinessLocation {
  id: string;
  location_type: LocationType;
  label: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
}

const LOCATION_TYPES: { value: LocationType; label: string; icon: string; color: string }[] = [
  { value: 'factory',   label: 'Factory',   icon: '🏭', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'warehouse', label: 'Warehouse', icon: '🏗️', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'office',    label: 'Office',    icon: '🏢', color: 'bg-green-50 border-green-200 text-green-700' },
];

const EMPTY_FORM = { location_type: 'factory' as LocationType, label: '', address_line: '', city: '', state: '', pincode: '' };

export default function BusinessLocationsSection({ clientId }: { clientId: string }) {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('client_business_locations')
      .select('id, location_type, label, address_line, city, state, pincode')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    setLocations(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [clientId]);

  async function handleSave() {
    if (!form.label.trim() || !form.address_line.trim() || !form.city.trim() || !form.state) {
      setError('Please fill in label, address, city, and state.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await (supabase as any)
      .from('client_business_locations')
      .insert({ client_id: clientId, ...form });
    setSaving(false);
    if (err) { setError('Could not save location. Please try again.'); return; }
    trackEvent('Client Business Location Added', { location_type: form.location_type });
    setShowForm(false);
    setForm({ ...EMPTY_FORM });
    load();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await (supabase as any).from('client_business_locations').delete().eq('id', id);
    trackEvent('Client Business Location Deleted', {});
    setDeletingId(null);
    setLocations(prev => prev.filter(l => l.id !== id));
  }

  const typeInfo = (t: LocationType) => LOCATION_TYPES.find(x => x.value === t)!;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Business Locations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Factory, warehouse, and office addresses used in EPR filings.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add Location
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800">New Location</p>

          {/* Type selector */}
          <div className="flex gap-2">
            {LOCATION_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(f => ({ ...f, location_type: t.value }))}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  form.location_type === t.value ? t.color + ' ring-2 ring-blue-400/40' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Location Label <span className="text-red-500">*</span></label>
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder={`e.g. Main ${typeInfo(form.location_type).label}, North Unit`}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Address <span className="text-red-500">*</span></label>
            <input
              value={form.address_line}
              onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))}
              placeholder="Plot No., Street, Area"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">City <span className="text-red-500">*</span></label>
              <input
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="City"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">State <span className="text-red-500">*</span></label>
              <select
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select…</option>
                {(INDIA_STATES_UTS as string[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">PIN Code</label>
              <input
                value={form.pincode}
                onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="400001"
                maxLength={6}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {saving ? 'Saving…' : 'Save Location'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); setError(''); }}
              className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm text-slate-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Locations list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : locations.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
          <p className="text-2xl mb-1">📍</p>
          <p className="text-sm font-medium text-slate-600">No locations added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add your factory, warehouse, or office addresses.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {locations.map(loc => {
            const t = typeInfo(loc.location_type);
            return (
              <div key={loc.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${t.color}`}>
                    {t.icon} {t.label}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{loc.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {loc.address_line}, {loc.city}, {loc.state}{loc.pincode ? ` – ${loc.pincode}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(loc.id)}
                  disabled={deletingId === loc.id}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                  title="Remove location"
                >
                  {deletingId === loc.id ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
