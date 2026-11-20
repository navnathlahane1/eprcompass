'use client';

import { useEffect, useState } from 'react';

const fmtK = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L` : `₹${(v / 1000).toFixed(1)}K`;
const fmt  = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

interface APData {
  summary: {
    totalOutstanding: number; totalOverdue: number; totalPaid: number;
    pendingCount: number; overdueCount: number; cashReq30: number;
  };
  aging: { label: string; count: number; amount: number }[];
  records: { id: string; vendor_name: string; invoice_no: string; amount: number; due_date: string; status: string; days_overdue: number; category: string }[];
}

const AGING_COLORS = ['bg-emerald-500', 'bg-yellow-500', 'bg-orange-400', 'bg-rose-400', 'bg-red-600'];
const AGING_TEXT   = ['text-emerald-400', 'text-yellow-400', 'text-orange-400', 'text-rose-400', 'text-red-400'];

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  overdue:  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  draft:    'bg-slate-600/40 text-slate-400 border-slate-600/40',
};

export default function APPage() {
  const [data,     setData]     = useState<APData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({ vendor_name: '', invoice_no: '', amount_inr: '', due_date: '', category: '', gst_amount_inr: '' });
  const [saving,   setSaving]   = useState(false);

  function load() {
    setLoading(true);
    fetch('/api/finance/ap')
      .then(async r => { const j = await r.json(); if (!r.ok) { setApiError(j?.detail ?? j?.error); return; } setData(j); })
      .catch(e => setApiError(e?.message ?? 'Network error'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch('/api/finance/ap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount_inr: parseFloat(form.amount_inr) || 0, gst_amount_inr: parseFloat(form.gst_amount_inr) || 0 }),
      });
      if (r.ok) { setShowAdd(false); setForm({ vendor_name: '', invoice_no: '', amount_inr: '', due_date: '', category: '', gst_amount_inr: '' }); load(); }
      else { const j = await r.json(); alert(j.error || 'Failed'); }
    } finally { setSaving(false); }
  }

  const maxAging = data ? Math.max(...data.aging.map(b => b.amount), 1) : 1;

  if (loading) return <div className="space-y-4 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-800" />)}</div>;
  if (apiError) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center max-w-md">
        <p className="text-rose-400 font-semibold">{apiError}</p>
        <button onClick={() => { setApiError(null); load(); }} className="mt-3 text-xs text-rose-300 hover:underline">Retry</button>
      </div>
    </div>
  );

  const s = data!.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Accounts Payable</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vendor payables, aging and cash requirements</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Payable
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Outstanding', value: fmtK(s.totalOutstanding), sub: `${s.pendingCount} vendors`, color: 'text-slate-100',  border: 'border-slate-700' },
          { label: 'Total Overdue',     value: fmtK(s.totalOverdue),     sub: `${s.overdueCount} records`, color: 'text-rose-300',  border: 'border-rose-500/30' },
          { label: 'Due in 30 Days',    value: fmtK(s.cashReq30),        sub: 'Cash requirement',          color: 'text-amber-300', border: 'border-amber-500/30' },
          { label: 'Total Paid (All)',  value: fmtK(s.totalPaid),        sub: 'Historical payments',       color: 'text-emerald-300',border: 'border-emerald-500/30' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border ${k.border} bg-slate-900/60 p-4`}>
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Aging */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">AP Aging</h2>
        <div className="space-y-3">
          {data!.aging.map((b, i) => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${AGING_TEXT[i] ?? 'text-slate-400'}`}>{b.label}</span>
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{b.count}</span>
                </div>
                <span className={`text-xs font-semibold ${AGING_TEXT[i] ?? 'text-slate-400'}`}>{fmtK(b.amount)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${AGING_COLORS[i] ?? 'bg-slate-500'}`}
                  style={{ width: `${maxAging > 0 ? (b.amount / maxAging) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor ledger */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-200">Vendor Ledger</h2>
          <span className="text-xs text-slate-500">{data!.records.length} records</span>
        </div>

        {data!.records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">No payable records</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-emerald-400 hover:underline">Add your first payable</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {data!.records.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/20 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{r.vendor_name}</p>
                  <p className="text-[10px] text-slate-500">{r.invoice_no || 'No invoice no.'}{r.category ? ` · ${r.category}` : ''}</p>
                </div>
                {r.days_overdue > 0 && (
                  <span className="text-[10px] text-rose-400">{r.days_overdue}d overdue</span>
                )}
                <span className={`hidden sm:inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[r.status] ?? STATUS_BADGE.draft}`}>
                  {r.status}
                </span>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-semibold ${r.days_overdue > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{fmtK(r.amount)}</p>
                  {r.due_date && <p className="text-[10px] text-slate-600">due {new Date(r.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0c1022] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-100">Add Payable</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Vendor Name *</label>
                  <input required value={form.vendor_name} onChange={e => setForm(f => ({...f, vendor_name: e.target.value}))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Invoice No.</label>
                  <input value={form.invoice_no} onChange={e => setForm(f => ({...f, invoice_no: e.target.value}))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Amount (₹) *</label>
                  <input required type="number" value={form.amount_inr} onChange={e => setForm(f => ({...f, amount_inr: e.target.value}))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">GST Amount (₹)</label>
                  <input type="number" value={form.gst_amount_inr} onChange={e => setForm(f => ({...f, gst_amount_inr: e.target.value}))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" placeholder="e.g. Rent, Utility" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Payable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
