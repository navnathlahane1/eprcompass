'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

interface AgentStat {
  id: string; full_name: string; role: string;
  today_calls: number; today_connected: number;
  total_calls: number; connected_calls: number; contact_rate: number;
  avg_duration: number; open_leads: number; converted_leads: number;
  proposals_sent: number; pending_followups: number; overdue_followups: number;
}

interface Totals {
  total_agents: number; total_calls: number; today_calls: number; today_connected: number;
  connected_calls: number; contact_rate: number; open_leads: number; converted_leads: number;
  proposals_sent: number; pending_followups: number; overdue_followups: number;
}

export default function TeamLeadDashboardClient() {
  const [period, setPeriod] = useState('7d');
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/telecalling/team-lead/stats?period=${period}`)
      .then(r => r.json())
      .then(d => { setAgentStats(d.agentStats || []); setTotals(d.totals || null); })
      .finally(() => setLoading(false));
  }, [period]);

  const sorted = [...agentStats].sort((a, b) => b.today_calls - a.today_calls);
  const todayTarget = 40;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live overview of your telecalling team</p>
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

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      ) : totals && (
        <>
          {/* Today's team KPIs */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Today</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Team Calls Today',   value: totals.today_calls,     sub: `${totals.total_agents} agents`, color: 'text-white' },
                { label: 'Connected Today',    value: totals.today_connected, sub: totals.today_calls > 0 ? `${Math.round((totals.today_connected / totals.today_calls) * 100)}% rate` : '—', color: 'text-teal-400' },
                { label: 'Pending Follow-ups', value: totals.pending_followups, sub: totals.overdue_followups > 0 ? `${totals.overdue_followups} overdue` : 'All on time', color: totals.overdue_followups > 0 ? 'text-red-400' : 'text-white' },
                { label: 'Open Leads',         value: totals.open_leads,      sub: `${totals.converted_leads} converted`, color: 'text-white' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#0c1022] border border-slate-800 rounded-xl p-4">
                  <div className={`text-3xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Period KPIs */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Last {period}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Calls',      value: totals.total_calls,      color: 'text-white' },
                { label: 'Contact Rate',     value: `${totals.contact_rate}%`, color: 'text-blue-400' },
                { label: 'Proposals Sent',   value: totals.proposals_sent,   color: 'text-purple-400' },
                { label: 'Conversions',      value: totals.converted_leads,  color: 'text-green-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#0c1022] border border-slate-800 rounded-xl p-4">
                  <div className={`text-3xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Leaderboard */}
          <div className="bg-[#0c1022] border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200">Agent Leaderboard — Today</h2>
              <Link href="/telecalling/team-lead/agents" className="text-xs text-teal-400 hover:text-teal-300">View all →</Link>
            </div>
            <div className="divide-y divide-slate-800/60">
              {sorted.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">No agents found</div>
              ) : sorted.map((agent, i) => {
                const pct = Math.min(100, Math.round((agent.today_calls / todayTarget) * 100));
                return (
                  <div key={agent.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/20 transition">
                    <span className="text-sm font-bold text-slate-600 w-5 shrink-0 text-center">#{i + 1}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-[10px] font-bold text-teal-300">
                      {(agent.full_name || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200">{agent.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full max-w-[120px]">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500">{agent.today_calls}/{todayTarget} calls</span>
                      </div>
                    </div>
                    <div className="flex gap-5 text-right shrink-0">
                      <div>
                        <div className="text-sm font-bold text-white tabular-nums">{agent.today_calls}</div>
                        <div className="text-[10px] text-slate-500">calls</div>
                      </div>
                      <div>
                        <div className={`text-sm font-bold tabular-nums ${agent.contact_rate >= 60 ? 'text-green-400' : agent.contact_rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{agent.contact_rate}%</div>
                        <div className="text-[10px] text-slate-500">contact</div>
                      </div>
                      <div>
                        <div className={`text-sm font-bold tabular-nums ${agent.overdue_followups > 0 ? 'text-red-400' : 'text-white'}`}>{agent.pending_followups}</div>
                        <div className="text-[10px] text-slate-500">follow-ups</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-teal-400 tabular-nums">{agent.open_leads}</div>
                        <div className="text-[10px] text-slate-500">leads</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          {(agentStats.some(a => a.overdue_followups > 0) || agentStats.some(a => a.today_calls === 0)) && (
            <div className="bg-[#0c1022] border border-amber-500/20 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-amber-300 mb-3">⚠ Attention Needed</h2>
              <div className="space-y-2">
                {agentStats.filter(a => a.today_calls === 0).map(a => (
                  <div key={`nc-${a.id}`} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="font-medium text-amber-200">{a.full_name}</span> has made 0 calls today
                  </div>
                ))}
                {agentStats.filter(a => a.overdue_followups > 0).map(a => (
                  <div key={`of-${a.id}`} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="font-medium text-red-300">{a.full_name}</span> has {a.overdue_followups} overdue follow-up{a.overdue_followups > 1 ? 's' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
