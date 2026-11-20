'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Log {
  id: string;
  tasks_completed: string | null;
  deliverables: string | null;
  blockers: string | null;
  hours_worked: number | null;
  submitted_at: string;
}

export default function OpsEodLogPage() {
  const [log, setLog]       = useState<Log | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ tasks_completed: '', deliverables: '', blockers: '', hours_worked: '' });

  useEffect(() => {
    fetch('/api/ops/daily-log').then(r => r.json()).then(d => {
      if (d.log) {
        setLog(d.log);
        setForm({
          tasks_completed: d.log.tasks_completed ?? '',
          deliverables:    d.log.deliverables ?? '',
          blockers:        d.log.blockers ?? '',
          hours_worked:    String(d.log.hours_worked ?? ''),
        });
      } else {
        setEditing(true);
      }
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/ops/daily-log', {
      method: log ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, hours_worked: form.hours_worked ? Number(form.hours_worked) : null }),
    });
    const data = await res.json();
    if (res.ok) {
      trackEvent('Ops Daily Log Submitted', { is_update: !!log, hours_worked: form.hours_worked ? Number(form.hours_worked) : null });
      setLog(data.log); setEditing(false); setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Daily Work Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">{today}</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading…</div>
      ) : !editing && log ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Submitted</span>
              <span className="text-xs text-slate-500">
                at {new Date(log.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button onClick={() => setEditing(true)}
              className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 transition">
              Edit
            </button>
          </div>
          {log.hours_worked && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm">
              <span className="text-rose-400 font-semibold">{log.hours_worked} hours</span>
              <span className="text-slate-500"> worked today</span>
            </div>
          )}
          {log.tasks_completed && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Tasks Completed</p>
              <p className="text-sm text-slate-300 whitespace-pre-line">{log.tasks_completed}</p>
            </div>
          )}
          {log.deliverables && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Deliverables</p>
              <p className="text-sm text-slate-300 whitespace-pre-line">{log.deliverables}</p>
            </div>
          )}
          {log.blockers && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Blockers</p>
              <p className="text-sm text-rose-300 whitespace-pre-line">{log.blockers}</p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          {success && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              ✓ Daily log saved!
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Tasks Completed <span className="text-rose-400">*</span>
            </label>
            <textarea required rows={4} value={form.tasks_completed}
              onChange={e => setForm(f => ({ ...f, tasks_completed: e.target.value }))}
              placeholder="Describe what you accomplished today…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Deliverables / Links</label>
            <textarea rows={2} value={form.deliverables}
              onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))}
              placeholder="Links, file names, or items delivered…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Blockers / Issues</label>
            <textarea rows={2} value={form.blockers}
              onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
              placeholder="Anything blocking your progress…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Hours Worked</label>
            <input type="number" min="0.5" max="16" step="0.5" value={form.hours_worked}
              onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))}
              placeholder="e.g. 8"
              className="w-32 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none" />
          </div>
          <div className="flex gap-3">
            {log && (
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition">
                Cancel
              </button>
            )}
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition">
              {saving ? 'Saving…' : log ? 'Update Log' : 'Submit Daily Log'}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">Why the daily log matters</p>
        <ul className="space-y-1 text-xs text-slate-500">
          <li>• Your manager reviews this to track team progress</li>
          <li>• It helps surface blockers early so they can be resolved</li>
          <li>• Your log is part of your activity record for performance reviews</li>
        </ul>
      </div>
    </div>
  );
}
