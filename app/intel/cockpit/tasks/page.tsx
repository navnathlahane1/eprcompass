'use client';

// Cockpit to-do list. Backed by GET/POST/PATCH /intel/cockpit/tasks and
// GET /intel/cockpit/team. This is the action loop for the cockpit —
// recommended plays become assignable tasks here.

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';

type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
type TaskPriority = 'p0' | 'p1' | 'p2' | 'p3';

type TaskRow = {
  id: string;
  title: string;
  detail: string | null;
  play_kind: string | null;
  state: string | null;
  waste_category: string | null;
  company_id: string | null;
  projected_inr: number | null;
  confidence: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_user_id: string | null;
  due_on: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  outcome_inr: number | null;
};

type Member = {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
};

const STATUS_OPTIONS: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done', 'cancelled'];
const PRIORITY_OPTIONS: TaskPriority[] = ['p0', 'p1', 'p2', 'p3'];

const STATUS_TONE: Record<TaskStatus, string> = {
  open: 'border-slate-700 bg-slate-800/60 text-slate-200',
  in_progress: 'border-teal-400/40 bg-teal-500/15 text-teal-200',
  blocked: 'border-rose-400/40 bg-rose-500/15 text-rose-200',
  done: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  cancelled: 'border-slate-700 bg-slate-900/50 text-slate-500 line-through'
};

const PRIORITY_TONE: Record<TaskPriority, string> = {
  p0: 'border-rose-400/50 bg-rose-500/20 text-rose-100',
  p1: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  p2: 'border-slate-600 bg-slate-800/50 text-slate-300',
  p3: 'border-slate-700 bg-slate-900/50 text-slate-500'
};

