'use client';

import { useState } from 'react';

interface Followup {
  id: string; lead_id: string; assigned_to?: string;
  scheduled_for: string; status: string; notes?: string;
  leads?: { name?: string; phone?: string; company?: string } | null;
}
interface Agent { id: string; full_name: string; role: string; }

function relativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hrs = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const past = diff < 0;
  if (mins < 60) return past ? `${mins}m ago` : `in ${mins}m`;
  if (hrs < 24) return past ? `${hrs}h ago` : `in ${hrs}h`;
  return past ? `${days}d ago` : `in ${days}d`;
}

export default function TeamFollowupsClient({ followups, agents }: { followups: Followup[]; agents: Agent[] }) {
  const [filterAgent, setFilterAgent] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const now = new Date();

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a.full_name]));

  const filtered = followups.filter(f => {
    if (filterAgent && f.assigned_to !== filterAgent) return false;
    if (showOverdueOnly && new Date(f.scheduled_for) >= now) return false;
    return true;
  });

  const overdue = followups.filter(f => new Date(f.scheduled_for) < now);
  const upcoming = followups.filter(f => new Date(f.scheduled_for) >= now);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Follow-ups</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            <span className="text-red-400 font-medium">{overdue.length} overdue</span>
            <span className="text-slate-600"> · </span>
            <span className="text-teal-400">{upcoming.length} upcoming</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none">
          <option value="">All Agents</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>
        <button onClick={() => setShowOverdueOnly(v => !v)}
          className={`h-8 px-3 rounded-lg border text-[11px] font-medium transition-colors ${showOverdueOnly ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'}`}>
          Overdue only
        </button>
        <span className="h-8 flex items-center text-[11px] text-slate-600 ml-auto">{filtered.length} shown</span>
      </div>

      {/* Agent overdue summary chips */}
      {overdue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {agents.filter(a => overdue.some(f => f.assigned_to === a.id)).map(a => {
            const count = overdue.filter(f => f.assigned_to === a.id).length;
            return (
              <button key={a.id} onClick={() => setFilterAgent(filterAgent === a.id ? '' : a.id)}
                className={`h-7 px-3 rounded-full border text-[10px] font-medium transition-colors ${filterAgent === a.id ? 'border-red-500/60 bg-red-500/20 text-red-300' : 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15'}`}>
                {a.full_name} · {count} overdue
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="bg-[#0c1022] border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr] gap-x-3 px-5 py-2.5 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          <span>Lead</span><span>Agent</span><span>Due</span><span>Notes</span>
        </div>
        <div className="divide-y divide-slate-800/40 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No follow-ups found.</div>
          ) : filtered.map(f => {
            const isOverdue = new Date(f.scheduled_for) < now;
            const lead = f.leads;
            return (
              <div key={f.id} className={`grid grid-cols-[2fr_1.5fr_1fr_1.5fr] gap-x-3 items-center px-5 py-3 hover:bg-slate-800/20 transition ${isOverdue ? 'border-l-2 border-red-500/50' : ''}`}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{lead?.name || '—'}</p>
                  <p className="text-[10px] text-slate-500">{lead?.phone || ''}</p>
                  {lead?.company && <p className="text-[10px] text-slate-600 truncate">{lead.company}</p>}
                </div>
                <div className="text-xs text-slate-400 truncate">{f.assigned_to ? agentMap[f.assigned_to] || '—' : 'Unassigned'}</div>
                <div>
                  <div className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-teal-400'}`}>{relativeTime(f.scheduled_for)}</div>
                  <div className="text-[10px] text-slate-600">{new Date(f.scheduled_for).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-[11px] text-slate-500 truncate">{f.notes || '—'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
