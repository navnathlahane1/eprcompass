'use client';

import { useState, useEffect } from 'react';

interface AgentStat {
  id: string; full_name: string; role: string;
  today_calls: number; today_connected: number;
  total_calls: number; connected_calls: number; contact_rate: number;
  avg_duration: number; open_leads: number; converted_leads: number;
  proposals_sent: number; pending_followups: number; overdue_followups: number;
}

const ROLE_LABEL: Record<string, string> = {
  telecaller: 'Telecaller',
  tc_team_lead: 'Team Lead',
  tc_senior_agent: 'Senior Agent',
  tc_quality_analyst: 'QA Analyst',
  tc_campaign_manager: 'Campaign Mgr',
  tc_trainer: 'Trainer',
};

function fmtDuration(s: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export default function AgentsClient() {
  const [period, setPeriod] = useState('7d');
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<keyof AgentStat>('today_calls');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/telecalling/team-lead/stats?period=${period}`)
      .then(r => r.json())
      .then(d => setAgents(d.agentStats || []))
      .finally(() => setLoading(false));
  }, [period]);

  const todayTarget = 40;

  const filtered = agents
    .filter(a => !search || a.full_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[sort] as number) - (a[sort] as number));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Agents</h1>
          <p className="text-slate-400 text-sm mt-0.5">{agents.length} agents in your team</p>
        </div>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? 'bg-teal-500/20 border border-teal-500/40 text-teal-200' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agent..."
          className="h-8 pl-3 pr-3 w-44 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
        <select value={sort as string} onChange={e => setSort(e.target.value as keyof AgentStat)}
          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none">
          <option value="today_calls">Sort: Calls Today</option>
          <option value="total_calls">Sort: Total Calls</option>
          <option value="contact_rate">Sort: Contact Rate</option>
          <option value="open_leads">Sort: Open Leads</option>
          <option value="proposals_sent">Sort: Proposals</option>
          <option value="converted_leads">Sort: Conversions</option>
          <option value="overdue_followups">Sort: Overdue FUs</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No agents found.</div>
      ) : (
        <div className="bg-[#0c1022] border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px_80px] gap-x-2 px-5 py-2.5 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            <span>Agent</span>
            <span className="text-center">Today</span>
            <span className="text-center">Contact%</span>
            <span className="text-center">Avg Dur</span>
            <span className="text-center">Leads</span>
            <span className="text-center">Proposals</span>
            <span className="text-center">Conv.</span>
            <span className="text-center">FU Due</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {filtered.map(agent => {
              const pct = Math.min(100, Math.round((agent.today_calls / todayTarget) * 100));
              const health = agent.overdue_followups > 3 ? 'bg-red-500' : agent.today_calls < 10 ? 'bg-amber-500' : 'bg-green-500';
              return (
                <div key={agent.id} className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px_80px] gap-x-2 items-center px-5 py-3 hover:bg-slate-800/20 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-[10px] font-bold text-teal-300">
                      {(agent.full_name || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0c1022] ${health}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{agent.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{ROLE_LABEL[agent.role] || agent.role}</span>
                        <div className="h-1 flex-1 max-w-[60px] bg-slate-800 rounded-full">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-600">{pct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white tabular-nums">{agent.today_calls}</div>
                    <div className="text-[10px] text-slate-600">{agent.today_connected} conn.</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold tabular-nums ${agent.contact_rate >= 60 ? 'text-green-400' : agent.contact_rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{agent.contact_rate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 tabular-nums">{fmtDuration(agent.avg_duration)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-teal-400 tabular-nums">{agent.open_leads}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-purple-400 tabular-nums">{agent.proposals_sent}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-400 tabular-nums">{agent.converted_leads}</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold tabular-nums ${agent.overdue_followups > 0 ? 'text-red-400' : 'text-slate-400'}`}>{agent.pending_followups}</div>
                    {agent.overdue_followups > 0 && <div className="text-[10px] text-red-500">{agent.overdue_followups} late</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
