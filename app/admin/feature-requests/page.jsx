'use client';

import { useEffect, useState } from 'react';

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800 border-amber-300',
  TRIAGED: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  DONE: 'bg-green-100 text-green-800 border-green-300',
  DECLINED: 'bg-gray-100 text-gray-500 border-gray-300',
};
const STATUSES = ['NEW', 'TRIAGED', 'IN_PROGRESS', 'DONE', 'DECLINED'];

export default function FeatureRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    fetch('/api/feature-requests')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setRequests(d.requests ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/feature-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feature Requests &amp; Bug Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Submitted via right-click from any portal.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No submissions yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-900">{r.user_name || 'Unknown user'}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{r.portal}</span>
                    {r.user_role && <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{r.user_role}</span>}
                  </div>
                  <p className="text-sm text-slate-700">{r.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{r.page_path} · {new Date(r.created_at).toLocaleString('en-IN')}</p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value)}
                  className={`text-xs font-medium rounded-full px-3 py-1.5 border ${STATUS_STYLE[r.status] || ''}`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
