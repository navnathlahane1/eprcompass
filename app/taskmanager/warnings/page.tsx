'use client';

/**
 * /taskmanager/warnings
 * Early Warning System — real-time, auto-refreshing alert centre.
 *
 * Severity tiers:
 *   🔴 CRITICAL  — already overdue
 *   🟠 URGENT    — due within 4 hours
 *   🟡 WARNING   — due today (after 4h window)
 *   🔵 AT RISK   — due tomorrow
 *   ⚪ STALE     — service requests with no update in 48h
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = 'critical' | 'urgent' | 'warning' | 'at_risk' | 'stale';
type Source = 'portal_task' | 'epr_task' | 'filing' | 'service_request';

interface Warning {
  id:         string;
  source:     Source;
  tier:       Tier;
  title:      string;
  subtitle:   string;
  due_label:  string;
  href:       string;
  priority?:  string;
  raw_due:    string | null;
  extra?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<Tier, {
  label: string; bg: string; border: string; dot: string; text: string; icon: string; pulse?: boolean;
}> = {
  critical: {
    label: 'Critical / Overdue',
    bg:     'bg-rose-500/8',
    border: 'border-rose-500/30',
    dot:    'bg-rose-500',
    text:   'text-rose-400',
    icon:   'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    pulse:  true,
  },
  urgent: {
    label: 'Urgent (< 4 hours)',
    bg:     'bg-orange-500/8',
    border: 'border-orange-500/25',
    dot:    'bg-orange-500',
    text:   'text-orange-400',
    icon:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    label: 'Due Today',
    bg:     'bg-amber-500/8',
    border: 'border-amber-500/25',
    dot:    'bg-amber-500',
    text:   'text-amber-400',
    icon:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  at_risk: {
    label: 'At Risk (Tomorrow)',
    bg:     'bg-yellow-500/8',
    border: 'border-yellow-500/20',
    dot:    'bg-yellow-500',
    text:   'text-yellow-400',
    icon:   'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  stale: {
    label: 'Stale / No Activity (48h+)',
    bg:     'bg-slate-700/20',
    border: 'border-slate-700/40',
    dot:    'bg-slate-500',
    text:   'text-slate-400',
    icon:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

const SOURCE_LABEL: Record<Source, string> = {
  portal_task:     'Operational',
  epr_task:        'EPR Task',
  filing:          'Filing SLA',
  service_request: 'Service Request',
};

const SOURCE_COLOR: Record<Source, string> = {
  portal_task:     'bg-teal-500/15 text-teal-300 border-teal-500/20',
  epr_task:        'bg-violet-500/15 text-violet-300 border-violet-500/20',
  filing:          'bg-blue-500/15 text-blue-300 border-blue-500/20',
  service_request: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-rose-400', high: 'text-amber-400', normal: 'text-slate-400',
  critical: 'text-rose-400', low: 'text-slate-500',
};

function addHours(h: number) { return new Date(Date.now() + h * 3_600_000).toISOString(); }

function fmtDue(iso: string | null): string {
  if (!iso) return '—';
  const d   = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 0)    return `${Math.abs(mins)}m overdue`;
  if (mins < 60)   return `in ${mins}m`;
  if (mins < 1440) return `in ${Math.round(mins / 60)}h ${mins % 60}m`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WarningsPage() {
  const [warnings, setWarnings]   = useState<Warning[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter, setFilter]       = useState<Tier | 'all'>('all');
  const [filterSource, setFilterSource] = useState<Source | 'all'>('all');
  const [autoRefresh, setAutoRefresh]   = useState(true);

  // Escalation / note state
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateSeverity, setEscalateSeverity] = useState<'critical'|'high'|'medium'>('high');
  const [escalateLoading, setEscalateLoading] = useState(false);
  const [escalateMsg, setEscalateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const buildWarnings = useCallback(async () => {
    setLoading(true);
    try {
      const now   = new Date().toISOString();
      const in4h  = addHours(4);
      const in24h = addHours(24);
      const in48h = addHours(48);
      const today = now.split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const [ptRes, eprRes, filRes, srRes] = await Promise.all([
        fetch('/api/taskmanager/portal-tasks'),
        fetch('/api/manager/epr-tasks/overview?fy=2026-27&tasks=1'),
        fetch('/api/taskmanager/filings'),
        fetch('/api/admin/service-requests?status=Submitted&limit=100').catch(() => ({ ok: false })),
      ]);

      const ptData  = ptRes.ok  ? await ptRes.json()  : {};
      const eprData = eprRes.ok ? await eprRes.json() : {};
      const filData = filRes.ok ? await filRes.json() : {};
      const srData  = (srRes as Response).ok ? await (srRes as Response).json().catch(() => ({})) : {};

      const list: Warning[] = [];

      // ── Portal tasks ─────────────────────────────────────────────────────
      for (const t of (ptData.tasks ?? []) as any[]) {
        if (['completed','cancelled'].includes(t.status)) continue;
        let tier: Tier | null = null;
        if (t.due_at < now)                                tier = 'critical';
        else if (t.due_at < in4h)                          tier = 'urgent';
        else if (t.due_at.startsWith(today))               tier = 'warning';
        else if (t.due_at.startsWith(tomorrow))            tier = 'at_risk';
        if (!tier) continue;
        list.push({
          id:        `pt-${t.id}`,
          source:    'portal_task',
          tier,
          title:     t.title,
          subtitle:  t.assignee_name ? `Assigned to ${t.assignee_name}` : 'Unassigned',
          due_label: fmtDue(t.due_at),
          href:      '/taskmanager/tasks',
          priority:  t.priority,
          raw_due:   t.due_at,
          extra:     t.task_type,
        });
      }

      // ── EPR tasks ─────────────────────────────────────────────────────────
      for (const t of (eprData.tasks ?? []) as any[]) {
        if (['completed','skipped','na'].includes(t.status)) continue;
        let tier: Tier | null = null;
        if (t.status === 'overdue')         tier = 'critical';
        else if (t.due_date === today)      tier = 'warning';
        else if (t.due_date === tomorrow)   tier = 'at_risk';
        if (!tier) continue;
        list.push({
          id:        `epr-${t.id}`,
          source:    'epr_task',
          tier,
          title:     t.task_name,
          subtitle:  `${t.client_name} · ${t.waste_category}`,
          due_label: tier === 'critical' ? 'Overdue' : `Due ${t.due_date}`,
          href:      '/taskmanager/epr-tasks',
          priority:  t.priority,
          raw_due:   `${t.due_date}T00:00:00`,
        });
      }

      // ── Filing SLAs ───────────────────────────────────────────────────────
      for (const f of (filData.filings ?? []) as any[]) {
        const tier = f.sla_tier;
        if (!['critical','urgent','warning','at_risk'].includes(tier)) continue;
        list.push({
          id:        `fil-${f.id}`,
          source:    'filing',
          tier:      tier as Tier,
          title:     f.category,
          subtitle:  `${f.client_name} · ${f.current_status}${f.manager ? ` · Manager: ${f.manager.name}` : ''}`,
          due_label: fmtDue(f.sla_due_at),
          href:      '/taskmanager/filings',
          raw_due:   f.sla_due_at,
        });
      }

      // ── Service requests ──────────────────────────────────────────────────
      for (const s of (srData.requests ?? []) as any[]) {
        if (!['Submitted','Under Review'].includes(s.status)) continue;
        const lastUpdate = s.updated_at || s.created_at;
        if (lastUpdate >= in48h) continue; // not stale yet
        list.push({
          id:        `sr-${s.id}`,
          source:    'service_request',
          tier:      'stale',
          title:     s.category || s.subject || 'Service Request',
          subtitle:  `${s.status} · no activity for ${Math.round((Date.now() - new Date(lastUpdate).getTime()) / 3600000)}h`,
          due_label: 'Stale',
          href:      '/taskmanager/tasks',
          priority:  s.priority,
          raw_due:   null,
        });
      }

      // Sort: critical first, then by raw_due ascending
      list.sort((a, b) => {
        const tierOrder: Record<string, number> = { critical: 0, urgent: 1, warning: 2, at_risk: 3, stale: 4 };
        const td = (tierOrder[a.tier] ?? 5) - (tierOrder[b.tier] ?? 5);
        if (td !== 0) return td;
        if (!a.raw_due && !b.raw_due) return 0;
        if (!a.raw_due) return 1;
        if (!b.raw_due) return -1;
        return a.raw_due.localeCompare(b.raw_due);
      });

      setWarnings(list);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { buildWarnings(); }, [buildWarnings]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(buildWarnings, 60_000);
    return () => clearInterval(id);
  }, [autoRefresh, buildWarnings]);

  const displayed = warnings.filter(w => {
    if (filter !== 'all' && w.tier !== filter) return false;
    if (filterSource !== 'all' && w.source !== filterSource) return false;
    return true;
  });

  const counts: Record<Tier, number> = { critical: 0, urgent: 0, warning: 0, at_risk: 0, stale: 0 };
  for (const w of warnings) counts[w.tier] = (counts[w.tier] || 0) + 1;

  async function submitEscalation(warning: Warning) {
    if (!escalateReason.trim()) return;
    setEscalateLoading(true);
    const res = await fetch('/api/taskmanager/notes?action=escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_source: warning.source,
        task_id:     warning.id.replace(/^(pt|epr|fil|sr)-/, ''),
        reason:      escalateReason,
        severity:    escalateSeverity,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setEscalateMsg(res.ok ? { ok: true, text: 'Escalation created.' } : { ok: false, text: d.error || 'Failed.' });
    setEscalateLoading(false);
    if (res.ok) { setEscalatingId(null); setEscalateReason(''); }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <svg className="h-5 w-5 text-orange-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Early Warning System
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-orange-500" />
            Auto-refresh (60s)
          </label>
          <button onClick={buildWarnings} disabled={loading}
            className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
            {loading ? 'Refreshing…' : '↺ Refresh'}
          </button>
        </div>
      </div>

      {/* Tier summary pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'critical', 'urgent', 'warning', 'at_risk', 'stale'] as const).map(t => {
          const count = t === 'all' ? warnings.length : counts[t as Tier] || 0;
          const cfg   = t !== 'all' ? TIER_CONFIG[t as Tier] : null;
          const active = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-medium transition border ${
                active
                  ? (cfg ? `${cfg.bg} ${cfg.border} ${cfg.text}` : 'bg-slate-700/60 border-slate-600 text-slate-200')
                  : 'bg-transparent border-slate-700/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              {cfg && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />}
              {t === 'all' ? 'All' : TIER_CONFIG[t as Tier]?.label}
              <span className={`ml-0.5 font-bold ${active ? '' : 'text-slate-600'}`}>{count}</span>
            </button>
          );
        })}

        <div className="ml-auto">
          <select value={filterSource} onChange={e => setFilterSource(e.target.value as any)}
            className="h-7 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 focus:outline-none">
            <option value="all">All Sources</option>
            <option value="portal_task">Operational Tasks</option>
            <option value="epr_task">EPR Tasks</option>
            <option value="filing">Filing SLAs</option>
            <option value="service_request">Service Requests</option>
          </select>
        </div>
      </div>

      {/* Escalation feedback */}
      {escalateMsg && (
        <div className={`rounded-lg border px-4 py-2.5 text-xs flex items-center justify-between ${escalateMsg.ok ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : 'border-rose-500/30 bg-rose-500/5 text-rose-300'}`}>
          <span>{escalateMsg.text}</span>
          <button onClick={() => setEscalateMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && displayed.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-16 text-center">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-base font-semibold text-emerald-400">All Clear</p>
          <p className="text-sm text-slate-600 mt-1">No {filter !== 'all' ? TIER_CONFIG[filter as Tier]?.label.toLowerCase() : ''} warnings at this time.</p>
        </div>
      )}

      {/* Warning list — grouped by tier */}
      {!loading && displayed.length > 0 && (() => {
        const tierOrder: Tier[] = ['critical','urgent','warning','at_risk','stale'];
        const groups = tierOrder
          .map(t => ({ tier: t, items: displayed.filter(w => w.tier === t) }))
          .filter(g => g.items.length > 0);

        return (
          <div className="space-y-4">
            {groups.map(({ tier, items }) => {
              const cfg = TIER_CONFIG[tier];
              return (
                <div key={tier} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
                  {/* Group header */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 ${cfg.bg} border-b ${cfg.border}`}>
                    <span className={`h-2 w-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${cfg.text}`} fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                    </svg>
                    <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                    <span className={`ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${cfg.dot}`}>
                      {items.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="bg-[#0c1022] divide-y divide-slate-800/40">
                    {items.map(w => (
                      <div key={w.id}>
                        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                          {/* Source chip */}
                          <span className={`shrink-0 text-[10px] font-medium border rounded px-1.5 py-0.5 ${SOURCE_COLOR[w.source]}`}>
                            {SOURCE_LABEL[w.source]}
                          </span>

                          {/* Title + subtitle */}
                          <div className="min-w-0 flex-1">
                            <Link href={w.href} className={`text-xs font-medium hover:underline ${w.tier === 'critical' ? 'text-rose-200' : 'text-slate-200'}`}>
                              {w.title}
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{w.subtitle}</p>
                          </div>

                          {/* Priority */}
                          {w.priority && (
                            <span className={`hidden sm:block shrink-0 text-[10px] font-medium capitalize ${PRIORITY_COLOR[w.priority] ?? 'text-slate-400'}`}>
                              ● {w.priority}
                            </span>
                          )}

                          {/* Due */}
                          <span className={`shrink-0 text-[11px] font-semibold tabular-nums ${cfg.text}`}>
                            {w.due_label}
                          </span>

                          {/* Escalate button */}
                          <button
                            onClick={() => { setEscalatingId(escalatingId === w.id ? null : w.id); setEscalateReason(''); setEscalateMsg(null); }}
                            className="shrink-0 h-6 px-2 rounded border border-orange-500/30 text-[10px] text-orange-400 hover:bg-orange-500/10 transition"
                          >
                            ⚑ Escalate
                          </button>
                        </div>

                        {/* Escalation form */}
                        {escalatingId === w.id && (
                          <div className="px-4 pb-3 pt-1 bg-slate-900/40 border-t border-slate-800/40 space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={escalateSeverity}
                                onChange={e => setEscalateSeverity(e.target.value as any)}
                                className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 shrink-0"
                              >
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                              </select>
                              <input
                                type="text"
                                value={escalateReason}
                                onChange={e => setEscalateReason(e.target.value)}
                                placeholder="Reason for escalation…"
                                className="flex-1 h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <button
                                onClick={() => submitEscalation(w)}
                                disabled={!escalateReason.trim() || escalateLoading}
                                className="shrink-0 h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-[11px] font-medium text-white disabled:opacity-50 transition"
                              >
                                {escalateLoading ? 'Saving…' : 'Submit'}
                              </button>
                              <button onClick={() => setEscalatingId(null)} className="shrink-0 h-8 px-2 text-[11px] text-slate-500 hover:text-slate-300">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      <p className="text-[10px] text-slate-700 text-center pb-2">
        Auto-refreshes every 60 seconds · All times in IST
      </p>
    </div>
  );
}
