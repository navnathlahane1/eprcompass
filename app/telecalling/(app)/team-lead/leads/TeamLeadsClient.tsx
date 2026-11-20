'use client';

import { useState, useTransition } from 'react';

interface Lead {
  id: string; name: string; phone: string; company?: string; source?: string;
  tc_status?: string; assigned_to?: string; created_at: string; city?: string; state?: string;
}

interface Agent { id: string; full_name: string; role: string; }

const STATUS_COLOR: Record<string, string> = {
  New: 'bg-blue-500/20 text-blue-300',
  Contacted: 'bg-teal-500/20 text-teal-300',
  Interested: 'bg-purple-500/20 text-purple-300',
  'Follow-Up': 'bg-amber-500/20 text-amber-300',
  Converted: 'bg-green-500/20 text-green-300',
  Lost: 'bg-red-500/20 text-red-400',
  Rejected: 'bg-slate-500/20 text-slate-400',
};

export default function TeamLeadsClient({ leads, agents }: { leads: Lead[]; agents: Agent[] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [reassignTarget, setReassignTarget] = useState<Lead | null>(null);
  const [newAgent, setNewAgent] = useState('');
  const [isPending, startTransition] = useTransition();

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a.full_name]));

  const filtered = leads.filter(l => {
    if (filterStatus && l.tc_status !== filterStatus) return false;
    if (filterAgent && l.assigned_to !== filterAgent) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.company?.toLowerCase().includes(q);
    }
    return true;
  });

  const statuses = [...new Set(leads.map(l => l.tc_status).filter(Boolean))];

  async function handleReassign() {
    if (!reassignTarget || !newAgent) return;
    await fetch(`/api/admin/telecalling/leads/${reassignTarget.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ assigned_to: newAgent }),
    });
    startTransition(() => {
      setReassignTarget(null);
      setNewAgent('');
      window.location.reload();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Leads</h1>
          <p className="text-slate-400 text-sm mt-0.5">{leads.length} leads across all agents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, company..."
          className="h-8 px-3 w-56 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s!}>{s}</option>)}
        </select>
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none">
          <option value="">All Agents</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>
        {(search || filterStatus || filterAgent) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterAgent(''); }}
            className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 text-[11px] text-slate-400 hover:text-white">
            Clear
          </button>
        )}
        <span className="h-8 flex items-center text-[11px] text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {/* Table */}
      <div className="bg-[#0c1022] border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr_100px] gap-x-3 px-5 py-2.5 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          <span>Lead</span><span>Agent</span><span>Status</span><span>Source</span><span>Location</span><span></span>
        </div>
        <div className="divide-y divide-slate-800/40 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No leads found.</div>
          ) : filtered.map(lead => (
            <div key={lead.id} className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr_100px] gap-x-3 items-center px-5 py-3 hover:bg-slate-800/20 transition">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{lead.name}</p>
                <p className="text-[10px] text-slate-500">{lead.phone}</p>
                {lead.company && <p className="text-[10px] text-slate-600 truncate">{lead.company}</p>}
              </div>
              <div className="text-xs text-slate-400 truncate">{lead.assigned_to ? agentMap[lead.assigned_to] || '—' : 'Unassigned'}</div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[lead.tc_status || ''] || 'bg-slate-700 text-slate-400'}`}>
                  {lead.tc_status || '—'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">{lead.source || '—'}</div>
              <div className="text-[11px] text-slate-500">{[lead.city, lead.state].filter(Boolean).join(', ') || '—'}</div>
              <div>
                <button onClick={() => { setReassignTarget(lead); setNewAgent(lead.assigned_to || ''); }}
                  className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-teal-500/50 transition">
                  Reassign
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reassign Modal */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c1022] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100 mb-1">Reassign Lead</h3>
            <p className="text-sm text-slate-400 mb-4">{reassignTarget.name} — {reassignTarget.phone}</p>
            <select value={newAgent} onChange={e => setNewAgent(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-300 focus:outline-none mb-4">
              <option value="">Select agent…</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setReassignTarget(null)}
                className="flex-1 h-9 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleReassign} disabled={!newAgent || isPending}
                className="flex-1 h-9 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium disabled:opacity-40">
                {isPending ? 'Saving…' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
