'use client';

import { useState } from 'react';
import Link from 'next/link';

const COMMUNICATIONS: { id: string; recipient: string; channel: string; subject: string; audience: string; program: string; status: string; sentAt: string }[] = [];

const STATUS_META: Record<string, string> = {
  Sent:    'bg-emerald-500/15 text-emerald-300',
  Failed:  'bg-red-500/15 text-red-400',
  Pending: 'bg-amber-500/15 text-amber-300',
};

const CHANNEL_META: Record<string, string> = {
  Email:    'bg-indigo-500/15 text-indigo-300',
  WhatsApp: 'bg-emerald-500/15 text-emerald-400',
};

const AUDIENCE_META: Record<string, string> = {
  Individual:  'bg-violet-500/15 text-violet-300',
  Cohort:      'bg-blue-500/15 text-blue-300',
  Alumni:      'bg-amber-500/15 text-amber-300',
  Partners:    'bg-teal-500/15 text-teal-300',
  Broadcast:   'bg-pink-500/15 text-pink-300',
  'All Learners': 'bg-slate-500/15 text-slate-300',
};

const KPI_CARDS = [
  { label: 'Messages Sent Today', value: '0',   accent: 'bg-indigo-500', color: 'text-indigo-400' },
  { label: 'Email Open Rate',      value: '0%',  accent: 'bg-violet-500', color: 'text-violet-400' },
  { label: 'WhatsApp Delivery',    value: '0%',  accent: 'bg-emerald-500', color: 'text-emerald-400' },
  { label: 'Failed',               value: '0',   accent: 'bg-red-500',    color: 'text-red-400' },
];

export default function CommunicationsPage() {
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter]   = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [audienceFilter, setAudienceFilter] = useState('All');

  const filtered = COMMUNICATIONS.filter(c => {
    if (channelFilter !== 'All' && c.channel !== channelFilter) return false;
    if (statusFilter  !== 'All' && c.status  !== statusFilter)  return false;
    if (programFilter !== 'All' && c.program !== programFilter) return false;
    if (audienceFilter !== 'All' && c.audience !== audienceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Communications Hub</h1>
          <p className="mt-0.5 text-sm text-slate-500">{COMMUNICATIONS.length} messages · {COMMUNICATIONS.filter(c=>c.status==='Sent').length} delivered</p>
        </div>
        <div className="flex gap-2">
          <Link href="/academy/communications/automations" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition">Automations</Link>
          <Link href="/academy/communications/templates" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition">Templates</Link>
          <Link href="/academy/communications/broadcast" className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Compose Broadcast
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPI_CARDS.map(k => (
          <div key={k.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${k.accent}`} />
            <div>
              <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-600">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All','Email','WhatsApp'].map(f => (
            <button key={f} onClick={() => setChannelFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition ${channelFilter===f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{f}</button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All','Sent','Failed','Pending'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition ${statusFilter===f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{f}</button>
          ))}
        </div>
        <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-1.5 text-xs text-slate-300">
          {['All','Tier 1','Tier 2','Tier 3'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0c1022] px-3 py-1.5 text-xs text-slate-300">
          {['All','Individual','Cohort','Alumni','Partners','Broadcast','All Learners'].map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recipient</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Channel</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Message Preview</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Audience</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Program</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 text-slate-200 text-xs font-medium max-w-[160px] truncate">{c.recipient}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${CHANNEL_META[c.channel]}`}>{c.channel}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[280px] truncate">{c.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${AUDIENCE_META[c.audience] ?? 'bg-slate-700 text-slate-400'}`}>{c.audience}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.program}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_META[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.sentAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-600 text-sm">No messages match your filters.</div>
        )}
      </div>
    </div>
  );
}
