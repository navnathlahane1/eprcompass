'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { trackEvent } from '@/lib/analytics';

function formatINR(value: number) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

export default function PriceAlertsClient({
  clientId,
  initialAlerts,
  historyRows
}: {
  clientId: string;
  initialAlerts: any[];
  historyRows: any[];
}) {
  const [alerts, setAlerts] = useState(initialAlerts || []);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    waste_category: 'Plastic',
    target_rate_inr: '',
    alert_type: 'Below',
    channel: 'Email'
  });

  const currentRates = useMemo(() => {
    const map = new Map<string, any>();
    for (const row of historyRows || []) {
      if (!map.has(row.waste_category)) map.set(row.waste_category, row);
    }
    return ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'].map((category) => {
      const row = map.get(category);
      return {
        category,
        rate: row ? Number(row.rate_inr || 0) : null,
        recorded_date: row?.recorded_date || null
      };
    });
  }, [historyRows]);

  async function addAlert(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        client_id: clientId,
        waste_category: form.waste_category,
        target_rate_inr: Number(form.target_rate_inr || 0),
        alert_type: form.alert_type,
        channel: form.channel,
        status: 'Active'
      };

      const { data, error } = await (supabase as any)
        .from('credit_price_alerts')
        .insert(payload)
        .select('id, waste_category, target_rate_inr, alert_type, channel, status, created_at, triggered_at')
        .single();

      if (error) throw error;
      trackEvent('Client Price Alert Created', { waste_category: form.waste_category, alert_type: form.alert_type });
      setAlerts((prev: any[]) => [data, ...prev]);
      setForm({ waste_category: 'Plastic', target_rate_inr: '', alert_type: 'Below', channel: 'Email' });
    } finally {
      setSaving(false);
    }
  }

  async function pauseAlert(id: string) {
    const { error } = await (supabase as any)
      .from('credit_price_alerts')
      .update({ status: 'Paused' })
      .eq('id', id);
    if (error) return;
    trackEvent('Client Price Alert Paused', {});
    setAlerts((prev: any[]) => prev.map((row) => (row.id === id ? { ...row, status: 'Paused' } : row)));
  }

  async function deleteAlert(id: string) {
    const { error } = await (supabase as any)
      .from('credit_price_alerts')
      .delete()
      .eq('id', id);
    if (error) return;
    trackEvent('Client Price Alert Deleted', {});
    setAlerts((prev: any[]) => prev.filter((row) => row.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Price Alerts</h1>
        <p className="mt-1 text-sm text-slate-600">Set alerts to track EPR marketplace rates by category.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Current Market Rates</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {currentRates.map((row) => (
            <article key={row.category} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-900">{row.category}</p>
              <p className="mt-1 text-slate-700">{row.rate != null ? `${formatINR(row.rate)} / MT` : 'No data'}</p>
              <p className="text-xs text-slate-500">{row.recorded_date || '-'}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Add Alert</h2>
        <form onSubmit={addAlert} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <select value={form.waste_category} onChange={(e) => setForm((p) => ({ ...p, waste_category: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="number" required value={form.target_rate_inr} onChange={(e) => setForm((p) => ({ ...p, target_rate_inr: e.target.value }))} placeholder="Target Rate (INR)" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={form.alert_type} onChange={(e) => setForm((p) => ({ ...p, alert_type: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="Below">Below</option>
            <option value="Above">Above</option>
          </select>
          <select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Both">Both</option>
          </select>
          <button disabled={saving} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 md:col-span-4">
            {saving ? 'Saving...' : 'Add Alert'}
          </button>
        </form>
      </section>

      <section className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Target Rate</th>
              <th className="px-4 py-3">Alert Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Triggered At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((row: any) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-700">{row.waste_category}</td>
                <td className="px-4 py-3 text-slate-700">{formatINR(Number(row.target_rate_inr || 0))}</td>
                <td className="px-4 py-3 text-slate-700">{row.alert_type}</td>
                <td className="px-4 py-3 text-slate-700">{row.status}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-slate-700">{row.triggered_at ? new Date(row.triggered_at).toLocaleString('en-IN') : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {row.status === 'Active' ? <button onClick={() => pauseAlert(row.id)} className="rounded border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700">Pause</button> : null}
                    <button onClick={() => deleteAlert(row.id)} className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
