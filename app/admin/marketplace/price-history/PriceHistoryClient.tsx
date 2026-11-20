'use client';

import { useState } from 'react';

const WASTE_CATEGORIES = [
  'Plastic - Category I',
  'Plastic - Category II',
  'Plastic - Category III',
  'E-Waste - IT & Telecom',
  'E-Waste - Consumer Electronics',
  'Battery - Lead Acid',
  'Battery - Lithium Ion',
  'Tyre',
  'Glass',
  'Oil (Lubricant)',
];

const SOURCES = ['Exchange', 'OTC', 'Broker', 'CPCB Portal', 'Internal'];

export default function PriceHistoryClient({ initialHistory, currentUserId }: { initialHistory: any[]; currentUserId: string }) {
  const [history, setHistory] = useState<any[]>(initialHistory);
  const [form, setForm] = useState({
    waste_category: WASTE_CATEGORIES[0],
    rate_inr: '',
    recorded_date: new Date().toISOString().split('T')[0],
    source: 'Exchange',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rate_inr || isNaN(Number(form.rate_inr)) || Number(form.rate_inr) <= 0) {
      setError('Enter a valid rate > 0');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/price-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rate_inr: Number(form.rate_inr),
          recorded_by: currentUserId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setHistory((prev) => [json.entry, ...prev]);
      setForm((f) => ({ ...f, rate_inr: '', notes: '' }));
      setSuccess('Price recorded! Alert engine will notify matching subscribers.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">EPR Credit Price History</h1>
        <p className="mt-1 text-sm text-slate-500">Record daily market rates. Subscribers with matching price alerts will be notified automatically.</p>
      </div>

      {/* Entry form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-100">Record New Rate</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Waste Category</label>
            <select
              value={form.waste_category}
              onChange={(e) => setForm((f) => ({ ...f, waste_category: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              {WASTE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Rate (₹ / MT)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 1250.00"
              value={form.rate_inr}
              onChange={(e) => setForm((f) => ({ ...f, rate_inr: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Date</label>
            <input
              type="date"
              value={form.recorded_date}
              onChange={(e) => setForm((f) => ({ ...f, recorded_date: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">Notes (optional)</label>
            <input
              type="text"
              placeholder="Any market context…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}

        <div className="mt-4">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Saving…' : 'Record Price'}
          </button>
        </div>
      </form>

      {/* History table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-400">Category</th>
              <th className="px-4 py-3 font-semibold text-slate-400">Rate (₹/MT)</th>
              <th className="px-4 py-3 font-semibold text-slate-400">Date</th>
              <th className="px-4 py-3 font-semibold text-slate-400">Source</th>
              <th className="px-4 py-3 font-semibold text-slate-400">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">No records yet.</td>
              </tr>
            )}
            {history.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-950">
                <td className="px-4 py-3 text-slate-100 font-medium">{row.waste_category}</td>
                <td className="px-4 py-3 font-mono text-slate-100">₹{Number(row.rate_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(row.recorded_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3 text-slate-400">{row.source}</td>
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{row.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
