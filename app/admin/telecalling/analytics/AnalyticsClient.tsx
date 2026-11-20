'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import TelecallingKPICard from '@/components/telecalling/TelecallingKPICard';
import AgentLeaderboard from '@/components/telecalling/AgentLeaderboard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [agentFilter, setAgentFilter] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/telecalling/analytics?from=${dateFrom}&to=${dateTo}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  if (loading) return <div className="text-center py-16 text-slate-500">Loading analytics…</div>;
  if (!data) return null;

  const dispositionData = Object.entries(data.disposition_breakdown || {})
    .map(([name, value]) => ({ name, value }));

  const statusData = Object.entries(data.leads_by_status || {})
    .map(([name, value]) => ({ name, value }));

  const dailyAgentReport = (data.daily_agent_report || []).filter((r: any) =>
    !agentFilter || r.agent_name.toLowerCase().includes(agentFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Analytics</h1>
        <div className="flex gap-3 items-center">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100" />
          <span className="text-slate-500">–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <TelecallingKPICard label="Total Calls" value={data.kpis.total_calls} />
        <TelecallingKPICard label="Connected" value={data.kpis.connected_calls} />
        <TelecallingKPICard label="Contact Rate" value={`${data.kpis.contact_rate}%`} />
        <TelecallingKPICard label="Avg Duration" value={`${Math.floor(data.kpis.avg_duration_seconds / 60)}m ${data.kpis.avg_duration_seconds % 60}s`} />
        <TelecallingKPICard label="Total Leads" value={data.kpis.total_leads} />
        <TelecallingKPICard label="Followup Rate" value={`${data.kpis.followup_completion_rate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily call volume */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Daily Call Volume</h2>
          {data.daily_call_volume.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.daily_call_volume}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Disposition breakdown */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Call Dispositions</h2>
          {dispositionData.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dispositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {dispositionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leads by status */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Lead Funnel</h2>
          {statusData.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Agent leaderboard */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <AgentLeaderboard agents={data.leaderboard || []} />
        </div>
      </div>

      {/* Daily telecaller report */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="font-semibold text-slate-100">Daily Telecaller Report</h2>
          <input
            type="text"
            placeholder="Filter by agent name…"
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100 w-56"
          />
        </div>
        {dailyAgentReport.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No calls logged in this date range</div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="text-left text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Agent</th>
                  <th className="py-2 pr-4 font-medium text-right">Calls</th>
                  <th className="py-2 pr-4 font-medium text-right">Connected</th>
                  <th className="py-2 pr-4 font-medium text-right">Interested</th>
                  <th className="py-2 pr-4 font-medium text-right">Not Responded</th>
                  <th className="py-2 pr-4 font-medium text-right">Contact Rate</th>
                </tr>
              </thead>
              <tbody>
                {dailyAgentReport.map((r: any) => (
                  <tr key={`${r.date}__${r.agent_id}`} className="border-b border-slate-800/60 text-slate-200">
                    <td className="py-2 pr-4">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-2 pr-4">{r.agent_name}</td>
                    <td className="py-2 pr-4 text-right">{r.calls}</td>
                    <td className="py-2 pr-4 text-right">{r.connected}</td>
                    <td className="py-2 pr-4 text-right">{r.interested}</td>
                    <td className="py-2 pr-4 text-right">{r.not_responded}</td>
                    <td className="py-2 pr-4 text-right">{r.contact_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
