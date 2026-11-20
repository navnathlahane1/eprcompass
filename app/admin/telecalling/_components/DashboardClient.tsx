'use client';

import TelecallingKPICard from '@/components/telecalling/TelecallingKPICard';
import FollowupWidget from '@/components/telecalling/FollowupWidget';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  data: {
    kpis: { calls_today: number; connected_today: number; contact_rate: number; pending_followups: number };
    followups: any[];
    recentCalls: any[];
    activeCampaigns: any[];
  };
}

export default function DashboardClient({ data }: Props) {
  const { kpis, followups, recentCalls, activeCampaigns } = data;
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Telecalling Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Today&apos;s activity at a glance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TelecallingKPICard label="Calls Today" value={kpis.calls_today} />
        <TelecallingKPICard label="Connected" value={kpis.connected_today} />
        <TelecallingKPICard label="Contact Rate" value={`${kpis.contact_rate}%`} />
        <TelecallingKPICard label="Pending Follow-ups" value={kpis.pending_followups} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming followups */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-100">Upcoming Follow-ups</h2>
            <Link href="/admin/telecalling/followups" className="text-xs text-blue-400 hover:underline">View all</Link>
          </div>
          {followups.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No follow-ups due</p>
          ) : (
            <div className="space-y-3">
              {followups.map((f: any) => (
                <FollowupWidget key={f.id} followup={f} onUpdate={() => router.refresh()} />
              ))}
            </div>
          )}
        </div>

        {/* Recent calls */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-100">Recent Calls</h2>
            <Link href="/admin/telecalling/calls" className="text-xs text-blue-400 hover:underline">View all</Link>
          </div>
          {recentCalls.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No calls yet today</p>
          ) : (
            <div className="space-y-2">
              {recentCalls.map((call: any) => (
                <div key={call.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-800/60 last:border-0">
                  <div>
                    <span className="font-medium text-slate-100">{call.lead?.company || 'Unknown'}</span>
                    {call.agent?.full_name && <span className="text-xs text-slate-500 ml-2">by {call.agent.full_name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {call.disposition && <span className="text-xs text-slate-500">{call.disposition}</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${call.status === 'Completed' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-900 text-slate-500'}`}>
                      {call.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-100">Active Campaigns</h2>
            <Link href="/admin/telecalling/campaigns" className="text-xs text-blue-400 hover:underline">View all</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCampaigns.map((c: any) => (
              <Link key={c.id} href={`/admin/telecalling/campaigns/${c.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/30 text-emerald-300 rounded-full text-sm border border-emerald-800/40 hover:bg-emerald-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
