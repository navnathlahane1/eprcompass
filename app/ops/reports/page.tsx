'use client';

import { useState, useEffect } from 'react';

interface LogRow {
  date: string;
  hours_worked: number | null;
  tasks_completed: string | null;
  submitted_at: string;
}

interface CheckinRow {
  date: string;
  status: string;
  total_hours: number | null;
}

export default function OpsMisReportsPage() {
  const [logs, setLogs]       = useState<LogRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'logs' | 'attendance'>('logs');

  useEffect(() => {
    Promise.all([
      fetch('/api/ops/daily-log?range=30').then(r => r.json()),
      fetch('/api/ops/checkin?range=30').then(r => r.json()),
    ]).then(([logData, checkinData]) => {
      setLogs(logData.logs ?? []);
      setCheckins(checkinData.checkins ?? []);
      setLoading(false);
    });
  }, []);

  function exportCsv(data: Record<string, unknown>[], filename: string) {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename;
    a.click();
  }

  const totalHours = logs.reduce((s, l) => s + (l.hours_worked ?? 0), 0);
  const daysLogged = logs.length;
  const daysPresent = checkins.filter(c => c.status !== 'absent' && c.status !== 'pending').length;
  const avgHours = daysLogged > 0 ? (totalHours / daysLogged).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">MIS & Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Last 30 days activity summary</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Days Logged', value: daysLogged, color: 'text-rose-400' },
          { label: 'Days Present', value: daysPresent, color: 'text-emerald-400' },
          { label: 'Total Hours', value: totalHours.toFixed(1), color: 'text-blue-400' },
          { label: 'Avg Hours/Day', value: avgHours, color: 'text-amber-400' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700/60">
        {(['logs', 'attendance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === t ? 'border-rose-400 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
            {t === 'logs' ? 'Work Logs' : 'Attendance'}
          </button>
        ))}
        <button onClick={() => exportCsv(tab === 'logs' ? (logs as unknown as Record<string, unknown>[]) : (checkins as unknown as Record<string, unknown>[]), `${tab}-report.csv`)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg mb-1 transition">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading…</div>
      ) : tab === 'logs' ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hours</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tasks Summary</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No logs in last 30 days</td></tr>
              ) : logs.map(l => (
                <tr key={l.date} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-300 font-medium">{new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-rose-400 font-semibold">{l.hours_worked ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{l.tasks_completed ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{new Date(l.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hours</th>
              </tr>
            </thead>
            <tbody>
              {checkins.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No attendance records in last 30 days</td></tr>
              ) : checkins.map(c => (
                <tr key={c.date} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-300 font-medium">{new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                      c.status === 'completed' ? 'text-emerald-400 bg-emerald-900/30' :
                      c.status === 'active'    ? 'text-blue-400 bg-blue-900/30' :
                      c.status === 'absent'    ? 'text-red-400 bg-red-900/30' :
                      'text-slate-400 bg-slate-800'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-rose-400 font-semibold">{c.total_hours ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
