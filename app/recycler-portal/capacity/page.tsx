'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface CapacityLog {
  id: string;
  month: string;
  capacity_mt: number;
  utilized_mt: number;
  utilization_pct: number | null;
}

function utilColor(pct: number | null) {
  if (pct == null) return 'bg-gray-200';
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-blue-500';
  return 'bg-gray-400';
}

function utilTextColor(pct: number | null) {
  if (pct == null) return 'text-gray-400';
  if (pct >= 80) return 'text-green-700';
  if (pct >= 50) return 'text-blue-700';
  return 'text-gray-600';
}

function formatMonth(month: string) {
  const [year, mon] = month.split('-');
  const d = new Date(Number(year), Number(mon) - 1, 1);
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export default function CapacityPage() {
  const [logs, setLogs] = useState<CapacityLog[]>([]);
  const [currentCapacity, setCurrentCapacity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    capacity_mt: '',
    utilized_mt: '',
  });

  const load = () => {
    setLoading(true);
    fetch('/api/recycler-portal/capacity')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setLogs(d.logs ?? []);
          setCurrentCapacity(d.currentCapacity);
        }
      })
      .catch(() => setError('Failed to load capacity data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/recycler-portal/capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: form.month,
          capacity_mt: parseFloat(form.capacity_mt),
          utilized_mt: parseFloat(form.utilized_mt),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Failed to save.');
      else {
        trackEvent('Recycler Capacity Logged', { month: form.month });
        setSuccess('Capacity logged successfully.');
        setForm({ month: new Date().toISOString().slice(0, 7), capacity_mt: '', utilized_mt: '' });
        load();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build 12-month grid from latest to oldest
  const logMap = new Map(logs.map((l) => [l.month, l]));
  const months12: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months12.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Capacity Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">
          Log your monthly recycling capacity and track utilization over time.
          {currentCapacity != null && (
            <span className="ml-2 text-green-700 font-medium">
              Registered capacity: {currentCapacity} MT
            </span>
          )}
        </p>
      </div>

      {/* Log Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Log Capacity</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Capacity (MT)</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={form.capacity_mt}
              onChange={(e) => setForm((f) => ({ ...f, capacity_mt: e.target.value }))}
              placeholder="e.g. 500"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recycled / Utilized (MT)</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={form.utilized_mt}
              onChange={(e) => setForm((f) => ({ ...f, utilized_mt: e.target.value }))}
              placeholder="e.g. 380"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
      </div>

      {/* 12-Month Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">12-Month Overview</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {months12.map((month) => {
              const log = logMap.get(month);
              const computedPct = log
                ? log.utilization_pct ?? (log.capacity_mt > 0 ? Math.round((log.utilized_mt / log.capacity_mt) * 100) : 0)
                : null;

              return (
                <div key={month} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">{formatMonth(month)}</p>
                  {log ? (
                    <>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{log.utilized_mt} MT used</span>
                        <span className={`font-semibold ${utilTextColor(computedPct)}`}>
                          {computedPct != null ? computedPct + '%' : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${utilColor(computedPct)} h-2 rounded-full`}
                          style={{ width: `${Math.min(computedPct ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">of {log.capacity_mt} MT</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Not logged</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-400" /> &lt;50%</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500" /> 50–80%</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500" /> &gt;80%</span>
        </div>
      </div>
    </div>
  );
}
