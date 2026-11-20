'use client';

import { useState } from 'react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-800 border-slate-700',
  sent: 'text-blue-400 bg-blue-900/30 border-blue-700/30',
  viewed: 'text-purple-400 bg-purple-900/30 border-purple-700/30',
  accepted: 'text-green-400 bg-green-900/30 border-green-700/30',
  rejected: 'text-red-400 bg-red-900/20 border-red-700/20',
};

const STATUS_TABS = ['all', 'draft', 'sent', 'accepted', 'rejected'] as const;

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props {
  data: {
    proposals: any[];
    total: number;
    interestedWithoutProposal: any[];
    byStatus: Record<string, number>;
  };
}

export default function AdminProposalsClient({ data }: Props) {
  const [tab, setTab] = useState<string>('all');
  const [view, setView] = useState<'proposals' | 'needs-action'>('proposals');

  const filtered = tab === 'all' ? data.proposals : data.proposals.filter(p => p.status === tab);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Proposal Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track all proposals sent by telecallers and identify follow-up opportunities.</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Proposals</p>
          <p className="text-2xl font-bold text-slate-100">{data.total}</p>
        </div>
        <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4">
          <p className="text-xs text-amber-400/70 mb-1">Interested — No Proposal</p>
          <p className="text-2xl font-bold text-amber-400">{data.interestedWithoutProposal.length}</p>
        </div>
        <div className="rounded-xl border border-blue-700/30 bg-blue-900/10 p-4">
          <p className="text-xs text-blue-400/70 mb-1">Proposals Sent</p>
          <p className="text-2xl font-bold text-blue-400">{data.byStatus['sent'] ?? 0}</p>
        </div>
        <div className="rounded-xl border border-green-700/30 bg-green-900/10 p-4">
          <p className="text-xs text-green-400/70 mb-1">Accepted</p>
          <p className="text-2xl font-bold text-green-400">{data.byStatus['accepted'] ?? 0}</p>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView('proposals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'proposals' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
        >
          All Proposals
        </button>
        <button
          onClick={() => setView('needs-action')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'needs-action' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
        >
          Needs Action
          {data.interestedWithoutProposal.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${view === 'needs-action' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'}`}>
              {data.interestedWithoutProposal.length}
            </span>
          )}
        </button>
      </div>

      {view === 'needs-action' ? (
        /* Interested leads without proposals */
        <div>
          <div className="rounded-xl border border-amber-700/20 bg-amber-950/10 p-4 mb-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-amber-300">
              These leads were marked <strong>Interested</strong> by a telecaller but no proposal has been created yet.
              Follow up with the assigned telecaller to ensure the proposal is sent.
            </p>
          </div>

          {data.interestedWithoutProposal.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-green-400 font-medium">All interested leads have proposals</p>
              <p className="text-sm mt-1">Great work — no gaps detected.</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-800/40">
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Lead / Company</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Assigned To</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Last Called</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.interestedWithoutProposal.map(lead => (
                    <tr key={lead.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-200">{lead.company_name || lead.name || '—'}</p>
                        {lead.email && <p className="text-xs text-slate-500">{lead.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{lead.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {lead.assigned_agent?.full_name ? (
                          <span className="text-slate-300">{lead.assigned_agent.full_name}</span>
                        ) : (
                          <span className="text-slate-600">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fmt(lead.tc_last_called_at)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/telecalling/leads/${lead.id}`}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition"
                        >
                          View Lead
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* All proposals */
        <div>
          {/* Status filter tabs */}
          <div className="flex gap-1 mb-5 border-b border-slate-700/60 overflow-x-auto">
            {STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  tab === s ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && data.byStatus[s] ? ` (${data.byStatus[s]})` : ''}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No proposals in this status.</div>
          ) : (
            <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-800/40">
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Proposal</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Telecaller</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Sent On</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-200 max-w-xs truncate">{p.title}</p>
                        {p.valid_until && (
                          <p className="text-[11px] text-slate-500">Valid till {fmt(p.valid_until)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.lead ? (
                          <>
                            <p className="font-medium text-slate-300">{p.lead.company_name || p.lead.name || '—'}</p>
                            {p.lead.phone && <p className="text-xs text-slate-500">{p.lead.phone}</p>}
                          </>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {p.creator?.full_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft}`}>
                          {p.status}
                        </span>
                        {p.status === 'draft' && (
                          <p className="text-[10px] text-amber-400/70 mt-0.5">Not sent yet</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-400">{fmtMoney(p.amount_inr)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(p.sent_at)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
