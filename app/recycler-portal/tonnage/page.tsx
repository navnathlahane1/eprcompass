'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface CapacityLog {
  id: string;
  month: string;
  capacity_mt: number;
  utilized_mt: number;
  utilization_pct: number;
}

function utilizationColor(pct: number) {
  if (pct > 80) return 'text-green-700 font-semibold';
  if (pct >= 50) return 'text-blue-700 font-semibold';
  return 'text-gray-500';
}

function utilizationBadgeColor(pct: number) {
  if (pct > 80) return 'bg-green-100 text-green-800';
  if (pct >= 50) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-600';
}

export default function TonnagePage() {
  const [logs, setLogs] = useState<CapacityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const [month, setMonth] = useState('');
  const [capacityMt, setCapacityMt] = useState('');
  const [utilizedMt, setUtilizedMt] = useState('');

  function loadLogs() {
    setLoading(true);
    fetch('/api/recycler-portal/tonnage')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setLogs(d.logs);
      })
      .catch(() => setError('Failed to load tonnage logs'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    if (!month || !capacityMt || !utilizedMt) {
      setFormError('All fields are required.');
      return;
    }
    const cap = parseFloat(capacityMt);
    const util = parseFloat(utilizedMt);
    if (isNaN(cap) || isNaN(util) || cap < 0 || util < 0) {
      setFormError('Enter valid positive numbers.');
      return;
    }
    if (util > cap) {
      setFormError('Utilized MT cannot exceed Capacity MT.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/recycler-portal/tonnage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: month + '-01', capacity_mt: cap, utilized_mt: util }),
      });
      const data = await res.json();
      if (data.error) { setFormError(data.error); return; }
      trackEvent('Recycler Tonnage Logged', { month: month + '-01' });
      setSuccess('Tonnage record saved successfully.');
      setMonth(''); setCapacityMt(''); setUtilizedMt('');
      loadLogs();
    } catch {
      setFormError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tonnage Reporting</h1>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Monthly Tonnage</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (MT)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={capacityMt}
              onChange={e => setCapacityMt(e.target.value)}
              placeholder="e.g. 500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Utilized (MT)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={utilizedMt}
              onChange={e => setUtilizedMt(e.target.value)}
              placeholder="e.g. 380"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
        {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Last 12 Months</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg font-medium">No tonnage records yet</p>
            <p className="text-sm mt-1">Submit your first monthly report above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Month', 'Capacity (MT)', 'Utilized (MT)', 'Utilization %'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => {
                  const pct = log.utilization_pct ?? (log.capacity_mt > 0 ? (log.utilized_mt / log.capacity_mt) * 100 : 0);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-800 font-medium">
                        {new Date(log.month).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{log.capacity_mt?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-3 text-gray-700">{log.utilized_mt?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${utilizationBadgeColor(pct)}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
