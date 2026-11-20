'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface ReturnMeta {
  label: string;
  regulation: string;
  frequency: string;
  defaultDueMonth: string;
}

interface StatutoryReturn {
  id: string;
  return_type: string;
  fiscal_year: string;
  period_label: string;
  due_date: string | null;
  filed_date: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'OVERDUE';
  acknowledgment_no: string | null;
  document_url: string | null;
  notes: string | null;
  daysLeft: number | null;
  meta: ReturnMeta | null;
}

interface Summary { total: number; pending: number; submitted: number; overdue: number; }

const RETURN_TYPES = [
  { value: 'FORM_IV',        label: 'Form IV – Annual Report' },
  { value: 'FORM_4',         label: 'Form 4 – Annual Return' },
  { value: 'FORM_V',         label: 'Form V – Environmental Statement' },
  { value: 'HALF_YEARLY_EC', label: 'Half-Yearly EC Compliance Report' },
  { value: 'CTO_COMPLIANCE', label: 'CTO Compliance Report' },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING:      'bg-yellow-100 text-yellow-800 border-yellow-300',
  IN_PROGRESS:  'bg-blue-100 text-blue-800 border-blue-300',
  SUBMITTED:    'bg-teal-100 text-teal-800 border-teal-300',
  ACKNOWLEDGED: 'bg-green-100 text-green-800 border-green-300',
  OVERDUE:      'bg-red-100 text-red-800 border-red-300',
};

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'ACKNOWLEDGED'];

const TYPE_ICON: Record<string, string> = {
  FORM_IV:        '🧪',
  FORM_4:         '⚠️',
  FORM_V:         '🌿',
  HALF_YEARLY_EC: '📋',
  CTO_COMPLIANCE: '🏭',
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  return_type: 'FORM_IV',
  fiscal_year: '2025-26',
  period_label: '',
  due_date: '',
  notes: '',
};

