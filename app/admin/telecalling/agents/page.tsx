'use client';

/**
 * /admin/telecalling/agents  — Agent Availability Board
 *
 * Shows all telecaller / sales-executive team members with their
 * live call activity for today. Auto-refreshes every 30 s.
 * Powered by the GET /api/admin/telecalling/agents endpoint.
 */

import { useEffect, useState } from 'react';
import TelecallingSubNav from '@/components/telecalling/TelecallingSubNav';

interface Agent {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  calls_today: number;
  connected_today: number;
  last_call_at: string | null;
  last_disposition: string | null;
  last_campaign_name: string | null;
}

const DISPOSITION_COLOR: Record<string, string> = {
  Connected:      'bg-emerald-900/30 text-emerald-300',
  Interested:     'bg-emerald-100 text-emerald-800',
  Converted:      'bg-teal-100 text-teal-800',
  Callback:       'bg-blue-900/30 text-blue-300',
  'No Answer':    'bg-slate-900 text-slate-400',
  Busy:           'bg-amber-900/30 text-amber-200',
  'Left Voicemail': 'bg-violet-900/30 text-purple-800',
  'Wrong Number': 'bg-rose-900/30 text-rose-300',
  'Not Interested': 'bg-rose-100 text-rose-700',
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'No calls yet';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusDot(agent: Agent): { label: string; color: string } {
  if (!agent.last_call_at) return { label: 'Idle', color: 'bg-slate-600' };
  const minsAgo = (Date.now() - new Date(agent.last_call_at).getTime()) / 60000;
  if (minsAgo < 5)  return { label: 'Active',    color: 'bg-green-500 animate-pulse' };
  if (minsAgo < 30) return { label: 'Recent',    color: 'bg-yellow-400' };
  return               { label: 'Away',      color: 'bg-slate-500' };
}

export default function AgentsPage() {
  const [agents, setAgents]   = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function loadAgents() {
    try {
      const res  = await fetch('/api/admin/telecalling/agents');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load agents'); return; }
      setAgents(data.agents || []);
      setLastRefreshed(new Date());
      setError('');
    } catch {
      setError('Network error — could not load agents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 30_000); // refresh every 30 s
    return () => clearInterval(interval);
  }, []);

  // summary counts
  const active  = agents.filter((a) => a.last_call_at && (Date.now() - new Date(a.last_call_at).getTime()) < 5 * 60000).length;
  const totalCalls     = agents.reduce((s, a) => s + a.calls_today, 0);
  const totalConnected = agents.reduce((s, a) => s + a.connected_today, 0);
  const overallRate    = totalCalls > 0 ? Math.round((totalConnected / totalCalls) * 100) : 0;

  return (
    <div className="p-6">
      <TelecallingSubNav active="agents" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Agent Availability</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Today&apos;s activity · auto-refreshes every 30 s
            {lastRefreshed && (
              <span className="ml-2 text-xs text-slate-500">
                (last: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); loadAgents(); }}
          disabled={loading}
          className="text-xs border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-900 transition disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-800/40 bg-rose-950/30 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Agents', value: agents.length, color: 'text-slate-100' },
          { label: 'Active Now',   value: active,         color: 'text-emerald-400' },
          { label: 'Calls Today',  value: totalCalls,     color: 'text-blue-400 '  },
          { label: 'Connect Rate', value: `${overallRate}%`, color: 'text-violet-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Agent cards ─────────────────────────────────────────────────────── */}
      {loading && agents.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-10">Loading agents…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => {
            const dot = statusDot(agent);
            const rate = agent.calls_today > 0
              ? Math.round((agent.connected_today / agent.calls_today) * 100)
              : null;
            const dispositionClass = agent.last_disposition
              ? (DISPOSITION_COLOR[agent.last_disposition] || 'bg-slate-900 text-slate-400')
              : '';

            return (
              <div
                key={agent.id}
                className="bg-slate-900/60 rounded-xl border border-slate-800 p-4"
              >
                {/* Avatar + status */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {(agent.full_name || agent.email || '?')[0].toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${dot.color}`}
                      title={dot.label}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {agent.full_name || '(No name)'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {agent.email || agent.role}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <p className="text-lg font-bold text-slate-100 leading-none">{agent.calls_today}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Calls</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-400 leading-none">{agent.connected_today}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Connected</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-400 leading-none">
                      {rate !== null ? `${rate}%` : '—'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Rate</p>
                  </div>
                </div>

                {/* Last activity */}
                <div className="border-t border-slate-800/60 pt-2 text-xs">
                  <p className="text-slate-500">{timeAgo(agent.last_call_at)}</p>
                  {agent.last_disposition && (
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${dispositionClass}`}>
                      {agent.last_disposition}
                    </span>
                  )}
                  {agent.last_campaign_name && (
                    <p className="mt-1 text-[10px] text-slate-500 truncate" title={agent.last_campaign_name}>
                      {agent.last_campaign_name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {agents.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No telecaller profiles found. Assign the &quot;telecaller&quot; or &quot;sales-executive&quot; role to team members to see them here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
