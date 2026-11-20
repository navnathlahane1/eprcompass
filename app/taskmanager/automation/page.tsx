'use client';

/**
 * /taskmanager/automation
 * Workflow Automation Rules — manage trigger-action automation.
 */
import { useEffect, useState, useCallback } from 'react';

interface Rule {
  id: string; name: string; description: string | null;
  is_active: boolean;
  trigger_source: string; trigger_event: string; trigger_params: Record<string, unknown>;
  action_type: string; action_params: Record<string, unknown>;
  last_triggered_at: string | null; trigger_count: number;
  created_by_name: string | null; created_at: string;
}
interface LogEntry {
  id: string; rule_id: string; rule_name: string;
  triggered_at: string; success: boolean; notes: string | null;
}
interface Summary { total: number; active: number; triggered_today: number }

const SRC_COLOR: Record<string, string> = {
  portal_task:     'bg-blue-500/15 text-blue-400',
  epr_task:        'bg-purple-500/15 text-purple-400',
  filing:          'bg-teal-500/15 text-teal-400',
  service_request: 'bg-amber-500/15 text-amber-400',
  escalation:      'bg-rose-500/15 text-rose-400',
  client:          'bg-emerald-500/15 text-emerald-400',
  system:          'bg-slate-700/40 text-slate-400',
};

const ACTION_COLOR: Record<string, string> = {
  create_escalation:  'bg-rose-500/15 text-rose-400',
  flag_client:        'bg-orange-500/15 text-orange-400',
  send_notification:  'bg-blue-500/15 text-blue-400',
  reassign_task:      'bg-purple-500/15 text-purple-400',
  create_portal_task: 'bg-teal-500/15 text-teal-400',
  update_priority:    'bg-amber-500/15 text-amber-400',
  log_note:           'bg-slate-700/40 text-slate-400',
};

function fmt(raw: string | null) {
  if (!raw) return '—';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AutomationPage() {
  const [rules,    setRules]    = useState<Rule[]>([]);
  const [log,      setLog]      = useState<LogEntry[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'rules' | 'log'>('rules');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/automation');
    if (res.ok) {
      const d = await res.json();
      setRules(d.rules ?? []);
      setLog(d.log ?? []);
      setSummary(d.summary ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleRule(rule: Rule) {
    setToggling(rule.id);
    try {
      await fetch('/api/taskmanager/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
      });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Workflow Automation Rules</h1>
          <p className="text-sm text-slate-400 mt-0.5">Trigger-action rules that automate compliance operations responses</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Rules',       v: summary.total,           color: 'text-slate-200' },
            { label: 'Active',            v: summary.active,          color: summary.active > 0 ? 'text-emerald-400' : 'text-slate-600' },
            { label: 'Triggered Today',   v: summary.triggered_today, color: summary.triggered_today > 0 ? 'text-orange-400' : 'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 text-center">
              <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex gap-3">
        <svg className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[11px] text-blue-300/80">
          Automation rules are evaluated by the compliance engine on each task update. New rules are created inactive by default — toggle them on once reviewed. Rules require database-level execution via the scheduled worker.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800/60">
        {(['rules', 'log'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold capitalize transition border-b-2 -mb-px ${tab === t ? 'border-orange-500 text-orange-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t === 'rules' ? `Rules (${rules.length})` : `Activity Log (${log.length})`}
          </button>
        ))}
      </div>

      {/* Rules tab */}
      {tab === 'rules' && (
        <>
          {loading && <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

          {!loading && rules.length === 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">
              No automation rules found. Run the migration to seed default rules.
            </div>
          )}

          {!loading && rules.length > 0 && (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className={`rounded-xl border px-4 py-3 transition ${rule.is_active ? 'border-orange-500/20 bg-orange-500/3' : 'border-slate-800/60 bg-[#0c1022]'}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleRule(rule)}
                      disabled={toggling === rule.id}
                      className={`shrink-0 mt-0.5 relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${rule.is_active ? 'bg-orange-500' : 'bg-slate-700'}`}
                      aria-label={rule.is_active ? 'Deactivate rule' : 'Activate rule'}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${rule.is_active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold ${rule.is_active ? 'text-slate-100' : 'text-slate-400'}`}>{rule.name}</span>
                        {rule.is_active && <span className="text-[10px] rounded px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 font-semibold">Active</span>}
                      </div>
                      {rule.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">{rule.description}</p>
                      )}
                      {/* Trigger → Action */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600 font-medium">WHEN</span>
                        <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${SRC_COLOR[rule.trigger_source] ?? 'bg-slate-700/40 text-slate-400'}`}>
                          {fmt(rule.trigger_source)}
                        </span>
                        <span className="text-[10px] text-slate-600">→</span>
                        <span className="text-[10px] rounded px-1.5 py-0.5 bg-slate-700/30 text-slate-400 font-medium">
                          {fmt(rule.trigger_event)}
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium ml-2">DO</span>
                        <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${ACTION_COLOR[rule.action_type] ?? 'bg-slate-700/40 text-slate-400'}`}>
                          {fmt(rule.action_type)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold tabular-nums text-slate-400">{rule.trigger_count}</p>
                      <p className="text-[9px] text-slate-600">fires</p>
                      {rule.last_triggered_at && (
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Last: {new Date(rule.last_triggered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Log tab */}
      {tab === 'log' && (
        <>
          {loading && <div className="space-y-1">{[...Array(10)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-800/50 animate-pulse" />)}</div>}

          {!loading && log.length === 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center text-sm text-slate-600">No automation activity yet.</div>
          )}

          {!loading && log.length > 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
              {log.map(entry => (
                <div key={entry.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${entry.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-[11px] font-semibold text-slate-300 flex-1 min-w-0 truncate">{entry.rule_name}</span>
                  {entry.notes && <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{entry.notes}</span>}
                  <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${entry.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {entry.success ? 'OK' : 'Failed'}
                  </span>
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {new Date(entry.triggered_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
