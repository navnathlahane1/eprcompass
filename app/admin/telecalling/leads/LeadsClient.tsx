'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import EnrichmentBadge from '@/components/telecalling/EnrichmentBadge';
import CallLogModal from '@/components/telecalling/CallLogModal';

const TC_STATUSES = ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'DNC'];

const DISPOSITION_STYLES: Record<string, string> = {
  'Interested':      'bg-emerald-950/40 text-emerald-300 border-emerald-700/40',
  'Converted':       'bg-emerald-950/40 text-emerald-300 border-emerald-700/40',
  'Call Back':       'bg-amber-950/40 text-amber-300 border-amber-700/40',
  'Not Interested':  'bg-rose-950/40 text-rose-300 border-rose-700/40',
  'Wrong Number':    'bg-rose-950/40 text-rose-300 border-rose-700/40',
  'No Answer':       'bg-slate-800 text-slate-400 border-slate-700',
  'Busy':            'bg-slate-800 text-slate-400 border-slate-700',
  'Voicemail':       'bg-slate-800 text-slate-400 border-slate-700',
};

interface Agent {
  id: string;
  full_name: string | null;
  role: string;
}

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  tc_status: string;
  tc_call_count: number;
  tc_enrichment_status: string;
  tc_last_called_at: string | null;
  tc_next_call_at: string | null;
  tc_assigned_agent: string | null;
  agent?: { full_name: string | null } | null;
  last_call?: { disposition: string | null; notes: string | null; status: string | null; created_at: string } | null;
  enrichment?: { lead_score?: number }[];
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export default function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [callModal, setCallModal] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('q', search);
    if (statusFilter) params.set('tc_status', statusFilter);
    if (agentFilter) params.set('agent_id', agentFilter);
    try {
      const res = await fetch(`/api/admin/telecalling/leads?${params}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load leads');
      }
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setLeads([]);
      setTotal(0);
      setError(err?.message || 'Failed to load leads');
    }
    setLoading(false);
  }, [page, search, statusFilter, agentFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/admin/telecalling/agents')
      .then(res => res.json())
      .then(data => setAgents(data.agents || []))
      .catch(() => setAgents([]));
  }, []);

  async function enrich(leadId: string) {
    await fetch(`/api/admin/telecalling/leads/${leadId}/enrich`, { method: 'POST' });
    load();
  }

  async function markDNC(leadId: string) {
    if (!confirm('Add this lead to DNC list?')) return;
    await fetch(`/api/admin/telecalling/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tc_status: 'DNC' }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Leads <span className="text-sm font-normal text-slate-500">({total})</span></h1>
        <Link href="/admin/telecalling/leads/import" className="btn-primary">
          Import Leads
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search company, contact, phone…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
        >
          <option value="">All statuses</option>
          {TC_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={agentFilter}
          onChange={e => { setAgentFilter(e.target.value); setPage(1); }}
          className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
        >
          <option value="">All telecallers</option>
          <option value="unassigned">Unassigned</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.full_name || a.id.slice(0, 8)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950">
              <tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Contact Name</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">State</th>
                <th className="text-left px-4 py-3 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Last Call</th>
                <th className="text-left px-4 py-3 font-medium">Next Follow-up</th>
                <th className="text-left px-4 py-3 font-medium">Calls</th>
                <th className="text-left px-4 py-3 font-medium">Enrichment</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-10 text-slate-500">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={11} className="text-center py-10 text-red-500">{error}</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-slate-500">No leads found</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className="border-t border-slate-800/60 hover:bg-slate-950">
                  <td className="px-4 py-3">
                    <a href={`/admin/telecalling/leads/${lead.id}`} className="font-medium text-blue-400 hover:underline">
                      {lead.company_name || '—'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{lead.contact_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{lead.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{lead.state || lead.city || '—'}</td>
                  <td className="px-4 py-3">
                    {lead.agent?.full_name ? (
                      <span className="text-slate-300">{lead.agent.full_name}</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/40 text-amber-400 border border-amber-700/40">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-slate-200">
                      {lead.tc_status || 'New'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.last_call ? (
                      <div className="space-y-0.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${DISPOSITION_STYLES[lead.last_call.disposition || ''] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {lead.last_call.disposition || lead.last_call.status || 'Logged'}
                        </span>
                        <p className="text-[11px] text-slate-600">{timeAgo(lead.last_call.created_at)}</p>
                      </div>
                    ) : (lead.tc_call_count || 0) === 0 ? (
                      <span className="text-xs text-slate-600 italic">Not contacted yet</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.tc_next_call_at ? (
                      <span className={isOverdue(lead.tc_next_call_at) ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                        {new Date(lead.tc_next_call_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {isOverdue(lead.tc_next_call_at) && <span className="ml-1 text-[10px] uppercase tracking-wide">overdue</span>}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{lead.tc_call_count || 0}</td>
                  <td className="px-4 py-3">
                    <EnrichmentBadge
                      status={lead.tc_enrichment_status}
                      score={lead.enrichment?.[0]?.lead_score}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCallModal({ id: lead.id, name: lead.company_name || lead.contact_name })}
                        className="px-2 py-1 text-xs border border-slate-700 rounded hover:bg-slate-950 text-slate-400"
                      >
                        Log Call
                      </button>
                      {(!lead.tc_enrichment_status || lead.tc_enrichment_status === 'none' || lead.tc_enrichment_status === 'failed') && (
                        <button
                          onClick={() => enrich(lead.id)}
                          className="px-2 py-1 text-xs border border-purple-300 rounded hover:bg-violet-950/30 text-violet-400"
                        >
                          Enrich
                        </button>
                      )}
                      <button
                        onClick={() => markDNC(lead.id)}
                        className="px-2 py-1 text-xs border border-rose-700/50 rounded hover:bg-rose-950/30 text-rose-400"
                      >
                        DNC
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>Showing {Math.min((page - 1) * 50 + 1, total)}–{Math.min(page * 50, total)} of {total}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Next</button>
        </div>
      </div>

      {callModal && (
        <CallLogModal
          leadId={callModal.id}
          leadName={callModal.name}
          onClose={() => setCallModal(null)}
          onSaved={() => { setCallModal(null); load(); }}
        />
      )}
    </div>
  );
}
