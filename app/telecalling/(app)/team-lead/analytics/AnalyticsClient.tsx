'use client';

import { useState, useEffect } from 'react';

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

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-[10px] text-slate-400 tabular-nums">{value}</span>
    </div>
  );
}

export default function AnalyticsClient() {
  const [period, setPeriod] = useState('7d');
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/telecalling/team-lead/stats?period=${period}`)
      .then(r => r.json())
      .then(d => { setAgents(d.agentStats || []); setTotals(d.totals || null); })
      .finally(() => setLoading(false));
  }, [period]);

  const maxCalls = Math.max(1, ...agents.map(a => a.total_calls));
  const maxLeads = Math.max(1, ...agents.map(a => a.open_leads));
  const maxProposals = Math.max(1, ...agents.map(a => a.proposals_sent));

  const convRate = totals && totals.open_leads + totals.converted_leads > 0
    ? Math.round((totals.converted_leads / (totals.open_leads + totals.converted_leads)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Performance breakdown across your team</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      ) : totals && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Calls', value: totals.total_calls, sub: `${totals.connected_calls} connected`, color: 'text-white' },
              { label: 'Contact Rate', value: `${totals.contact_rate}%`, sub: 'answered calls', color: totals.contact_rate >= 60 ? 'text-green-400' : totals.contact_rate >= 40 ? 'text-amber-400' : 'text-red-400' },
              { label: 'Conversion Rate', value: `${convRate}%`, sub: `${totals.converted_leads} of ${totals.open_leads + totals.converted_leads} leads`, color: 'text-purple-400' },
              { label: 'Proposals Sent', value: totals.proposals_sent, sub: `last ${period}`, color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#0c1022] border border-slate-800 rounded-xl p-4">
                <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Per-Agent Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Calls chart */}
            <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Calls per Agent</h3>
              <div className="space-y-3">
                {[...agents].sort((a, b) => b.total_calls - a.total_calls).map(a => (
                  <div key={a.id}>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="truncate max-w-[120px]">{a.full_name}</span>
                      <span className="text-slate-400">{a.contact_rate}% cr</span>
                    </div>
                    <Bar value={a.total_calls} max={maxCalls} color="bg-teal-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Open leads chart */}
            <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Open Leads per Agent</h3>
              <div className="space-y-3">
                {[...agents].sort((a, b) => b.open_leads - a.open_leads).map(a => (
                  <div key={a.id}>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="truncate max-w-[120px]">{a.full_name}</span>
                      <span className="text-green-400">{a.converted_leads} conv.</span>
                    </div>
                    <Bar value={a.open_leads} max={maxLeads} color="bg-blue-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Proposals chart */}
            <div className="bg-[#0c1022] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Proposals per Agent</h3>
              <div className="space-y-3">
                {[...agents].sort((a, b) => b.proposals_sent - a.proposals_sent).map(a => (
                  <div key={a.id}>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="truncate max-w-[120px]">{a.full_name}</span>
                      <span className={a.overdue_followups > 0 ? 'text-red-400' : 'text-slate-600'}>{a.pending_followups} fu</span>
                    </div>
                    <Bar value={a.proposals_sent} max={maxProposals} color="bg-purple-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Rate Ranking */}
          <div className="bg-[#0c1022] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200">Contact Rate Ranking</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Higher is better — &gt;60% is target</p>
            </div>
            <div className="divide-y divide-slate-800/40">
              {[...agents].sort((a, b) => b.contact_rate - a.contact_rate).map((a, i) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/20 transition">
                  <span className="text-sm font-bold text-slate-600 w-5 text-center">#{i + 1}</span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-[10px] font-bold text-teal-300">
                    {(a.full_name || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200">{a.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full max-w-[120px]">
                        <div className={`h-full rounded-full ${a.contact_rate >= 60 ? 'bg-green-500' : a.contact_rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.contact_rate}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <div className={`text-sm font-bold tabular-nums ${a.contact_rate >= 60 ? 'text-green-400' : a.contact_rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{a.contact_rate}%</div>
                      <div className="text-[10px] text-slate-500">contact</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tabular-nums">{a.total_calls}</div>
                      <div className="text-[10px] text-slate-500">calls</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-teal-400 tabular-nums">{a.connected_calls}</div>
                      <div className="text-[10px] text-slate-500">connected</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
