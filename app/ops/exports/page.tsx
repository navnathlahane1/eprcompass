'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

const ROLE_CONTEXTS = [
  { value: '', label: 'All my tasks' },
  { value: 'proposal', label: 'Proposals' },
  { value: 'checklist', label: 'Checklists' },
  { value: 'lead_gen', label: 'Lead Pipeline' },
  { value: 'lead_source', label: 'Lead Sources' },
  { value: 'appointment', label: 'Appointments' },
  { value: 'followup', label: 'Follow-ups' },
  { value: 'crm_data_entry', label: 'CRM Data Entry' },
  { value: 'contact', label: 'Contacts' },
  { value: 'support_ticket', label: 'Support Tickets' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'comms_log', label: 'Communication Log' },
];

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map(row => keys.map(k => escape(row[k])).join(','))].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function OpsExportsPage() {
  const [roleContext, setRoleContext] = useState('');
  const [logRange, setLogRange] = useState('30');
  const [exportingTasks, setExportingTasks] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [message, setMessage] = useState('');

  async function exportTasks() {
    setExportingTasks(true);
    setMessage('');
    try {
      const params = new URLSearchParams({ status: 'all', page: '1' });
      if (roleContext) params.set('role_context', roleContext);
      const res = await fetch(`/api/ops/tasks?${params}`);
      const data = await res.json();
      const rows = (data.tasks ?? []).map((t: Record<string, unknown>) => ({
        title: t.title, status: t.status, priority: t.priority, due_date: t.due_date,
        contact_name: t.contact_name, contact_phone: t.contact_phone, contact_email: t.contact_email,
        contact_company: t.contact_company, description: t.description, created_at: t.created_at,
      }));
      if (!rows.length) { setMessage('Nothing to export for that selection.'); return; }
      const label = ROLE_CONTEXTS.find(r => r.value === roleContext)?.label ?? 'tasks';
      trackEvent('Ops Data Exported', { export_type: 'tasks', role_context: roleContext || 'all' });
      downloadCsv(toCsv(rows), `${label.toLowerCase().replace(/\s+/g, '-')}-export.csv`);
    } finally {
      setExportingTasks(false);
    }
  }

  async function exportLogs() {
    setExportingLogs(true);
    setMessage('');
    try {
      const res = await fetch(`/api/ops/daily-log?range=${logRange}`);
      const data = await res.json();
      const rows = data.logs ?? [];
      if (!rows.length) { setMessage('No daily logs in that range.'); return; }
      trackEvent('Ops Data Exported', { export_type: 'daily_logs', range_days: logRange });
      downloadCsv(toCsv(rows), `daily-logs-last-${logRange}-days.csv`);
    } finally {
      setExportingLogs(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Data Exports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Download your own records as CSV</p>
      </div>

      {message && (
        <div className="rounded-lg border border-amber-700/30 bg-amber-900/20 px-4 py-2.5 text-sm text-amber-300">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">Export tasks</p>
          <p className="text-xs text-slate-500 mt-0.5">Everything you've created or been assigned, filterable by module</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={roleContext} onChange={e => setRoleContext(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none">
            {ROLE_CONTEXTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={exportTasks} disabled={exportingTasks}
            className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportingTasks ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">Export daily logs</p>
          <p className="text-xs text-slate-500 mt-0.5">Your submitted work logs and hours</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={logRange} onChange={e => setLogRange(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button onClick={exportLogs} disabled={exportingLogs}
            className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportingLogs ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
