'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type PulseRow = {
  waste_category: string;
  state: string;
  notices_last_30d: number;
  notices_prior_30d: number;
  penalty_inr_last_30d: number;
  penalty_inr_prior_30d: number;
  penalty_velocity_wow_ratio: number;
};

type Deadline = {
  id: string;
  company_name: string | null;
  company_state: string | null;
  notice_type: string;
  authority: string;
  waste_category: string;
  notice_date: string;
  deadline_date: string;
  days_to_deadline: number;
  penalty_inr: number;
  shortfall_mt: number;
  violation_summary: string;
};

type Alert = {
  id: string;
  slug: string;
  title: string;
  epr_type: string;
  published_date: string;
  compliance_deadline: string;
  days_to_deadline: number;
  ai_summary: string;
  applicable_states: string[];
};

function formatInr(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function VelocityBadge({ ratio }: { ratio: number }) {
  const r = Number(ratio || 0);
  if (r > 2) return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300"><svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.8 4.2 9 7 9.5 9.5 7.4 8.2 6.5 5.8 6.5 5.8 4.5 8.2 4 11 5 13.5c.8 2 2.3 3.5 4 4.3V20h6v-2.2c1.7-.8 3.2-2.3 4-4.3 1-2.5.5-5.3-1.5-7.7 0 0-.9 2.4-3 3.7C15 7 14.2 4.2 12 2z"/></svg>{r.toFixed(1)}×</span>;
  if (r > 1.2) return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">↑ {r.toFixed(1)}×</span>;
  if (r < 0.8) return <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300">↓ {r.toFixed(1)}×</span>;
  return <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-400">≈ {r.toFixed(1)}×</span>;
}

export default function RadarPage() {
  const [pulse, setPulse] = useState<PulseRow[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState({ total_penalty_30d: 0, total_notices_30d: 0, hot_segments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/radar`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      setPulse(data.pulse || []);
      setDeadlines(data.upcoming_deadlines || []);
      setAlerts(data.regulatory_alerts || []);
      setSummary(data.summary || {});
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Radar</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-rose-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Regulatory Radar</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              30-day rolling penalty velocity by segment, upcoming compliance deadlines, and regulatory alerts from CPCB &amp; MoEF&amp;CC.
            </p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh
          </button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">{error}</p>}

        {/* KPI strip */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-rose-400" />
            <p className="text-[10px] uppercase tracking-widest text-rose-400">Penalty Pressure (30d)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-rose-100">{loading ? '—' : formatInr(summary.total_penalty_30d)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-slate-400" />
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Notices Issued (30d)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100">{loading ? '—' : summary.total_notices_30d}</p>
          </div>
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-amber-400" />
            <p className="text-[10px] uppercase tracking-widest text-amber-400">Hot Segments (velocity &gt;1.5×)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-100">{loading ? '—' : summary.hot_segments}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Penalty pulse heat table */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-7">
            <h2 className="mb-4 text-sm font-semibold text-rose-300">Penalty Velocity Heat (30d vs prior 30d)</h2>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : pulse.length === 0 ? (
              <div className="py-6 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm text-slate-500">No penalty data yet. Ingest notices to populate.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="py-2 pr-3 text-left">Segment</th>
                      <th className="py-2 pr-3 text-right">30d Penalty</th>
                      <th className="py-2 pr-3 text-right">Notices</th>
                      <th className="py-2 text-right">Velocity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pulse.map((r, i) => (
                      <tr key={i} className="border-b border-slate-900/80">
                        <td className="py-2 pr-3">
                          <p className="font-semibold text-slate-100">{r.waste_category || '—'}</p>
                          <p className="text-slate-500">{r.state || 'All India'}</p>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-200">{formatInr(r.penalty_inr_last_30d)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{r.notices_last_30d}</td>
                        <td className="py-2 text-right"><VelocityBadge ratio={r.penalty_velocity_wow_ratio} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-4 lg:col-span-5">
            {/* Upcoming deadlines */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-3 text-sm font-semibold text-amber-300">Pipeline Deadlines</h2>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
                </div>
              ) : deadlines.length === 0 ? (
                <div className="py-4 text-center">
                  <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p className="mt-2 text-sm text-slate-500">No upcoming deadlines from known companies.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deadlines.slice(0, 8).map(d => (
                    <div key={d.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-100">{d.company_name || '—'}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{d.authority} · {d.waste_category}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${d.days_to_deadline <= 14 ? 'bg-rose-500/20 text-rose-300' : d.days_to_deadline <= 30 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                          {d.days_to_deadline}d
                        </span>
                      </div>
                      {d.penalty_inr > 0 && <p className="mt-1 text-[10px] tabular-nums text-rose-400">Penalty: {formatInr(d.penalty_inr)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Regulatory alerts */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-300">Regulatory Alerts</h2>
                <Link href="/notifications" className="text-[10px] text-slate-400 hover:text-cyan-300">All notifications →</Link>
              </div>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-4 text-center">
                  <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p className="mt-2 text-sm text-slate-500">No upcoming regulatory deadlines.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map(a => (
                    <div key={a.id} className="rounded-lg border border-cyan-800/30 bg-cyan-950/10 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-100">{a.title}</p>
                        <span className="shrink-0 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{a.days_to_deadline}d</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">{a.epr_type} · Due {a.compliance_deadline}</p>
                      {a.ai_summary && <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">{a.ai_summary}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </div>
    </div>
  );
}
