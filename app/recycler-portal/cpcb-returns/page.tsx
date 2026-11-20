'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface CpcbReturn {
  id: string;
  return_label: string;
  period_type: 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  fiscal_year: string | null;
  waste_category: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  filed_date: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'FILED' | 'ACKNOWLEDGED' | 'LATE';
  daysToDue: number | null;
  processed_qty_mt: number | null;
  credits_claimed_mt: number | null;
  acknowledgment_no: string | null;
  acknowledgment_url: string | null;
  filing_notes: string | null;
}

interface Summary { total: number; pending: number; filed: number; late: number; }

const WASTE_CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Used Oil', 'All'];

const STATUS_STYLE: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600 border-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  FILED: 'bg-teal-100 text-teal-800 border-teal-300',
  ACKNOWLEDGED: 'bg-green-100 text-green-800 border-green-300',
  LATE: 'bg-red-100 text-red-800 border-red-300',
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function label(s: string) { return s.replace(/_/g, ' '); }

const EMPTY = { return_label: '', period_type: 'QUARTERLY', fiscal_year: '', waste_category: '', period_start: '', period_end: '', due_date: '', processed_qty_mt: '', credits_claimed_mt: '', filing_notes: '' };

export default function CpcbReturnsPage() {
  const [returns, setReturns] = useState<CpcbReturn[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [loadError, setLoadError] = useState('');
  const [prepping, setPrepping] = useState(false);
  const [prepResult, setPrepResult] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetch('/api/recycler-portal/cpcb-returns').then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Unable to load returns');
      return data;
    })
      .then(d => { setReturns(d.returns ?? []); setSummary(d.summary ?? null); })
      .catch(error => { setLoadError(error.message || 'Unable to load returns'); setSummary(null); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function runPrep() {
    if (!form.period_start || !form.period_end) { setErr('Set period start & end to auto-prep'); return; }
    setPrepping(true); setErr(''); setPrepResult(null);
    try {
      const r = await fetch(`/api/recycler-portal/cpcb-returns/prep?from=${form.period_start}&to=${form.period_end}`);
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Prep failed'); return; }
      setPrepResult(d);
      setForm((f: any) => ({ ...f, processed_qty_mt: d.processed_qty_mt, credits_claimed_mt: d.credits_issued_mt }));
    } catch { setErr('Preparation failed. Please retry.'); } finally { setPrepping(false); }
  }

  async function save() {
    if (!form.return_label.trim()) { setErr('Enter a return label (e.g. Q1 FY2025-26)'); return; }
    if (!form.period_start || !form.period_end || form.period_start > form.period_end) { setErr('Enter valid period start and end dates.'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/recycler-portal/cpcb-returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed'); return; }
      trackEvent('Recycler CPCB Return Created', { period_type: form.period_type });
      setOpen(false); setForm(EMPTY); setPrepResult(null); load();
    } catch { setErr('Return was not saved. Please retry.'); } finally { setSaving(false); }
  }

  async function patch(id: string, body: Record<string, any>) {
    try {
      const response = await fetch(`/api/recycler-portal/cpcb-returns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Return update failed');
      load();
    } catch { setLoadError('Return update failed. Please retry.'); }
  }
  async function fileReturn(r: CpcbReturn) {
    const ack = prompt('Enter CPCB acknowledgment number (optional):');
    if (ack === null) return;
    trackEvent('Recycler CPCB Return Filed', { return_id: r.id });
    await patch(r.id, { status: 'FILED', acknowledgment_no: ack || null });
  }
  async function remove(id: string) {
    await fetch(`/api/recycler-portal/cpcb-returns/${id}`, { method: 'DELETE' });
    trackEvent('Recycler CPCB Return Deleted', {});
    setReturns(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}<button type="button" onClick={load} className="font-semibold underline">Retry</button></div>}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CPCB Return Filing</h1>
          <p className="text-sm text-gray-500 mt-1">Track your periodic EPR returns, auto-prep filing data from tonnage, and store acknowledgments.</p>
        </div>
        <button onClick={() => { setOpen(true); setErr(''); setPrepResult(null); }} className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">+ New Return</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Total</p><p className="text-3xl font-bold text-gray-900 mt-1">{summary.total}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p><p className="text-3xl font-bold text-blue-600 mt-1">{summary.pending}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Filed</p><p className="text-3xl font-bold text-green-600 mt-1">{summary.filed}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Late</p><p className="text-3xl font-bold text-red-600 mt-1">{summary.late}</p></div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : loadError ? null : returns.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-gray-700">No return periods tracked yet</p>
          <p className="text-xs text-gray-400 mt-1">Create a return period and let the assistant pre-fill processed tonnage and credits.</p>
          <button onClick={() => setOpen(true)} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Create First Return</button>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{r.return_label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[r.status]}`}>{label(r.status)}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{label(r.period_type)}</span>
                    {r.waste_category && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{r.waste_category}</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    Due {fmt(r.due_date)}
                    {r.daysToDue != null && !['FILED', 'ACKNOWLEDGED'].includes(r.status) && (
                      <span className={r.daysToDue < 0 ? 'text-red-600 font-medium' : r.daysToDue <= 15 ? 'text-amber-600 font-medium' : ''}>
                        {' '}({r.daysToDue >= 0 ? `${r.daysToDue}d left` : `${Math.abs(r.daysToDue)}d overdue`})
                      </span>
                    )}
                    {r.processed_qty_mt != null && ` · Processed ${r.processed_qty_mt} MT`}
                    {r.credits_claimed_mt != null && ` · Credits ${r.credits_claimed_mt} MT`}
                    {r.filed_date && ` · Filed ${fmt(r.filed_date)}`}
                    {r.acknowledgment_no && ` · Ack: ${r.acknowledgment_no}`}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  {r.status === 'NOT_STARTED' && <button onClick={() => patch(r.id, { status: 'IN_PROGRESS' })} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Start</button>}
                  {['NOT_STARTED', 'IN_PROGRESS', 'LATE'].includes(r.status) && <button onClick={() => fileReturn(r)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">Mark Filed</button>}
                  {r.status === 'FILED' && <button onClick={() => patch(r.id, { status: 'ACKNOWLEDGED' })} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Acknowledged</button>}
                  <button onClick={() => remove(r.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
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
              <h2 className="text-base font-bold text-gray-900">New CPCB Return</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Return Label *</label><input value={form.return_label} onChange={e => setForm((f: any) => ({ ...f, return_label: e.target.value }))} placeholder="Q1 FY2025-26" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Period Type</label><select value={form.period_type} onChange={e => setForm((f: any) => ({ ...f, period_type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="QUARTERLY">Quarterly</option><option value="HALF_YEARLY">Half-Yearly</option><option value="ANNUAL">Annual</option></select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fiscal Year</label><input value={form.fiscal_year} onChange={e => setForm((f: any) => ({ ...f, fiscal_year: e.target.value }))} placeholder="FY2025-26" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Waste Category</label><select value={form.waste_category} onChange={e => setForm((f: any) => ({ ...f, waste_category: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select…</option>{WASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Period Start</label><input type="date" value={form.period_start} onChange={e => setForm((f: any) => ({ ...f, period_start: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Period End</label><input type="date" value={form.period_end} onChange={e => setForm((f: any) => ({ ...f, period_end: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => setForm((f: any) => ({ ...f, due_date: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            </div>

            {/* Filing assistant */}
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-teal-800">Filing Assistant</p>
                <button onClick={runPrep} disabled={prepping} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{prepping ? 'Calculating…' : 'Auto-Prep from Tonnage'}</button>
              </div>
              <p className="text-xs text-teal-700">Pulls processed tonnage and issued credits for the selected period to pre-fill the figures below.</p>
              {prepResult && (
                <div className="text-xs text-teal-800 bg-white rounded-lg p-2 border border-teal-200">
                  Found <strong>{prepResult.processed_qty_mt} MT</strong> processed across {prepResult.months_logged} month(s) · <strong>{prepResult.credits_issued_mt} MT</strong> credits issued.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-teal-700 mb-1">Processed Qty (MT)</label><input type="number" step={0.001} value={form.processed_qty_mt} onChange={e => setForm((f: any) => ({ ...f, processed_qty_mt: e.target.value }))} className="w-full rounded-lg border border-teal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
                <div><label className="block text-xs font-semibold text-teal-700 mb-1">Credits Claimed (MT)</label><input type="number" step={0.001} value={form.credits_claimed_mt} onChange={e => setForm((f: any) => ({ ...f, credits_claimed_mt: e.target.value }))} className="w-full rounded-lg border border-teal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
              </div>
            </div>

            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving…' : 'Create Return'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
