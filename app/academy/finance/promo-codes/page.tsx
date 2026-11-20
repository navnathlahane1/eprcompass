'use client';

import { useState } from 'react';
import Link from 'next/link';

type PromoType = 'Flat' | 'Percentage' | 'Upgrade';
type PromoStatus = 'Active' | 'Expired' | 'Paused';

interface PromoCode {
  id: string;
  code: string;
  type: PromoType;
  discount: number; // amount or %
  program: string;
  usedCount: number;
  maxUses: number;
  expiry: string;
  status: PromoStatus;
  partnerSpecific: boolean;
  partner?: string;
  totalDiscountGiven: number;
}

const PROMOS: PromoCode[] = [];

const STATUS_STYLE: Record<PromoStatus, string> = {
  Active: 'bg-emerald-500/15 text-emerald-300',
  Expired: 'bg-slate-700 text-slate-500',
  Paused: 'bg-amber-500/15 text-amber-400',
};

const TYPE_STYLE: Record<PromoType, string> = {
  Flat: 'bg-indigo-500/10 text-indigo-300',
  Percentage: 'bg-violet-500/10 text-violet-300',
  Upgrade: 'bg-teal-500/10 text-teal-300',
};

export default function PromoCodeManager() {
  const [promos, setPromos] = useState<PromoCode[]>(PROMOS);
  const [showForm, setShowForm] = useState(false);
  const [statusF, setStatusF] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // New promo form state
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<PromoType>('Flat');
  const [newDiscount, setNewDiscount] = useState('');
  const [newProgram, setNewProgram] = useState('All Programs');
  const [newExpiry, setNewExpiry] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newPartnerToggle, setNewPartnerToggle] = useState(false);
  const [newPartner, setNewPartner] = useState('');

  function createPromo() {
    if (!newCode || !newDiscount || !newExpiry) return;
    const p: PromoCode = {
      id: String(promos.length + 1),
      code: newCode.toUpperCase(),
      type: newType,
      discount: Number(newDiscount),
      program: newProgram,
      usedCount: 0,
      maxUses: Number(newMaxUses) || 100,
      expiry: newExpiry,
      status: 'Active',
      partnerSpecific: newPartnerToggle,
      partner: newPartnerToggle ? newPartner : undefined,
      totalDiscountGiven: 0,
    };
    setPromos(prev => [p, ...prev]);
    setShowForm(false);
    setNewCode(''); setNewDiscount(''); setNewExpiry(''); setNewMaxUses(''); setNewPartner(''); setNewPartnerToggle(false);
  }

  function toggleStatus(id: string) {
    setPromos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next: PromoStatus = p.status === 'Active' ? 'Paused' : p.status === 'Paused' ? 'Active' : p.status;
      return { ...p, status: next };
    }));
  }

  const visible = promos.filter(p => statusF === 'All' || p.status === statusF);

  const inputCls = 'bg-slate-800/60 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 w-full';

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promo Code Manager</h1>
          <p className="text-sm text-slate-400 mt-0.5">Discounts & referral codes · EPR Compass</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(p => !p)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">
            {showForm ? '✕ Cancel' : '+ Create Promo Code'}
          </button>
          <Link href="/academy/finance" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">← Finance</Link>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-[#0c1022] border border-indigo-500/40 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-5">Create New Promo Code</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] text-slate-500 uppercase mb-1 block">Code</label>
              <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. SUMMER2026" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase mb-1 block">Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value as PromoType)} className={inputCls}>
                <option value="Flat">Flat (₹)</option>
                <option value="Percentage">Percentage (%)</option>
                <option value="Upgrade">Upgrade</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase mb-1 block">Discount {newType === 'Percentage' ? '(%)' : '(₹)'}</label>
              <input value={newDiscount} onChange={e => setNewDiscount(e.target.value)} placeholder={newType === 'Percentage' ? '10' : '500'} type="number" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase mb-1 block">Applicable Program</label>
              <select value={newProgram} onChange={e => setNewProgram(e.target.value)} className={inputCls}>
                {['All Programs', 'EPR Bootcamp – Tier 1', 'CEPC – Tier 2', 'EALP – Tier 3', 'Tier 2 → Tier 3 Upgrade'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase mb-1 block">Expiry Date</label>
              <input value={newExpiry} onChange={e => setNewExpiry(e.target.value)} type="date" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase mb-1 block">Max Uses</label>
              <input value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder="100" type="number" className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setNewPartnerToggle(p => !p)}
                className={`w-10 h-5 rounded-full transition relative ${newPartnerToggle ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${newPartnerToggle ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-slate-400">Partner-specific</span>
            </label>
            {newPartnerToggle && (
              <input value={newPartner} onChange={e => setNewPartner(e.target.value)} placeholder="Partner name..."
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 w-56" />
            )}
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={createPromo} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">Create Code</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-sm font-medium rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {(['All', 'Active', 'Paused', 'Expired'] as const).map(f => (
            <button key={f} onClick={() => setStatusF(f)}
              className={`px-3 py-1.5 text-[11px] font-medium transition ${statusF === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{visible.length} codes</span>
      </div>

      {/* Table */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Code', 'Type', 'Discount', 'Program', 'Usage', 'Total Given', 'Expiry', 'Partner', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-[11px] text-slate-500 uppercase py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {visible.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              ) : visible.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-indigo-300 text-xs">{p.code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${TYPE_STYLE[p.type]}`}>{p.type}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-medium">
                    {p.type === 'Percentage' ? `${p.discount}%` : `₹${p.discount.toLocaleString('en-IN')}`}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{p.program}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 w-16">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min((p.usedCount / p.maxUses) * 100, 100)}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-400">{p.usedCount}/{p.maxUses}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 text-xs font-medium">
                    ₹{p.totalDiscountGiven.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">{p.expiry}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {p.partnerSpecific ? (
                      <span className="text-violet-300 text-[11px]">{p.partner}</span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1.5">
                      {p.status !== 'Expired' && (
                        <button onClick={() => toggleStatus(p.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition whitespace-nowrap ${p.status === 'Active' ? 'bg-amber-600/20 text-amber-400 border-amber-700 hover:bg-amber-600/30' : 'bg-emerald-600/20 text-emerald-400 border-emerald-700 hover:bg-emerald-600/30'}`}>
                          {p.status === 'Active' ? 'Pause' : 'Activate'}
                        </button>
                      )}
                      <button onClick={() => copyCode(p.id, p.code)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition whitespace-nowrap ${copiedId === p.id ? 'bg-emerald-600/20 text-emerald-400 border-emerald-700' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'}`}>
                        {copiedId === p.id ? '✓ Copied' : 'Copy Code'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 flex flex-wrap gap-6 text-sm">
        <div><span className="text-slate-500">Total Discount Given:</span> <span className="text-rose-400 font-semibold ml-2">₹{promos.reduce((s, p) => s + p.totalDiscountGiven, 0).toLocaleString('en-IN')}</span></div>
        <div><span className="text-slate-500">Active Codes:</span> <span className="text-emerald-400 font-semibold ml-2">{promos.filter(p => p.status === 'Active').length}</span></div>
        <div><span className="text-slate-500">Total Uses:</span> <span className="text-indigo-400 font-semibold ml-2">{promos.reduce((s, p) => s + p.usedCount, 0)}</span></div>
        <div><span className="text-slate-500">Partner Codes:</span> <span className="text-violet-400 font-semibold ml-2">{promos.filter(p => p.partnerSpecific).length}</span></div>
      </div>
    </div>
  );
}

