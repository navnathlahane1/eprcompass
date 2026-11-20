'use client';

/**
 * /admin/epr-settings/financial-years
 * Admin: view, add, activate, lock/unlock financial years.
 */

import { useState, useEffect } from 'react';

interface FY {
  id: string;
  label: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
}

export default function FinancialYearsPage() {
  const [fys, setFys] = useState<FY[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true); setError(null);
    const res = await fetch('/api/epr/financial-years');
    if (!res.ok) { setError('Failed to load'); setLoading(false); return; }
    const d = await res.json();
    setFys(d.financialYears ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addFY = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    const res = await fetch('/api/epr/financial-years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    setAdding(false);
    if (res.ok) { showToast('success', 'Financial year added'); setNewLabel(''); load(); }
    else { const d = await res.json(); showToast('error', d.error || 'Failed to add'); }
  };

  const patch = async (id: string, payload: object, successMsg: string) => {
    const res = await fetch(`/api/epr/financial-years/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) { showToast('success', successMsg); load(); }
    else { const d = await res.json(); showToast('error', d.error || 'Action failed'); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-100">EPR Financial Years</h1>
      <p className="text-sm text-slate-500">Manage which financial years are active and accepting filings. Only one FY can be active at a time. Locking a FY prevents further status changes.</p>

      {/* Add FY */}
      <div className="flex gap-3">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="e.g. FY 2026-27"
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        <button onClick={addFY} disabled={adding} className="btn-primary">
          {adding ? 'Adding…' : '+ Add FY'}
        </button>
      </div>
      <p className="text-xs text-slate-500">Format: FY YYYY-YY (e.g. FY 2026-27)</p>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-slate-900 rounded animate-pulse" />)}</div>
      ) : error ? (
        <div className="bg-rose-950/30 text-rose-300 p-4 rounded">{error}</div>
      ) : (
        <div className="space-y-2">
          {fys.map(fy => (
            <div key={fy.id} className="border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-100">{fy.label}</span>
                {fy.is_active && <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-900/30 text-emerald-300 font-medium">Active</span>}
                {fy.is_locked && <span className="px-2 py-0.5 text-xs rounded-full bg-rose-900/30 text-rose-400 font-medium">Locked</span>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!fy.is_active && !fy.is_locked && (
                  <button onClick={() => patch(fy.id, { action: 'set_active' }, `${fy.label} set as active`)} className="text-xs px-3 py-1.5 border rounded hover:bg-slate-950">
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => patch(fy.id, { action: fy.is_locked ? 'unlock' : 'lock' }, `${fy.label} ${fy.is_locked ? 'unlocked' : 'locked'}`)}
                  className={`text-xs px-3 py-1.5 border rounded ${fy.is_locked ? 'hover:bg-emerald-950/30 text-emerald-300' : 'hover:bg-rose-950/30 text-rose-400'}`}
                >
                  {fy.is_locked ? 'Unlock' : 'Lock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