function formatInr(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function dueTone(days: number | null): string {
  if (days == null) return 'text-slate-400';
  if (days < 0) return 'text-rose-300';
  if (days <= 3) return 'text-amber-300';
  if (days <= 14) return 'text-teal-300';
  return 'text-slate-200';
}

export default function CockpitTasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('open');
  const [creating, setCreating] = useState(false);

  // New-task form
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('p2');
  const [newDue, setNewDue] = useState('');

  const tokenHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not signed in. Please log in via /intel/login.');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = await tokenHeader();
      const [tasksRes, teamRes] = await Promise.all([
        fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/tasks?limit=200`, { headers: auth, cache: 'no-store' }),
        fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/team`, { headers: auth, cache: 'no-store' })
      ]);
      if (!tasksRes.ok) {
        const body = await tasksRes.json().catch(() => ({}));
        throw new Error(body?.error || `Tasks HTTP ${tasksRes.status}`);
      }
      if (!teamRes.ok) {
        const body = await teamRes.json().catch(() => ({}));
        throw new Error(body?.error || `Team HTTP ${teamRes.status}`);
      }
      const tasksData = await tasksRes.json();
      const teamData = await teamRes.json();
      setTasks(tasksData.rows || []);
      setTeam(teamData.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [tokenHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const teamById = useMemo(
    () => new Map(team.map((m) => [m.user_id, m])),
    [team]
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const counts = useMemo(() => {
    const out: Record<TaskStatus | 'all', number> = {
      all: tasks.length,
      open: 0,
      in_progress: 0,
      blocked: 0,
      done: 0,
      cancelled: 0
    };
    for (const t of tasks) out[t.status] += 1;
    return out;
  }, [tasks]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const auth = await tokenHeader();
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/tasks`, {
        method: 'POST',
        headers: { ...auth, 'content-type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          detail: newDetail.trim() || null,
          assignee_user_id: newAssignee || null,
          priority: newPriority,
          due_on: newDue || null
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setNewTitle('');
      setNewDetail('');
      setNewAssignee('');
      setNewPriority('p2');
      setNewDue('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const patchTask = async (id: string, body: Partial<TaskRow>) => {
    try {
      const auth = await tokenHeader();
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/cockpit/tasks/${id}`, {
        method: 'PATCH',
        headers: { ...auth, 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      if (data.attribution_warning) {
        setError(data.attribution_warning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  // Outcome capture state — { [taskId]: { inr, note } }
  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<string, { inr: string; note: string }>>({});
  const updateDraft = (id: string, patch: Partial<{ inr: string; note: string }>) => {
    setOutcomeDrafts((prev) => ({
      ...prev,
      [id]: { inr: '', note: '', ...prev[id], ...patch }
    }));
  };
  const saveOutcomeAndClose = async (id: string) => {
    const draft = outcomeDrafts[id] || { inr: '', note: '' };
    const inr = draft.inr.trim() === '' ? null : Number(draft.inr);
    if (inr != null && !Number.isFinite(inr)) {
      setError('Outcome ₹ must be a number');
      return;
    }
    await patchTask(id, {
      status: 'done',
      outcome_inr: inr,
      outcome_note: draft.note.trim() || null
    } as Partial<TaskRow>);
    setOutcomeDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {/* ─── Header ───────────────────────────────────────────── */}
      <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <Link href="/intel/cockpit" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Cockpit</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Tasks</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cockpit tasks</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Turn recommended plays into assignable to-dos. Status changes here flow into outcome attribution in a
              later phase.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {/* Status filter chips */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(['all', ...STATUS_OPTIONS] as Array<TaskStatus | 'all'>).map((s) => {
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isActive
                    ? 'border-teal-400/50 bg-teal-500/15 text-teal-200'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {s.replace('_', ' ')} <span className="ml-1 tabular-nums">({counts[s] ?? 0})</span>
              </button>
            );
          })}
        </div>
      </section>

      <PlatformPulseBanner />

      {/* ─── New-task form ────────────────────────────────────── */}
      <section
        aria-labelledby="new-task-heading"
        className="relative mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
      >
        <h2 id="new-task-heading" className="mb-3 text-sm font-semibold text-teal-300">
          Quick add
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <label className="sm:col-span-5">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Title</span>
            <input
              required
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Open Tamil Nadu Battery EPR practice"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none"
            />
          </label>
          <label className="sm:col-span-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Assignee</span>
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {team.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Priority</span>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Due</span>
            <input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none"
            />
          </label>
          <label className="sm:col-span-10">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Detail (optional)</span>
            <input
              type="text"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              placeholder="Why, context, deliverable"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none"
            />
          </label>
          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="w-full rounded-md border border-teal-400/40 bg-teal-500/15 px-4 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Adding…' : 'Add task'}
            </button>
          </div>
        </form>
      </section>

      {/* ─── Task list ────────────────────────────────────────── */}
      <section className="relative mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        {loading ? (
          <div className="mt-3 space-y-2 animate-pulse">
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="mt-2 text-sm text-slate-400">
              No tasks for this filter. Use the form above or convert a play from canvas 4.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => {
              const days = daysUntil(t.due_on);
              const assignee = t.assignee_user_id ? teamById.get(t.assignee_user_id) : null;
              const assigneeLabel = assignee
                ? assignee.full_name || assignee.email
                : null;
              return (
                <li
                  key={t.id}
                  className={`rounded-xl border p-4 transition ${
                    t.status === 'done' || t.status === 'cancelled'
                      ? 'border-slate-800 bg-slate-950/40 opacity-70'
                      : 'border-slate-800 bg-slate-950/70'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONE[t.status]}`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider tabular-nums ${PRIORITY_TONE[t.priority]}`}
                        >
                          {t.priority.toUpperCase()}
                        </span>
                        {t.state ? <span className="text-[11px] text-slate-400">{t.state}</span> : null}
                        {t.waste_category ? (
                          <span className="text-[11px] text-slate-400">· {t.waste_category}</span>
                        ) : null}
                        {t.play_kind ? (
                          <span className="text-[10px] uppercase tracking-widest text-slate-500">
                            from {t.play_kind.replace('_', ' ')}
                          </span>
                        ) : null}
                      </div>
                      <h3 className={`mt-1.5 text-sm font-semibold ${t.status === 'cancelled' ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {t.title}
                      </h3>
                      {t.detail ? <p className="mt-1 text-xs text-slate-300">{t.detail}</p> : null}
                      <p className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 tabular-nums">
                        <span>
                          updated <span className="text-slate-200">{formatDate(t.updated_at)}</span>
                        </span>
                        {t.due_on ? (
                          <span>
                            due <span className={dueTone(days)}>{formatDate(t.due_on)}</span>
                            {days != null ? (
                              <span className={dueTone(days)}>
                                {' · '}
                                {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                        {t.projected_inr ? (
                          <span>
                            est <span className="text-slate-100">{formatInr(t.projected_inr)}</span>
                          </span>
                        ) : null}
                        {t.outcome_inr != null ? (
                          <span>
                            outcome <span className="text-teal-300">{formatInr(t.outcome_inr)}</span>
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {/* Inline controls */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500">
                        Assignee
                        <select
                          value={t.assignee_user_id || ''}
                          onChange={(e) => patchTask(t.id, { assignee_user_id: e.target.value || null })}
                          className="ml-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-teal-400 focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {team.map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                              {m.full_name || m.email}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500">
                        Status
                        <select
                          value={t.status}
                          onChange={(e) => patchTask(t.id, { status: e.target.value as TaskStatus })}
                          className="ml-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-teal-400 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  {assigneeLabel ? (
                    <p className="mt-2 text-[11px] text-slate-400">
                      assigned to <span className="text-slate-200">{assigneeLabel}</span>
                    </p>
                  ) : null}

                  {/* Inline close-with-outcome UI when task is open or in progress */}
                  {(t.status === 'open' || t.status === 'in_progress' || t.status === 'blocked') ? (
                    <details className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs">
                      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Close with outcome
                      </summary>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-12">
                        <label className="sm:col-span-3">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500">
                            Outcome ₹
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={outcomeDrafts[t.id]?.inr ?? ''}
                            onChange={(e) => updateDraft(t.id, { inr: e.target.value })}
                            placeholder="0 = Lost"
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none tabular-nums"
                          />
                        </label>
                        <label className="sm:col-span-7">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500">
                            Note (optional)
                          </span>
                          <input
                            type="text"
                            value={outcomeDrafts[t.id]?.note ?? ''}
                            onChange={(e) => updateDraft(t.id, { note: e.target.value })}
                            placeholder="reason, competitor, etc."
                            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                          />
                        </label>
                        <div className="sm:col-span-2 flex items-end">
                          <button
                            type="button"
                            onClick={() => saveOutcomeAndClose(t.id)}
                            className="w-full rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-200 transition hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          >
                            Close
                          </button>
                        </div>
                        {!t.company_id ? (
                          <p className="sm:col-span-12 text-[10px] text-slate-500">
                            Segment-level task (no company_id) — outcome rolls up into aggregate SOM, no per-company attribution row.
                          </p>
                        ) : (
                          <p className="sm:col-span-12 text-[10px] text-slate-500">
                            On close, a row writes to <code className="rounded bg-slate-800 px-1 text-slate-300">intel_outcome_attribution</code> (Won if ₹ &gt; 0, else Lost) — feeds canvas 1.
                          </p>
                        )}
                      </div>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
        <Link href="/intel/cockpit" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to Cockpit
        </Link>
      </div>
    </div>
  );
}
