'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const fmt  = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
const fmtK = (v: number) => v >= 1_00_00_000 ? `₹${(v / 1_00_00_000).toFixed(2)}Cr` : v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(2)}L` : `₹${(v / 1000).toFixed(1)}K`;

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  current:  'Current Account',
  savings:  'Savings Account',
  fd:       'Fixed Deposit',
  od:       'Overdraft',
  cc:       'Cash Credit',
};
const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  current:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  savings:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  fd:       'bg-violet-500/20 text-violet-300 border-violet-500/30',
  od:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cc:       'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

interface Account {
  id: string; name: string; bank_name: string; account_number_mask?: string;
  account_type: string; balance_inr: number; available_balance_inr: number;
  as_of_date?: string; notes?: string;
}
interface TreasuryData {
  summary: { totalBalance: number; totalAvailable: number; accountCount: number };
  accounts: Account[];
  byType: Record<string, { count: number; balance: number }>;
  forecast: any[];
}

// Add Bank Modal
function AddBankModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ name: '', bank_name: '', account_number_mask: '', ifsc_code: '', account_type: 'current', balance_inr: '', as_of_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch('/api/finance/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, balance_inr: parseFloat(form.balance_inr) || 0, available_balance_inr: parseFloat(form.balance_inr) || 0 }),
      });
      const json = await r.json();
      if (r.ok) onSave(json.account);
      else alert(json.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0c1022] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-100">Add Bank Account</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" placeholder="e.g. Operations A/C" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bank Name *</label>
              <input required value={form.bank_name} onChange={e => setForm(f => ({...f, bank_name: e.target.value}))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" placeholder="HDFC Bank" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Type</label>
              <select value={form.account_type} onChange={e => setForm(f => ({...f, account_type: e.target.value}))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60">
                <option value="current">Current</option>
                <option value="savings">Savings</option>
                <option value="fd">Fixed Deposit</option>
                <option value="od">Overdraft</option>
                <option value="cc">Cash Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">A/C Last 4 digits</label>
              <input value={form.account_number_mask} onChange={e => setForm(f => ({...f, account_number_mask: e.target.value}))}
                maxLength={4} className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" placeholder="1234" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Balance (₹) *</label>
              <input required type="number" value={form.balance_inr} onChange={e => setForm(f => ({...f, balance_inr: e.target.value}))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">As of Date</label>
              <input type="date" value={form.as_of_date} onChange={e => setForm(f => ({...f, as_of_date: e.target.value}))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500/60" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TreasuryPage() {
  const [data,      setData]      = useState<TreasuryData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [apiError,  setApiError]  = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    fetch('/api/finance/treasury')
      .then(async r => {
        const json = await r.json();
        if (!r.ok) { setApiError(json?.detail ?? json?.error ?? `Error ${r.status}`); return; }
        setData(json);
      })
      .catch(err => setApiError(err?.message ?? 'Network error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-800" />
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-800" />)}</div>
      <div className="h-64 rounded-xl bg-slate-800" />
    </div>
  );

  if (apiError) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 max-w-md text-center">
        <p className="text-rose-400 font-semibold mb-1">Failed to load treasury data</p>
        <p className="text-xs text-slate-400">{apiError}</p>
        <button onClick={() => { setApiError(null); load(); }} className="mt-4 rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/30 transition">Retry</button>
      </div>
    </div>
  );

  const s = data!.summary;
  const noAccounts = data!.accounts.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Treasury</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cash position, bank accounts and investments</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Account
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Cash Position', value: fmtK(s.totalBalance), sub: `Across ${s.accountCount} accounts`, color: 'text-emerald-300', border: 'border-emerald-500/30' },
          { label: 'Available Balance',   value: fmtK(s.totalAvailable), sub: 'Liquid & withdrawable', color: 'text-blue-300', border: 'border-blue-500/30' },
          { label: 'Bank Accounts',       value: s.accountCount, sub: 'Active accounts', color: 'text-slate-100', border: 'border-slate-700' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border ${k.border} bg-slate-900/60 p-4`}>
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/finance/treasury/banks',       label: 'Bank Accounts',  desc: 'Manage all accounts',    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
          { href: '/finance/treasury/forecast',    label: 'Cash Forecast',  desc: '12-month projection',    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v16H4V4z' },
          { href: '/finance/treasury/investments', label: 'Investments',    desc: 'FDs, MFs & securities',  icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center hover:border-emerald-500/30 hover:bg-emerald-500/5 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d={l.icon} /></svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">{l.label}</p>
              <p className="text-[10px] text-slate-500">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bank accounts list */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-200">Bank Accounts</h2>
          <span className="text-xs text-slate-500">{data!.accounts.length} accounts</span>
        </div>

        {noAccounts ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 mb-3">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No bank accounts added</p>
            <p className="text-xs text-slate-600 mt-1">Add your bank accounts to track your cash position</p>
            <button onClick={() => setShowModal(true)} className="mt-4 rounded-lg bg-emerald-600/80 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600 transition">
              Add First Account
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {data!.accounts.map(acc => {
              const typeLabel = ACCOUNT_TYPE_LABELS[acc.account_type] ?? acc.account_type;
              const typeColor = ACCOUNT_TYPE_COLORS[acc.account_type] ?? 'bg-slate-700/40 text-slate-400 border-slate-600';
              return (
                <div key={acc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400">
                    {acc.bank_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-100 truncate">{acc.name}</p>
                      <span className={`hidden sm:inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${typeColor}`}>{typeLabel}</span>
                    </div>
                    <p className="text-xs text-slate-500">{acc.bank_name}{acc.account_number_mask ? ` ••••${acc.account_number_mask}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-300">{fmtK(acc.balance_inr)}</p>
                    {acc.as_of_date && <p className="text-[10px] text-slate-600">as of {new Date(acc.as_of_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AddBankModal onClose={() => setShowModal(false)} onSave={(acc) => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
