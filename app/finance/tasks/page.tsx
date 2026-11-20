'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface FinanceTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: string;
  client_id: string | null;
  client_name: string;
  assignee_name: string | null;
  due_at: string | null;
  created_at: string;
  resolution_note: string | null;
  is_overdue: boolean;
}

const TASK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  finance_invoice_deal:    { label: 'Deal Invoice',       color: 'bg-violet-500/20 text-violet-300' },
  finance_invoice_service: { label: 'Service Invoice',    color: 'bg-blue-500/20 text-blue-300' },
  payment_followup:        { label: 'Payment Follow-up',  color: 'bg-amber-500/20 text-amber-300' },
};

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-500/15 text-amber-300',
  in_progress: 'bg-blue-500/15 text-blue-300',
  completed:   'bg-emerald-500/15 text-emerald-300',
  cancelled:   'bg-slate-600/30 text-slate-500',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-rose-500',
  high:   'bg-orange-500',
  normal: 'bg-amber-500',
  low:    'bg-slate-500',
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
  task: FinanceTask;
  onClose: () => void;
  onDone: () => void;
}

function ActionModal({ task, onClose, onDone }: ActionModalProps) {
  const [note,    setNote]    = useState(task.resolution_note || '');
  const [action,  setAction]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const isPaymentTask = task.task_type === 'finance_invoice_deal' || task.task_type === 'finance_invoice_service' || task.task_type === 'payment_followup';

  async function handleSave() {
    if (!action && task.status === 'pending') { setErr('Choose an action'); return; }
    setSaving(true); setErr('');
    try {
      const body: Record<string, string> = { resolution_note: note };
      if (action === 'payment_confirmed')         { body.action = 'payment_confirmed';         body.status = 'completed'; }
      else if (action === 'service_payment_confirmed') { body.action = 'service_payment_confirmed'; body.status = 'completed'; }
      else if (action === 'in_progress')          { body.status = 'in_progress'; }
      else if (action === 'completed')            { body.status = 'completed'; }

      const res = await fetch(`/api/finance/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
            <p className="mt-0.5 text-[11px] text-slate-500">{task.title}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-600 hover:text-slate-300 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Task info */}
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-xs text-slate-400 space-y-1">
            <div className="flex gap-2"><span className="text-slate-600 w-20 shrink-0">Client:</span><span className="text-slate-300">{task.client_name}</span></div>
            <div className="flex gap-2"><span className="text-slate-600 w-20 shrink-0">Type:</span><span>{TASK_TYPE_LABELS[task.task_type]?.label || task.task_type}</span></div>
            {task.due_at && <div className="flex gap-2"><span className="text-slate-600 w-20 shrink-0">Due:</span><span className={task.is_overdue ? 'text-rose-400' : ''}>{relDate(task.due_at)}</span></div>}
          </div>

          {/* Action selector */}
          {task.status !== 'completed' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Action</label>
              <div className="grid grid-cols-2 gap-2">
                {task.status === 'pending' && (
                  <button onClick={() => setAction('in_progress')}
                    className={`rounded-lg border p-2.5 text-xs font-semibold transition ${action === 'in_progress' ? 'border-blue-500/60 bg-blue-500/15 text-blue-300' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}`}>
                    Mark In Progress
                  </button>
                )}
                {isPaymentTask && task.task_type !== 'finance_invoice_service' && (
                  <button onClick={() => setAction('payment_confirmed')}
                    className={`rounded-lg border p-2.5 text-xs font-semibold transition ${action === 'payment_confirmed' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}`}>
                    ✓ Payment Confirmed
                  </button>
                )}
                {task.task_type === 'finance_invoice_service' && (
                  <button onClick={() => setAction('service_payment_confirmed')}
                    className={`rounded-lg border p-2.5 text-xs font-semibold transition ${action === 'service_payment_confirmed' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}`}>
                    ✓ Service Payment Confirmed
                  </button>
                )}
                <button onClick={() => setAction('completed')}
                  className={`rounded-lg border p-2.5 text-xs font-semibold transition ${action === 'completed' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}`}>
                  Mark Completed
                </button>
              </div>
              {action === 'payment_confirmed' && (
                <p className="mt-2 text-[10px] text-emerald-400/70 border border-emerald-500/20 rounded-md px-2 py-1.5 bg-emerald-500/5">
                  This will create an IAM task to set up the client&apos;s portal login account.
                </p>
              )}
              {action === 'service_payment_confirmed' && (
                <p className="mt-2 text-[10px] text-emerald-400/70 border border-emerald-500/20 rounded-md px-2 py-1.5 bg-emerald-500/5">
                  This will create a task for the client&apos;s manager to fulfil the service request.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Resolution Note</label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note about this task..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition"
            />
          </div>

          {err && <p className="text-xs text-rose-400">{err}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200">
              Cancel
            </button>
            {task.status !== 'completed' && (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinanceTasksPage() {
  const [tasks,   setTasks]   = useState<FinanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'active' | 'completed' | 'all'>('active');
  const [modal,   setModal]   = useState<FinanceTask | null>(null);

  const load = useCallback(() => {
    const status = filter === 'active' ? 'pending' : filter === 'completed' ? 'completed' : 'all';
    setLoading(true);
    fetch(`/api/finance/tasks?status=${status}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setTasks(d.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const overdueCount = tasks.filter(t => t.is_overdue).length;

  return (
    <div className="space-y-5">

      {modal && <ActionModal task={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Finance Tasks</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {pendingCount} pending{overdueCount > 0 && <span className="text-rose-400"> · {overdueCount} overdue</span>}
          </p>
        </div>
        <Link href="/finance/invoices/create"
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/15">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 p-1 w-fit">
        {(['active', 'completed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] py-16 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto mb-3 h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm text-slate-500">No {filter === 'active' ? 'pending' : filter} tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => {
            const typeInfo  = TASK_TYPE_LABELS[t.task_type];
            const dateLabel = relDate(t.due_at);
            return (
              <div key={t.id}
                className={`relative overflow-hidden rounded-xl border bg-[#0c1022] p-4 transition hover:border-emerald-500/20 ${t.is_overdue ? 'border-rose-500/30' : 'border-slate-800/80'}`}>
                {t.is_overdue && <div className="absolute left-0 top-0 h-full w-0.5 bg-rose-500" />}
                {!t.is_overdue && t.status === 'pending' && <div className="absolute left-0 top-0 h-full w-0.5 bg-amber-500" />}
                {t.status === 'in_progress' && !t.is_overdue && <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500" />}
                {t.status === 'completed' && <div className="absolute left-0 top-0 h-full w-0.5 bg-emerald-500" />}

                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] || 'bg-slate-500'}`} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-100">{t.title}</p>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${typeInfo?.color || 'bg-slate-700/50 text-slate-400'}`}>
                        {typeInfo?.label || t.task_type}
                      </span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[t.status] || 'bg-slate-700/50 text-slate-400'}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                      <span>Client: <span className="text-slate-300">{t.client_name}</span></span>
                      {t.assignee_name && <span>Assigned: <span className="text-slate-400">{t.assignee_name}</span></span>}
                      {dateLabel && <span className={t.is_overdue ? 'text-rose-400 font-semibold' : ''}>{dateLabel}</span>}
                    </div>

                    {t.description && (
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{t.description}</p>
                    )}

                    {t.resolution_note && (
                      <p className="mt-1.5 rounded-md border border-slate-800/60 bg-slate-900/40 px-2 py-1 text-[11px] text-slate-400">
                        Note: {t.resolution_note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {t.client_id && (
                      <Link href={`/finance/invoices/create?client_id=${t.client_id}&task_id=${t.id}`}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
                        Create Invoice
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
