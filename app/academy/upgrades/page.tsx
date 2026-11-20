'use client';

import { useState } from 'react';
import {
  TrendingUp, Users, IndianRupee, Clock, ArrowUpRight,
  ChevronRight, Send, Star, CheckCircle, XCircle
} from 'lucide-react';

type UpgradeStatus = 'Eligible' | 'Contacted' | 'Interested' | 'Enrolled' | 'Converted' | 'Dropped';

interface UpgradeCandidate {
  id: string;
  name: string;
  email: string;
  completedTier: 'Tier 1' | 'Tier 2';
  completionDate: string;
  daysSinceEligible: number;
  status: UpgradeStatus;
  discountOffered?: string;
  targetTier: 'Tier 2' | 'Tier 3';
}

const STATUS_CONFIG: Record<UpgradeStatus, { color: string; bg: string }> = {
  'Eligible':   { color: 'text-slate-300',   bg: 'bg-slate-700/60 border-slate-600/40' },
  'Contacted':  { color: 'text-sky-400',      bg: 'bg-sky-500/10 border-sky-500/30' },
  'Interested': { color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/30' },
  'Enrolled':   { color: 'text-indigo-400',   bg: 'bg-indigo-500/10 border-indigo-500/30' },
  'Converted':  { color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Dropped':    { color: 'text-red-400',       bg: 'bg-red-500/10 border-red-500/30' },
};

const TIER1_CANDIDATES: UpgradeCandidate[] = [];

const TIER2_CANDIDATES: UpgradeCandidate[] = [];

const KPI_CARDS = [
  { label: 'Tier 1→2 Eligible', value: '0', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { label: 'Tier 2→3 Eligible', value: '0', icon: Star, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { label: 'Conversions This Month', value: '0', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Conversion Rate T1→T2', value: '0%', icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { label: 'Revenue from Upgrades', value: '₹0', icon: IndianRupee, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Avg Days to Upgrade', value: '0 days', icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10' },
];

export default function UpgradePipelinePage() {
  const [activeTab, setActiveTab] = useState<'1to2' | '2to3'>('1to2');
  const [tier1, setTier1] = useState<UpgradeCandidate[]>(TIER1_CANDIDATES);
  const [tier2, setTier2] = useState<UpgradeCandidate[]>(TIER2_CANDIDATES);

  const updateStatus = (id: string, newStatus: UpgradeStatus, isTier1: boolean) => {
    if (isTier1) setTier1(p => p.map(c => c.id === id ? { ...c, status: newStatus } : c));
    else setTier2(p => p.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const candidates = activeTab === '1to2' ? tier1 : tier2;
  const isTier1 = activeTab === '1to2';

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Upgrade Pipeline</h1>
        <p className="text-slate-400 text-sm mt-1">EPR Compass — Learner tier upgrade tracking and conversion</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPI_CARDS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0c1022] border border-slate-800/80 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('1to2')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === '1to2' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Tier 1 → Tier 2 <span className="ml-1.5 text-xs opacity-80">({tier1.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('2to3')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === '2to3' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Tier 2 → Tier 3 <span className="ml-1.5 text-xs opacity-80">({tier2.length})</span>
        </button>
      </div>

      {/* Candidates Table */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Name</th>
              <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Completed</th>
              <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Days Eligible</th>
              <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Discount</th>
              <th className="text-right text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : candidates.map((c, i) => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <tr key={c.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${i === candidates.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="text-slate-200 text-sm font-medium">{c.name}</div>
                    <div className="text-slate-500 text-xs">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm hidden md:table-cell">{c.completionDate}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-sm font-medium ${c.daysSinceEligible > 30 ? 'text-red-400' : c.daysSinceEligible > 14 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {c.daysSinceEligible}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm hidden lg:table-cell">{c.discountOffered || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {c.status === 'Eligible' && (
                        <button onClick={() => updateStatus(c.id, 'Contacted', isTier1)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors">
                          <Send className="w-3 h-3" /> Send Offer
                        </button>
                      )}
                      {c.status === 'Contacted' && (
                        <button onClick={() => updateStatus(c.id, 'Interested', isTier1)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors">
                          <Star className="w-3 h-3" /> Mark Interested
                        </button>
                      )}
                      {(c.status === 'Interested' || c.status === 'Contacted') && (
                        <button onClick={() => updateStatus(c.id, 'Enrolled', isTier1)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                          <ArrowUpRight className="w-3 h-3" /> Enroll
                        </button>
                      )}
                      {c.status === 'Enrolled' && (
                        <button onClick={() => updateStatus(c.id, 'Converted', isTier1)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          <CheckCircle className="w-3 h-3" /> Convert
                        </button>
                      )}
                      {!['Converted', 'Dropped'].includes(c.status) && (
                        <button onClick={() => updateStatus(c.id, 'Dropped', isTier1)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
                          <XCircle className="w-3 h-3" /> Drop
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

