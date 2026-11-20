'use client';

import { useState } from 'react';
import Link from 'next/link';

type PartnerType = 'Type A' | 'Type B' | 'Type C';
type PartnerTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
type PartnerStatus = 'Prospect' | 'LOI Signed' | 'T3 Pending' | 'T3 Certified' | 'MoU Signed' | 'Active' | 'Suspended';

interface Partner {
  id: string;
  partnerId: string;
  name: string;
  email: string;
  city: string;
  type: PartnerType;
  tier: PartnerTier;
  t3Status: 'Pending' | 'Scheduled' | 'In Progress' | 'Certified' | 'N/A';
  status: PartnerStatus;
  activeBatches: number;
  totalRevenue: number;
  referrals: number;
  onboarded: string;
}

const PARTNERS: Partner[] = [];

const TIER_STYLE: Record<PartnerTier, string> = {
  Bronze:   'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Silver:   'bg-slate-500/10 text-slate-300 border-slate-500/30',
  Gold:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  Platinum: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
};

const TYPE_STYLE: Record<PartnerType, string> = {
  'Type A': 'bg-indigo-500/15 text-indigo-300',
  'Type B': 'bg-violet-500/15 text-violet-300',
  'Type C': 'bg-teal-500/15 text-teal-300',
};

const TYPE_DESC: Record<PartnerType, string> = {
  'Type A': 'Training Institute',
  'Type B': 'Individual Trainer',
  'Type C': 'Referral Partner',
};

const STATUS_STYLE: Record<PartnerStatus, string> = {
  Prospect:     'bg-slate-700 text-slate-400',
  'LOI Signed': 'bg-blue-500/15 text-blue-300',
  'T3 Pending': 'bg-amber-500/15 text-amber-300',
  'T3 Certified': 'bg-emerald-500/15 text-emerald-300',
  'MoU Signed': 'bg-indigo-500/15 text-indigo-300',
  Active:       'bg-emerald-500/15 text-emerald-400',
  Suspended:    'bg-red-500/15 text-red-400',
};

export default function PartnersPage() {
  const [typeFilter, setTypeFilter]   = useState('All');
  const [tierFilter, setTierFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch]           = useState('');

  const filtered = PARTNERS.filter(p => {
    if (typeFilter !== 'All' && p.type !== typeFilter) return false;
    if (tierFilter !== 'All' && p.tier !== tierFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.partnerId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRevenue = PARTNERS.reduce((s, p) => s + p.totalRevenue, 0);
  const totalReferrals = PARTNERS.reduce((s, p) => s + p.referrals, 0);
  const activeCount = PARTNERS.filter(p => p.status === 'Active').length;
  const certifiedCount = PARTNERS.filter(p => p.t3Status === 'Certified').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Partner Directory</h1>
          <p className="mt-0.5 text-sm text-slate-500">{PARTNERS.length} partners across Type A, B & C</p>
        </div>
        <Link href="/academy/partners/create"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Onboard Partner
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Partners',        value: PARTNERS.length,                                  color: 'text-indigo-400'  },
          { label: 'Active Partners',        value: activeCount,                                      color: 'text-emerald-400' },
          { label: 'T3 Certified Trainers',  value: certifiedCount,                                   color: 'text-violet-400'  },
          { label: 'Partner-Gen Revenue',    value: `₹${(totalRevenue/1000).toFixed(0)}K`,            color: 'text-amber-400'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners…"
          className="flex-1 min-w-[180px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <FilterBar label="Type" options={['All', 'Type A', 'Type B', 'Type C']} value={typeFilter} onChange={setTypeFilter} />
        <FilterBar label="Tier" options={['All', 'Bronze', 'Silver', 'Gold', 'Platinum']} value={tierFilter} onChange={setTierFilter} />
        <FilterBar label="Status" options={['All', 'LOI Signed', 'T3 Pending', 'T3 Certified', 'Active', 'Suspended']} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/40">
              {['Partner', 'ID', 'Type', 'Tier', 'T3', 'Status', 'Active Batches', 'Referrals', 'Revenue', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200 text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-600">{p.city} · {p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{p.partnerId}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${TYPE_STYLE[p.type]}`}>
                    {p.type}
                  </span>
                  <p className="text-[9px] text-slate-600 mt-0.5">{TYPE_DESC[p.type]}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${TIER_STYLE[p.tier]}`}>
                    {p.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                    p.t3Status === 'Certified'   ? 'bg-emerald-500/15 text-emerald-400' :
                    p.t3Status === 'Scheduled'   ? 'bg-blue-500/15 text-blue-300' :
                    p.t3Status === 'In Progress' ? 'bg-amber-500/15 text-amber-300' :
                    p.t3Status === 'N/A'         ? 'bg-slate-800 text-slate-600' :
                                                   'bg-red-500/10 text-red-400'}`}>
                    {p.t3Status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-slate-300 font-semibold">{p.activeBatches}</td>
                <td className="px-4 py-3 text-center text-xs text-slate-300">{p.referrals}</td>
                <td className="px-4 py-3 text-xs text-emerald-400 font-semibold">
                  {p.totalRevenue > 0 ? `₹${p.totalRevenue.toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/academy/partners/${p.id}`}
                    className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Type A = Training Institute · Type B = Individual Trainer · Type C = Referral/Referral-Only Partner
      </p>
    </div>
  );
}

function FilterBar({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-slate-600 uppercase">{label}:</span>
      <div className="flex rounded-lg border border-slate-700 overflow-hidden">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-2.5 py-1.5 text-[10px] font-medium transition ${value === o ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
