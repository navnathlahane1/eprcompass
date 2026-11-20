'use client';

/**
 * /manager/epr-tasks
 *
 * Cross-client EPR Compliance Task Hub for the manager.
 *
 * Features:
 *  - Overall stats across all assigned clients (FY 2026-27)
 *  - Per-client progress cards with individual "Generate" / "Regenerate"
 *  - Bulk generate / bulk regenerate for all clients at once
 *  - Full task list with filters: client, category, status, priority, free text
 *  - Inline task status + notes update (manager permissions)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientSummary {
  id: string;
  name: string;
  waste_categories: string[];
  has_tasks: boolean;
  summary: Stats;
}

interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  skipped: number;
}

interface EprTask {
  id: string;
  client_id: string;
  client_name: string;
  waste_category: string;
  task_name: string;
  description: string | null;
  frequency: string;
  due_date: string;
  period_label: string;
  status: string;
  priority: string;
  responsible_dept: string | null;
  notes: string | null;
  sort_order: number;
}

interface BulkResult {
  clientId: string;
  clientName: string;
  created: number;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  plastic:    'Plastic Waste',
  ewaste:     'E-Waste',
  battery:    'Battery Waste',
  tyre:       'Tyre Waste',
  used_oil:   'Used Oil',
  hazardous:  'Hazardous Waste',
  cd_waste:   'C&D Waste',
  governance: 'Governance',
};

const CATEGORY_CHIP: Record<string, string> = {
  plastic:    'text-blue-400 border-blue-500/25 bg-blue-500/8',
  ewaste:     'text-violet-400 border-violet-500/25 bg-violet-500/8',
  battery:    'text-amber-400 border-amber-500/25 bg-amber-500/8',
  tyre:       'text-orange-400 border-orange-500/25 bg-orange-500/8',
  used_oil:   'text-yellow-400 border-yellow-500/25 bg-yellow-500/8',
  hazardous:  'text-rose-400 border-rose-500/25 bg-rose-500/8',
  cd_waste:   'text-stone-400 border-stone-500/25 bg-stone-500/8',
  governance: 'text-teal-400 border-teal-500/25 bg-teal-500/8',
};

const STATUS_CHIP: Record<string, string> = {
  pending:     'bg-slate-700/50 text-slate-400',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed:   'bg-emerald-500/20 text-emerald-300',
  overdue:     'bg-rose-500/20 text-rose-300',
  skipped:     'bg-slate-600/40 text-slate-500',
  na:          'bg-slate-700/30 text-slate-600',
};

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-rose-400',
  high:     'bg-amber-400',
  medium:   'bg-blue-400',
  low:      'bg-slate-600',
  normal:   'bg-slate-600',
};

const PRIORITY_TEXT: Record<string, string> = {
  critical: 'text-rose-400',
  high:     'text-amber-400',
  medium:   'text-blue-400',
  low:      'text-slate-500',
  normal:   'text-slate-500',
};

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'skipped',     label: 'Skipped' },
  { value: 'na',          label: 'N/A' },
];

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function statusLabel(s: string) {
  if (s === 'in_progress') return 'In Progress';
  if (s === 'na') return 'N/A';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManagerEprTasksPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [loading, setLoading]             = useState(true);
  const [overallSummary, setOverallSummary] = useState<Stats | null>(null);
  const [clients, setClients]             = useState<ClientSummary[]>([]);
  const [tasks, setTasks]                 = useState<EprTask[]>([]);

  // ── Bulk generate state ─────────────────────────────────────────────────────
  const [bulkGenerating, setBulkGenerating]       = useState(false);
  const [bulkResults, setBulkResults]             = useState<BulkResult[] | null>(null);
  const [bulkMsg, setBulkMsg]                     = useState<{ ok: boolean; text: string } | null>(null);
  const [showBulkResultDetails, setShowBulkResultDetails] = useState(false);

  // ── Per-client generate state ───────────────────────────────────────────────
  const [generatingClient, setGeneratingClient]   = useState<string | null>(null);
  const [clientGenMsg, setClientGenMsg]           = useState<{ clientId: string; ok: boolean; text: string } | null>(null);

  // ── Inline task-update state ────────────────────────────────────────────────
  const [expandedTask, setExpandedTask]   = useState<string | null>(null);
  const [editStatus, setEditStatus]       = useState('');
  const [editNote, setEditNote]           = useState('');
  const [savingTask, setSavingTask]       = useState<string | null>(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterClient,   setFilterClient]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSearch,   setFilterSearch]   = useState('');

  // ── View ────────────────────────────────────────────────────────────────────
  const [view, setView] = useState<'clients' | 'tasks'>('clients');

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/manager/epr-tasks/overview?fy=2026-27&tasks=1');
    if (res.ok) {
      const d = await res.json();
      setOverallSummary(d.summary ?? null);
      setClients(d.clients ?? []);
      setTasks(d.tasks ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered task list ───────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let ts = tasks;
    if (filterClient)   ts = ts.filter(t => t.client_id === filterClient);
    if (filterCategory) ts = ts.filter(t => t.waste_category === filterCategory);
    if (filterStatus)   ts = ts.filter(t => t.status === filterStatus);
    if (filterPriority) ts = ts.filter(t => t.priority === filterPriority);
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      ts = ts.filter(t =>
        t.task_name.toLowerCase().includes(q) ||
        (t.client_name ?? '').toLowerCase().includes(q) ||
        (t.responsible_dept ?? '').toLowerCase().includes(q)
      );
    }
    return ts;
  }, [tasks, filterClient, filterCategory, filterStatus, filterPriority, filterSearch]);

  // ── Bulk generate ────────────────────────────────────────────────────────────
  async function bulkGenerate(overwrite: boolean) {
    setBulkGenerating(true);
    setBulkMsg(null);
    setBulkResults(null);
    setShowBulkResultDetails(false);

    const res = await fetch('/api/manager/epr-tasks/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fy: '2026-27', overwrite }),
    });
    const d = await res.json().catch(() => ({}));

    if (res.ok) {
      setBulkMsg({ ok: true, text: d.message ?? `Generated ${d.total_created} tasks.` });
      setBulkResults(d.results ?? null);
      await load(); // refresh data
    } else {
      setBulkMsg({ ok: false, text: d.error ?? 'Bulk generation failed.' });
    }
    setBulkGenerating(false);
  }

  // ── Per-client generate ──────────────────────────────────────────────────────
  async function generateForClient(clientId: string, overwrite: boolean) {
    setGeneratingClient(clientId);
    setClientGenMsg(null);

    const res = await fetch('/api/manager/epr-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, fy: '2026-27', overwrite }),
    });
    const d = await res.json().catch(() => ({}));

    if (res.ok) {
      setClientGenMsg({ clientId, ok: true, text: d.message ?? `Generated ${d.created} tasks.` });
      await load();
    } else {
      setClientGenMsg({ clientId, ok: false, text: d.error ?? 'Generation failed.' });
    }
    setGeneratingClient(null);
  }

  // ── Expand task row ──────────────────────────────────────────────────────────
  function toggleTask(task: EprTask) {
    if (expandedTask === task.id) {
      setExpandedTask(null); setEditStatus(''); setEditNote('');
    } else {
      setExpandedTask(task.id);
      setEditStatus(task.status);
      setEditNote(task.notes ?? '');
    }
  }

  // ── Save task update ─────────────────────────────────────────────────────────
  async function saveTask(taskId: string) {
    setSavingTask(taskId);
    const res = await fetch(`/api/portal/epr-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: editStatus, notes: editNote }),
    });
    if (res.ok) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: editStatus, notes: editNote } : t
      ));
      setExpandedTask(null); setEditStatus(''); setEditNote('');
    }
    setSavingTask(null);
  }

  // ── Unique categories/clients in task list for filter dropdowns ───────────────
  const availableCategories = useMemo(() =>
    [...new Set(tasks.map(t => t.waste_category))].sort(), [tasks]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">EPR Compliance Tasks</h1>
          <p className="text-sm text-slate-400 mt-0.5">FY 2026-27 · All assigned clients</p>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          {overallSummary && overallSummary.total > 0 && (
            <button
              onClick={() => bulkGenerate(true)}
              disabled={bulkGenerating}
              className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkGenerating ? 'Working…' : '↺ Regenerate All'}
            </button>
          )}
          {(!overallSummary || overallSummary.total === 0) && !loading && (
            <button
              onClick={() => bulkGenerate(false)}
              disabled={bulkGenerating}
              className="h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[12px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {bulkGenerating ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : '+ Generate All'}
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk result feedback ── */}
      {bulkMsg && (
        <div className={`rounded-lg border px-4 py-3 text-xs ${bulkMsg.ok ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : 'border-rose-500/30 bg-rose-500/5 text-rose-300'}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{bulkMsg.text}</span>
            <div className="flex items-center gap-3">
              {bulkResults && bulkResults.length > 0 && (
                <button
                  onClick={() => setShowBulkResultDetails(v => !v)}
                  className="opacity-70 hover:opacity-100 transition underline"
                >
                  {showBulkResultDetails ? 'Hide details' : 'Show details'}
                </button>
              )}
              <button onClick={() => { setBulkMsg(null); setBulkResults(null); }} className="opacity-60 hover:opacity-100">✕</button>
            </div>
          </div>
          {showBulkResultDetails && bulkResults && (
            <div className="mt-3 space-y-1.5 border-t border-current/20 pt-2">
              {bulkResults.map(r => (
                <div key={r.clientId} className="flex items-center justify-between">
                  <span className="text-slate-300">{r.clientName}</span>
                  <span className={r.error ? 'text-amber-400' : 'text-emerald-400'}>
                    {r.error ? `⚠ ${r.error}` : `✓ ${r.created} tasks`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-800/40 animate-pulse" />)}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Overall stats ── */}
          {overallSummary && overallSummary.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {([
                { label: 'Total Tasks',  val: overallSummary.total,       color: 'text-slate-200' },
                { label: 'Completed',    val: overallSummary.completed,   color: 'text-emerald-400' },
                { label: 'In Progress',  val: overallSummary.in_progress, color: 'text-blue-400' },
                { label: 'Pending',      val: overallSummary.pending,     color: 'text-slate-400' },
                { label: 'Overdue',      val: overallSummary.overdue,     color: 'text-rose-400' },
              ] as const).map(({ label, val, color }) => (
                <div key={label} className="rounded-lg border border-slate-800/60 bg-[#0c1022] px-3 py-2.5 text-center">
                  <div className={`text-xl font-bold tabular-nums ${color}`}>{val}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── View toggle ── */}
          {overallSummary && overallSummary.total > 0 && (
            <div className="flex gap-1 border-b border-slate-800/60">
              {(['clients', 'tasks'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition border-b-2 -mb-px ${
                    view === v
                      ? 'border-teal-400 text-teal-300'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {v === 'clients' ? `By Client (${clients.length})` : `All Tasks (${tasks.length})`}
                </button>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: BY CLIENT
          ══════════════════════════════════════════════ */}
          {(view === 'clients' || (overallSummary?.total === 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {clients.length === 0 && (
                <div className="col-span-full rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">No clients assigned to you yet.</p>
                </div>
              )}
              {clients.map(c => {
                const cMsg = clientGenMsg?.clientId === c.id ? clientGenMsg : null;
                const isGenerating = generatingClient === c.id;
                const pct = c.summary.total
                  ? Math.round((c.summary.completed / c.summary.total) * 100)
                  : 0;

                return (
                  <div key={c.id} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 space-y-3">
                    {/* Client name + link */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/manager/clients/${c.id}`}
                          className="text-sm font-semibold text-slate-100 hover:text-teal-300 transition truncate block"
                        >
                          {c.name}
                        </Link>
                        {c.waste_categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.waste_categories.slice(0, 4).map(cat => (
                              <span key={cat} className={`text-[9px] border rounded px-1 py-0.5 ${CATEGORY_CHIP[cat] ?? 'text-slate-500 border-slate-700'}`}>
                                {CATEGORY_LABELS[cat] ?? cat}
                              </span>
                            ))}
                            {c.waste_categories.length > 4 && (
                              <span className="text-[9px] text-slate-600">+{c.waste_categories.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Action button */}
                      {c.has_tasks ? (
                        <button
                          onClick={() => generateForClient(c.id, true)}
                          disabled={isGenerating}
                          title="Regenerate tasks (overwrites existing)"
                          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition disabled:opacity-50"
                        >
                          {isGenerating
                            ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                          }
                        </button>
                      ) : (
                        <button
                          onClick={() => generateForClient(c.id, false)}
                          disabled={isGenerating || !c.waste_categories.length}
                          title={c.waste_categories.length ? 'Generate tasks for FY 2026-27' : 'No waste categories assigned'}
                          className="shrink-0 h-7 px-2.5 flex items-center gap-1 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-[10px] font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? 'Generating…' : '+ Generate'}
                        </button>
                      )}
                    </div>

                    {/* Stats */}
                    {c.has_tasks ? (
                      <>
                        {/* Progress bar */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-slate-500">{c.summary.completed}/{c.summary.total} complete</span>
                            <span className={`font-medium ${pct === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500/70 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        {/* Mini stat chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {c.summary.in_progress > 0 && (
                            <span className="text-[10px] bg-blue-500/15 text-blue-300 rounded px-1.5 py-0.5">
                              {c.summary.in_progress} in progress
                            </span>
                          )}
                          {c.summary.overdue > 0 && (
                            <span className="text-[10px] bg-rose-500/15 text-rose-300 rounded px-1.5 py-0.5">
                              ⚠ {c.summary.overdue} overdue
                            </span>
                          )}
                          {c.summary.pending > 0 && (
                            <span className="text-[10px] bg-slate-700/50 text-slate-500 rounded px-1.5 py-0.5">
                              {c.summary.pending} pending
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic">
                        {c.waste_categories.length === 0
                          ? 'No waste categories — cannot generate tasks'
                          : 'No tasks generated yet for FY 2026-27'}
                      </p>
                    )}

                    {/* Per-client gen feedback */}
                    {cMsg && (
                      <p className={`text-[11px] ${cMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {cMsg.text}
                      </p>
                    )}

                    {/* View in client detail */}
                    <Link
                      href={`/manager/clients/${c.id}#epr_tasks`}
                      className="block text-center text-[11px] text-slate-600 hover:text-teal-400 transition border border-slate-800/60 rounded-lg py-1.5"
                    >
                      Open in Client Detail →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: ALL TASKS
          ══════════════════════════════════════════════ */}
          {view === 'tasks' && overallSummary && overallSummary.total > 0 && (
            <div className="space-y-3">
              {/* Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search tasks…"
                    value={filterSearch}
                    onChange={e => setFilterSearch(e.target.value)}
                    className="h-8 pl-8 pr-3 w-44 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Client filter */}
                <select
                  value={filterClient}
                  onChange={e => setFilterClient(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Clients</option>
                  {clients.filter(c => c.has_tasks).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Category filter */}
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="skipped">Skipped</option>
                  <option value="na">N/A</option>
                </select>

                {/* Priority filter */}
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {/* Clear filters */}
                {(filterClient || filterCategory || filterStatus || filterPriority || filterSearch) && (
                  <button
                    onClick={() => {
                      setFilterClient(''); setFilterCategory('');
                      setFilterStatus(''); setFilterPriority(''); setFilterSearch('');
                    }}
                    className="h-8 px-3 rounded-lg border border-slate-700/40 text-[11px] text-slate-500 hover:text-slate-300 transition"
                  >
                    Clear
                  </button>
                )}

                <span className="ml-auto text-[11px] text-slate-600">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Task rows */}
              {filteredTasks.length === 0 && (
                <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] px-6 py-8 text-center text-sm text-slate-600">
                  No tasks match your filters.
                </div>
              )}

              <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden divide-y divide-slate-800/40">
                {filteredTasks.map(task => {
                  const isExpanded  = expandedTask === task.id;
                  const isOverdueT  = task.status === 'overdue';

                  return (
                    <div key={task.id}>
                      {/* Row */}
                      <button
                        type="button"
                        onClick={() => toggleTask(task)}
                        className={`w-full text-left px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 hover:bg-slate-800/30 transition ${isExpanded ? 'bg-slate-800/20' : ''}`}
                      >
                        {/* Priority dot */}
                        <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-slate-600'}`} />

                        {/* Client name */}
                        <span className="shrink-0 text-[10px] font-medium text-teal-400/80 border border-teal-500/20 rounded px-1.5 py-0.5 bg-teal-500/5 max-w-[120px] truncate">
                          {task.client_name}
                        </span>

                        {/* Task name */}
                        <span className={`flex-1 min-w-0 text-xs font-medium truncate ${isOverdueT ? 'text-rose-300' : 'text-slate-200'}`}>
                          {task.task_name}
                        </span>

                        {/* Category chip */}
                        <span className={`hidden lg:inline shrink-0 text-[10px] border rounded px-1.5 py-0.5 ${CATEGORY_CHIP[task.waste_category] ?? 'text-slate-500 border-slate-700'}`}>
                          {CATEGORY_LABELS[task.waste_category] ?? task.waste_category}
                        </span>

                        {/* Due date */}
                        <span className={`shrink-0 text-[10px] tabular-nums ${isOverdueT ? 'text-rose-400' : 'text-slate-500'}`}>
                          {fmtDate(task.due_date)}
                        </span>

                        {/* Status badge */}
                        <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CHIP[task.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                          {statusLabel(task.status)}
                        </span>

                        {/* Chevron */}
                        <svg className={`shrink-0 h-3.5 w-3.5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 bg-slate-900/30 border-t border-slate-800/40 space-y-3">
                          {/* Meta */}
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className={`font-medium ${PRIORITY_TEXT[task.priority] ?? 'text-slate-500'}`}>
                              ● {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                            </span>
                            {task.frequency && (
                              <span className="text-slate-500 border border-slate-700/40 rounded px-1.5 py-0.5 capitalize">
                                {task.frequency.replace('_', ' ')}
                              </span>
                            )}
                            {task.period_label && (
                              <span className="text-slate-500 border border-slate-700/40 rounded px-1.5 py-0.5">
                                {task.period_label}
                              </span>
                            )}
                            {task.responsible_dept && (
                              <span className="text-slate-500 border border-slate-700/40 rounded px-1.5 py-0.5">
                                {task.responsible_dept}
                              </span>
                            )}
                            <Link
                              href={`/manager/clients/${task.client_id}`}
                              className="text-teal-400/70 hover:text-teal-300 transition"
                            >
                              View client →
                            </Link>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-[11px] text-slate-400 leading-relaxed">{task.description}</p>
                          )}

                          {/* Update form */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <select
                              value={editStatus}
                              onChange={e => setEditStatus(e.target.value)}
                              className="h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={editNote}
                              onChange={e => setEditNote(e.target.value)}
                              placeholder="Add a note (optional)…"
                              className="flex-1 h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-2.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <button
                              onClick={() => saveTask(task.id)}
                              disabled={savingTask === task.id}
                              className="h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-[11px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                            >
                              {savingTask === task.id ? (
                                <>
                                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                  Saving
                                </>
                              ) : 'Save'}
                            </button>
                          </div>

                          {/* Previous note */}
                          {task.notes && task.notes !== editNote && (
                            <p className="text-[11px] text-slate-500 italic">Previous note: {task.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── No clients ── */}
          {clients.length === 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-6 py-8 text-center">
              <p className="text-sm font-semibold text-amber-300">No clients assigned to you</p>
              <p className="text-xs text-slate-500 mt-1">An admin will assign clients from the IAM portal.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