export default function StatutoryReturnsPage() {
  const [returns, setReturns] = useState<StatutoryReturn[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<StatutoryReturn | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recycler-portal/statutory-returns')
      .then(r => r.json())
      .then(d => { setReturns(d.returns ?? []); setSummary(d.summary ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.period_label.trim()) { setErr('Period label is required'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/recycler-portal/statutory-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed to add'); return; }
      trackEvent('Recycler Statutory Return Created', { return_type: form.return_type });
      setAddOpen(false);
      setForm(EMPTY_FORM);
      load();
    } finally { setSaving(false); }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/recycler-portal/statutory-returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editItem.id, ...editForm }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed to update'); return; }
      trackEvent('Recycler Statutory Return Updated', { status: editForm.status });
      setEditItem(null);
      load();
    } finally { setSaving(false); }
  }

  const filtered = filterStatus === 'ALL' ? returns : returns.filter(r => r.status === filterStatus);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Statutory Returns</h1>
          <p className="text-sm text-slate-500 mt-1">Track environmental returns mandated under various Indian environmental laws.</p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setErr(''); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Return
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',    value: summary.total,     color: 'bg-slate-50  border-slate-200 text-slate-700' },
            { label: 'Pending',  value: summary.pending,   color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
            { label: 'Submitted',value: summary.submitted, color: 'bg-green-50  border-green-200 text-green-800' },
            { label: 'Overdue',  value: summary.overdue,   color: 'bg-red-50    border-red-200 text-red-800' },
          ].map(c => (
            <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs font-medium mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reference Table */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-blue-800 mb-3">Due Date Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-700">
            <thead>
              <tr className="border-b border-blue-200 text-blue-700">
                <th className="text-left py-1.5 pr-4 font-semibold">Return / Form</th>
                <th className="text-left py-1.5 pr-4 font-semibold">Rules / Regulation</th>
                <th className="text-left py-1.5 pr-4 font-semibold">Frequency</th>
                <th className="text-left py-1.5 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {[
                { icon: '🧪', form: 'Form IV – Annual Report',           reg: 'Bio-Medical Waste Management Rules, 2016',                                   freq: 'Annual',           due: 'On or before 30th June every year' },
                { icon: '⚠️', form: 'Form 4 – Annual Return',            reg: 'Hazardous & Other Wastes Rules, 2016',                                        freq: 'Annual',           due: 'On or before 30th June every year' },
                { icon: '🌿', form: 'Form V – Environmental Statement',  reg: 'Environment (Protection) Rules, 1986',                                         freq: 'Annual',           due: 'On or before 30th September every year' },
                { icon: '📋', form: 'Half-Yearly EC Compliance Report',  reg: 'Environment Clearance (EC) Conditions',                                        freq: 'Half-Yearly',      due: 'Twice a year: APR–SEP & OCT–MAR' },
                { icon: '🏭', form: 'CTO Compliance Report',             reg: 'Consent to Operate (CTO) Conditions',                                          freq: 'As per CTO Order', due: 'Quarterly / Half-Yearly / Annually' },
              ].map(row => (
                <tr key={row.form}>
                  <td className="py-1.5 pr-4 font-medium">{row.icon} {row.form}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{row.reg}</td>
                  <td className="py-1.5 pr-4">{row.freq}</td>
                  <td className="py-1.5 text-teal-700 font-medium">{row.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'SUBMITTED', 'ACKNOWLEDGED', 'OVERDUE'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterStatus === s
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="text-sm text-slate-500 py-10 text-center">Loading returns…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">No statutory returns added yet.</p>
          <p className="text-xs mt-1">Click "Add Return" to track your first submission.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl mt-0.5">{TYPE_ICON[r.return_type] ?? '📄'}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{r.meta?.label ?? r.return_type}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.meta?.regulation}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-600 font-medium">FY {r.fiscal_year}</span>
                      <span className="text-xs text-slate-500">{r.period_label}</span>
                      {r.meta?.frequency && (
                        <span className="text-xs text-slate-400">{r.meta.frequency}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => { setEditItem(r); setEditForm({ status: r.status, filed_date: r.filed_date ?? '', acknowledgment_no: r.acknowledgment_no ?? '', document_url: r.document_url ?? '', notes: r.notes ?? '' }); setErr(''); }}
                    className="text-xs text-teal-600 hover:underline font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Due Date</p>
                  <p className={`font-semibold ${r.daysLeft !== null && r.daysLeft < 0 ? 'text-red-600' : r.daysLeft !== null && r.daysLeft <= 30 ? 'text-orange-600' : 'text-slate-700'}`}>
                    {fmt(r.due_date)}
                    {r.daysLeft !== null && !['SUBMITTED', 'ACKNOWLEDGED'].includes(r.status) && (
                      <span className="ml-1 font-normal text-slate-400">
                        ({r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d left`})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Filed Date</p>
                  <p className="text-slate-700">{fmt(r.filed_date)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Acknowledgment No.</p>
                  <p className="text-slate-700">{r.acknowledgment_no || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Document</p>
                  {r.document_url
                    ? <a href={r.document_url} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">View</a>
                    : <span className="text-slate-400">—</span>
                  }
                </div>
              </div>
              {r.notes && <p className="mt-2 text-xs text-slate-500 italic">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-base font-semibold text-slate-800">Add Statutory Return</h2>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Return Type</label>
                <select value={form.return_type} onChange={e => setForm((f: any) => ({ ...f, return_type: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {RETURN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Fiscal Year</label>
                  <input value={form.fiscal_year} onChange={e => setForm((f: any) => ({ ...f, fiscal_year: e.target.value }))}
                    placeholder="2025-26"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm((f: any) => ({ ...f, due_date: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Period Label <span className="text-red-500">*</span></label>
                <input value={form.period_label} onChange={e => setForm((f: any) => ({ ...f, period_label: e.target.value }))}
                  placeholder="e.g. APR–SEP 2025 or FY 2025-26"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Optional notes…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              {err && <p className="text-xs text-red-600">{err}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setAddOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
                  {saving ? 'Adding…' : 'Add Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-base font-semibold text-slate-800">Update Return</h2>
              <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm font-medium text-slate-700">{editItem.meta?.label ?? editItem.return_type}</p>
              <p className="text-xs text-slate-500">{editItem.period_label} · FY {editItem.fiscal_year}</p>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                <select value={editForm.status} onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Filed Date</label>
                  <input type="date" value={editForm.filed_date} onChange={e => setEditForm((f: any) => ({ ...f, filed_date: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Acknowledgment No.</label>
                  <input value={editForm.acknowledgment_no} onChange={e => setEditForm((f: any) => ({ ...f, acknowledgment_no: e.target.value }))}
                    placeholder="ACK-XXXXX"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Document URL</label>
                <input value={editForm.document_url} onChange={e => setEditForm((f: any) => ({ ...f, document_url: e.target.value }))}
                  placeholder="https://…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Optional notes…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
              </div>
              {err && <p className="text-xs text-red-600">{err}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditItem(null)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
