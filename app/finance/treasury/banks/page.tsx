'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const fmtK = (v: number) => v >= 1_00_00_000 ? `₹${(v / 1_00_00_000).toFixed(2)}Cr` : v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(2)}L` : `₹${(v / 1000).toFixed(1)}K`;

const TYPE_LABELS: Record<string, string> = { current: 'Current', savings: 'Savings', fd: 'Fixed Deposit', od: 'Overdraft', cc: 'Cash Credit' };
const TYPE_COLORS: Record<string, string> = {
  current:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  savings:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  fd:       'bg-violet-500/20 text-violet-300 border-violet-500/30',
  od:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cc:       'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function BanksPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({ name: '', bank_name: '', account_number_mask: '', ifsc_code: '', account_type: 'current', balance_inr: '', as_of_date: new Date().toISOString().split('T')[0] });
  const [saving,   setSaving]   = useState(false);

  function load() {
    setLoading(true);
    fetch('/api/finance/treasury')
      .then(r => r.json())
      .then(d => { setAccounts(d.accounts ?? []); setTotal(d.summary?.totalBalance ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch('/api/finance/treasury', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, balance_inr: parseFloat(form.balance_inr) || 0, available_balance_inr: parseFloat(form.balance_inr) || 0 }),
      });
      if (r.ok) { setShowAdd(false); load(); } else { const j = await r.json(); alert(j.error || 'Failed'); }
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/finance/treasury" className="hover:text-slate-300 transition">Treasury</Link>
            <span>/</span><span className="text-slate-400">Bank Accounts</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Bank Accounts</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Account
        </button>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Total Cash Position</p>
          <p className="text-2xl font-bold text-emerald-300">{fmtK(total)}</p>
        </div>
        <p className="text-sm text-slate-500">{accounts.length} active accounts</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />)}</div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-500">No bank accounts yet</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-emerald-400 hover:underline">Add first account</button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400">
                {acc.bank_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-100 truncate">{acc.name}</p>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[acc.account_type] ?? 'bg-slate-700/40 text-slate-400 border-slate-600'}`}>
                    {TYPE_LABELS[acc.account_type] ?? acc.account_type}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{acc.bank_name}{acc.ifsc_code ? ` · IFSC: ${acc.ifsc_code}` : ''}{acc.account_number_mask ? ` ··${acc.account_number_mask}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-300">{fmtK(acc.balance_inr)}</p>
                {acc.as_of_date && <p className="text-[10px] text-slate-600">as of {new Date(acc.as_of_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0c1022] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-100">Add Bank Account</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 mb-1 block">Account Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">Bank Name *</label>
                  <input required value={form.bank_name} onChange={e => setForm(f => ({...f, bank_name: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 mb-1 block">Type</label>
                  <select value={form.account_type} onChange={e => setForm(f => ({...f, account_type: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60">
                    <option value="current">Current</option><option value="savings">Savings</option>
                    <option value="fd">Fixed Deposit</option><option value="od">Overdraft</option><option value="cc">Cash Credit</option>
                  </select></div>
                <div><label className="text-xs text-slate-400 mb-1 block">IFSC Code</label>
                  <input value={form.ifsc_code} onChange={e => setForm(f => ({...f, ifsc_code: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 mb-1 block">Balance (₹) *</label>
                  <input required type="number" value={form.balance_inr} onChange={e => setForm(f => ({...f, balance_inr: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" /></div>
                <div><label className="text-xs text-slate-400 mb-1 block">As of Date</label>
                  <input type="date" value={form.as_of_date} onChange={e => setForm(f => ({...f, as_of_date: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-xs text-slate-400 hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
