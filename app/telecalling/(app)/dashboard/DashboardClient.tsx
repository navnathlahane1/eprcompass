'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TelecallingKPICard from '@/components/telecalling/TelecallingKPICard';
import DailyTargetBoard from '@/components/telecalling/DailyTargetBoard';
import ConversionFunnel from '@/components/telecalling/ConversionFunnel';
import TourTarget from '@/components/portal/tour/TourTarget';

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const DISPOSITION_BADGE: Record<string, { label: string; cls: string }> = {
  'Interested':     { label: 'Interested',     cls: 'bg-green-500/15 text-green-300' },
  'Call Back':      { label: 'Call Back',       cls: 'bg-blue-500/15 text-blue-300' },
  'Not Interested': { label: 'Not Interested',  cls: 'bg-slate-500/15 text-slate-400' },
  'Wrong Number':   { label: 'Wrong Number',    cls: 'bg-orange-500/15 text-orange-300' },
  'No Answer':      { label: 'No Answer',       cls: 'bg-red-500/15 text-red-300' },
  'Busy':           { label: 'Busy',            cls: 'bg-amber-500/15 text-amber-300' },
  'Voicemail':      { label: 'Voicemail',       cls: 'bg-purple-500/15 text-purple-300' },
};

interface Props {
  todayCallCount: number;
  connectedCalls: number;
  notRespondedCalls: number;
  contactRate: number;
  recentCalls: any[];
  pendingFollowups: any[];
  overdueCount: number;
  dailyTarget?: number;
  streak?: number;
}

export default function DashboardClient({
  todayCallCount,
  connectedCalls,
  notRespondedCalls,
  contactRate,
  recentCalls,
  pendingFollowups,
  overdueCount,
  dailyTarget = 40,
  streak = 0,
}: Props) {
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [funnelPeriod, setFunnelPeriod] = useState('30d');

  useEffect(() => {
    fetch(`/api/telecalling/funnel?period=${funnelPeriod}`)
      .then(r => r.json())
      .then(d => setFunnelData(d.stages || []));
  }, [funnelPeriod]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">My Dashboard</h1>

      {/* Overdue follow-up alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-700/60 bg-red-950/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              {overdueCount} follow-up{overdueCount > 1 ? 's' : ''} overdue
            </p>
            <p className="text-xs text-red-400/70">These leads are waiting — call them now before they go cold.</p>
          </div>
          <a href="/telecalling/followups" className="shrink-0 rounded-lg bg-red-700/40 hover:bg-red-700/60 px-3 py-1.5 text-xs font-semibold text-red-200 transition">
            View →
          </a>
        </div>
      )}

      {/* Daily Target Board */}
      <TourTarget id="dash-daily-target">
        <DailyTargetBoard
          todayCallCount={todayCallCount}
          connectedCalls={connectedCalls}
          notRespondedCalls={notRespondedCalls}
          contactRate={contactRate}
          pendingFollowupsCount={pendingFollowups.length}
          overdueCount={overdueCount}
          dailyTarget={dailyTarget}
          streak={streak}
        />
      </TourTarget>

      {/* KPI cards */}
      <TourTarget id="dash-kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TelecallingKPICard label="Calls Today" value={todayCallCount} />
        <TelecallingKPICard label="Connected" value={connectedCalls} />
        <TelecallingKPICard label="Not Responded" value={notRespondedCalls} sub={notRespondedCalls > 0 ? 'No answer / Busy / Voicemail' : undefined} />
        <TelecallingKPICard
          label="Pending Follow-ups"
          value={pendingFollowups.length}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
        />
      </TourTarget>

      <TourTarget id="dash-calls-followups" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Today */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Calls Today</h2>
            <Link href="/telecalling/calls" className="text-xs text-teal-400 hover:underline">View all</Link>
          </div>
          {recentCalls.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No calls logged today</div>
          ) : (
            <div className="space-y-2">
              {recentCalls.map((call: any) => {
                const badge = call.disposition ? DISPOSITION_BADGE[call.disposition] : null;
                return (
                  <div key={call.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {(call.lead as any)?.company_name || (call.lead as any)?.name || 'Unknown lead'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{fmtDuration(call.duration_seconds || 0)}</span>
                        {badge && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${badge.cls}`}>{badge.label}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{fmtRelative(call.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Upcoming Follow-ups</h2>
            <Link href="/telecalling/followups" className="text-xs text-teal-400 hover:underline">View all</Link>
          </div>
          {pendingFollowups.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No pending follow-ups</div>
          ) : (
            <div className="space-y-2">
              {pendingFollowups.map((f: any) => {
                const isOverdue = new Date(f.scheduled_for) < new Date();
                return (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        <Link href={`/telecalling/leads/${(f.lead as any)?.id}`} className="hover:text-teal-400">
                          {(f.lead as any)?.company_name || (f.lead as any)?.name || 'Unknown lead'}
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500">{f.type}{f.notes ? ` · ${f.notes}` : ''}</div>
                    </div>
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                      {new Date(f.scheduled_for).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </TourTarget>

      {/* Conversion Funnel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-200">Conversion Funnel</h2>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFunnelPeriod(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${funnelPeriod === p ? 'bg-teal-500/20 border border-teal-500/40 text-teal-200' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ConversionFunnel stages={funnelData} period={funnelPeriod} />
      </div>
    </div>
  );
}
