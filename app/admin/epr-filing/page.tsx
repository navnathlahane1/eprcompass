'use client';

/**
 * /admin/epr-filing — EPR Filing Status Manager
 * Admin view: list all filings across clients, update status, view history.
 */

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];
const STATUSES = [
  'Pending',
  'Documents Submitted',
  'Under Review',
  'Query Raised',
  'Approved',
  'Certificate Issued',
  'Rejected',
];

interface Filing {
  id: string;
  client_id: string;
  category: string;
  current_status: string;
  sla_due_at: string | null;
  fy_id: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; company_name: string };
  epr_financial_years?: { label: string };
}

interface FY { id: string; label: string; is_active: boolean }

export default function EPRFilingManagerPage() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [fys, setFys] = useState<FY[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterFy, setFilterFy] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Update modal state
  const [selected, setSelected] = useState<Filing | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  // History modal
  const [historyFiling, setHistoryFiling] = useState<Filing | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadFys = async () => {
    const res = await fetch('/api/epr/financial-years');
    if (res.ok) { const d = await res.json(); setFys(d.financialYears ?? []); }
  };

  const loadFilings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterFy) params.set('fy_id', filterFy);
    if (filterCat) params.set('category', filterCat);
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch(`/api/epr/filing-statuses?${params.toString()}`);
    if (!res.ok) { setError('Failed to load filings'); setLoading(false); return; }
    const d = await res.json();
    setFilings(d.filings ?? []);
    setLoading(false);
  }, [filterFy, filterCat, filterStatus]);

  useEffect(() => { loadFys(); }, []);
  useEffect(() => { loadFilings(); }, [loadFilings]);

  const handleStatusUpdate = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    const res = await fetch('/api/epr/filing-statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selected.client_id,
        category: selected.category,
        fy_id: selected.fy_id,
        status: newStatus,
        comment,
      }),
    });
    setUpdating(false);
    if (res.ok) {
      showToast('success', `Status updated to "${newStatus}"`);
      setSelected(null);
      setComment('');
      setNewStatus('');
      loadFilings();
    } else {
      const d = await res.json();
      showToast('error', d.error || 'Update failed');
    }
  };

  const loadHistory = async (filing: Filing) => {
    setHistoryFiling(filing);
    setHistoryLoading(true);
    const res = await fetch(`/api/epr/filing-statuses/${filing.id}/history`);
    const d = res.ok ? await res.json() : { history: [] };
    setHistory(d.history ?? []);
    setHistoryLoading(false);
  };

  const slaClass = (sla: string | null) => {
    if (!sla) return '';
    const diff = new Date(sla).getTime() - Date.now();
    if (diff < 0) return 'text-rose-400 font-semibold';
    if (diff < 6 * 3600 * 1000) return 'text-orange-500 font-semibold';
    return 'text-slate-500';
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      'Pending': 'bg-slate-900 text-slate-200',
      'Documents Submitted': 'bg-blue-900/30 text-blue-300',
      'Under Review': 'bg-amber-900/30 text-amber-300',
      'Query Raised': 'bg-orange-900/30 text-orange-300',
      'Approved': 'bg-emerald-900/30 text-emerald-300',
      'Certificate Issued': 'bg-emerald-100 text-emerald-700',
      'Rejected': 'bg-rose-900/30 text-rose-300',
    };
    return map[s] || 'bg-slate-900 text-slate-400';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">EPR Filing Manager</h1>
        <a href="/admin/epr-settings/financial-years" className="text-sm text-blue-400 hover:underline">
          Manage Financial Years →
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterFy} onChange={e => setFilterFy(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Financial Years</option>
          {fys.map(fy => <option key={fy.id} value={fy.id}>{fy.label}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={loadFilings} className="px-4 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-900 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-950/30 text-rose-300 p-4 rounded">{error}</div>
      ) : filings.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium">No filings found</p>
          <p className="text-sm mt-1">Adjust filters or create a filing from the client portal</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">FY</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">SLA Due</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filings.map(f => (
                <tr key={f.id} className="hover:bg-slate-950">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{f.profiles?.company_name || '—'}</p>
                    <p className="text-xs text-slate-500">{f.profiles?.full_name}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{f.category}</td>
                  <td className="px-4 py-3 text-slate-400">{f.epr_financial_years?.label ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(f.current_status)}`}>
                      {f.current_status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${slaClass(f.sla_due_at)}`}>
                    {f.sla_due_at ? new Date(f.sla_due_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => { setSelected(f); setNewStatus(f.current_status); }}
                      className="text-blue-400 hover:underline text-xs"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => loadHistory(f)}
                      className="text-slate-500 hover:underline text-xs"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Status Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Update Filing Status</h2>
            <p className="text-sm text-slate-400">
              {selected.profiles?.company_name} · {selected.category} · {selected.epr_financial_years?.label}
            </p>
            <div>
              <label className="text-xs font-medium text-slate-400">New Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Comment (optional)</label>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Reason for status change..."
                className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm border rounded hover:bg-slate-950">
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="btn-primary"
              >
                {updating ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyFiling && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filing History</h2>
              <button onClick={() => setHistoryFiling(null)} className="text-slate-500 hover:text-slate-400">✕</button>
            </div>
            <p className="text-sm text-slate-400">
              {historyFiling.profiles?.company_name} · {historyFiling.category} · {historyFiling.epr_financial_years?.label}
            </p>
            {historyLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-900 rounded animate-pulse" />)}</div>
            ) : history.length === 0 ? (
              <p className="text-slate-500 text-sm">No history yet.</p>
            ) : (
              <ol className="relative border-l border-slate-800 space-y-4 pl-6">
                {history.map((h: any) => (
                  <li key={h.id} className="text-sm">
                    <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-blue-500" />
                    <p className="font-medium text-slate-100">{h.new_status}</p>
                    {h.previous_status && <p className="text-xs text-slate-500">from {h.previous_status}</p>}
                    {h.comment && <p className="text-xs text-slate-400 mt-0.5 italic">&ldquo;{h.comment}&rdquo;</p>}
                    <p className="text-xs text-slate-500 mt-0.5">
                      {h.changed_by_profile?.full_name} · {new Date(h.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
