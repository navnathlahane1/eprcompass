'use client';

import { useState } from 'react';

interface AgentStat {
  agent_id: string;
  name: string;
  calls: number;
  connected: number;
  conversions: number;
  contact_rate: number;
}

interface AgentLeaderboardProps {
  agents: AgentStat[];
}

type SortKey = 'calls' | 'contact_rate' | 'conversions';

export default function AgentLeaderboard({ agents }: AgentLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortKey>('calls');

  const sorted = [...agents].sort((a, b) => b[sortBy] - a[sortBy]);

  function SortButton({ field, label }: { field: SortKey; label: string }) {
    return (
      <button
        onClick={() => setSortBy(field)}
        className={`text-xs px-2 py-1 rounded ${sortBy === field ? 'bg-teal-500/15 text-teal-300' : 'text-slate-400 hover:text-slate-300'}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Agent Leaderboard</h3>
        <div className="flex gap-1">
          <SortButton field="calls" label="Calls" />
          <SortButton field="contact_rate" label="Contact Rate" />
          <SortButton field="conversions" label="Conversions" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-700/60">
              <th className="text-left py-2 font-medium">#</th>
              <th className="text-left py-2 font-medium">Agent</th>
              <th className="text-right py-2 font-medium">Calls</th>
              <th className="text-right py-2 font-medium">Contact Rate</th>
              <th className="text-right py-2 font-medium">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((agent, i) => (
              <tr key={agent.agent_id} className="border-b border-slate-800 last:border-0">
                <td className="py-2 text-slate-500">{i + 1}</td>
                <td className="py-2 font-medium text-slate-100">{agent.name}</td>
                <td className="py-2 text-right text-slate-300">{agent.calls}</td>
                <td className="py-2 text-right">
                  <span className={`font-medium ${agent.contact_rate >= 50 ? 'text-green-600' : agent.contact_rate >= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {agent.contact_rate}%
                  </span>
                </td>
                <td className="py-2 text-right text-slate-300">{agent.conversions}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-sm text-slate-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
