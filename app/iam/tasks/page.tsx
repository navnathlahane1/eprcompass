'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface IamTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: string;
  client_id: string | null;
  client_name: string;
  due_at: string | null;
  created_at: string;
  resolution_note: string | null;
  is_overdue: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-500/15 text-amber-300',
  in_progress: 'bg-blue-500/15 text-blue-300',
  completed:   'bg-emerald-500/15 text-emerald-300',
  cancelled:   'bg-slate-600/30 text-slate-500',
};

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-rose-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-500',
  low:      'bg-slate-500',
};

function relDate(d: string | null) {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400_000);
  if (days < 0)   return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

interface ActionModalProps {
  task: IamTask;
  onClose: () => void;
  onDone: () => void;
}

function ActionModal({ task, onClose, onDone }: ActionModalProps) {
  const [note,   setNote]   = useState(task.resolution_note || '');
  const [status, setStatus] = useState<'in_progress' | 'completed' | ''>('');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  async function handleSave() {
    if (!status) { setErr('Choose an action'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`/api/iam/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution_note: note }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      onDone();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c1022] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Update Task</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{task.title}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-600 hover:text-slate-300 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-xs text-slate-400 space-y-1">
            <div className="flex gap-2"><span className="text-slate-600 w-16 shrink-0">Client:</span><span className="text-slate-300">{task.client_name}</span></div>
            {task.due_at && <div className="flex gap-2"><span className="text-slate-600 w-16 shrink-0">Due:</span><span className={task.is_overdue ? 'text-rose-400' : ''}>{relDate(task.due_at)}</span></div>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Action</label>
            <div className="grid grid-cols-2 gap-2">
              {task.status === 'pending' && (
                <button onClick={() => setStatus('in_progress')}
                  className={`rounded-lg border p-2.5 text-xs font-semibold transition ${status === 'in_progress' ? 'border-blue-500/60 bg-blue-500/15 text-blue-300' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}`}>
                  Mark In Progress
                </button>
              )}
              <button onClick={() => setStatus('completed')}
                className={`rounded-lg border p-2.5 text-xs font-semibold transition ${status === 'completed' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}`}>
                ✓ Mark Completed
              </button>
            </div>
            {status === 'completed' && (
              <p className="mt-2 text-[10px] text-emerald-400/70 border border-emerald-500/20 rounded-md px-2 py-1.5 bg-emerald-500/5">
                Completing this task will create an admin task to connect the client login to the Intel company record.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Note</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Login created and sent to client…"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none transition" />
          </div>

          {err && <p className="text-xs text-rose-400">{err}</p>}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IamTasksPage() {
  const [tasks,   setTasks]   = useState<IamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'active' | 'completed' | 'all'>('active');
  const [modal,   setModal]   = useState<IamTask | null>(null);

  const load = useCallback(() => {
    const status = filter === 'completed' ? 'completed' : filter === 'all' ? 'all' : 'pending';
    setLoading(true);
    fetch(`/api/iam/tasks?status=${status}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setTasks(d.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const overdueCount = tasks.filter(t => t.is_overdue).length;

  return (
    <div className="space-y-5">
      {modal && <ActionModal task={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Client Login Tasks</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {overdueCount > 0 && <span className="text-rose-400"> · {overdueCount} overdue</span>}
          </p>
        </div>
        <Link href="/iam/create"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create User
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 p-1 w-fit">
        {(['active', 'completed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] py-16 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto mb-3 h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm text-slate-500">No {filter === 'active' ? 'pending' : filter} tasks</p>
          <p className="mt-1 text-xs text-slate-600">Client login tasks from Finance will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => {
            const dateLabel = relDate(t.due_at);
            return (
              <div key={t.id}
                className={`relative overflow-hidden rounded-xl border bg-[#0c1022] p-4 transition hover:border-violet-500/20 ${t.is_overdue ? 'border-rose-500/30' : 'border-slate-800/80'}`}>
                {t.is_overdue && <div className="absolute left-0 top-0 h-full w-0.5 bg-rose-500" />}
                {!t.is_overdue && t.status === 'pending' && <div className="absolute left-0 top-0 h-full w-0.5 bg-amber-500" />}
                {t.status === 'in_progress' && !t.is_overdue && <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500" />}
                {t.status === 'completed' && <div className="absolute left-0 top-0 h-full w-0.5 bg-emerald-500" />}

                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] || 'bg-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-100">{t.title}</p>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[t.status] || 'bg-slate-700/50 text-slate-400'}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                      <span>Client: <span className="text-slate-300">{t.client_name}</span></span>
                      {dateLabel && <span className={t.is_overdue ? 'text-rose-400 font-semibold' : ''}>{dateLabel}</span>}
                    </div>
                    {t.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{t.description}</p>}
                    {t.resolution_note && (
                      <p className="mt-1.5 rounded-md border border-slate-800/60 bg-slate-900/40 px-2 py-1 text-[11px] text-slate-400">
                        Note: {t.resolution_note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.client_id && (
                      <Link href={`/iam/create?hint=${t.client_id}`}
                        className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-violet-300 transition hover:bg-violet-500/20">
                        Create Login
                      </Link>
                    )}
                    {t.status !== 'completed' && (
                      <button onClick={() => setModal(t)}
                        className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition hover:border-slate-700 hover:text-slate-200">
                        Update
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
