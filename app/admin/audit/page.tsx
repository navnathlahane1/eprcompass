'use client';

/**
 * /admin/audit  —  Admin Audit Log
 *
 * Read-only view of all audited admin actions: role changes,
 * data deletions, bulk operations, etc.
 */

import { useEffect, useState } from 'react';

interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

const ACTION_BADGE: Record<string, string> = {
  update_role:    'bg-blue-900/30   text-blue-300    ',
  delete_company: 'bg-rose-900/30    text-rose-300      ',
  bulk_push:      'bg-teal-100   text-teal-800    ',
  create:         'bg-emerald-900/30  text-emerald-300  ',
  update:         'bg-amber-900/30 text-amber-200',
  delete:         'bg-rose-900/30    text-rose-300      ',
};

function ActionBadge({ action }: { action: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${ACTION_BADGE[action] || 'bg-slate-900 text-slate-400'}`}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditLogPage() {
  const [entries, setEntries]         = useState<AuditEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState('');
  const [warning, setWarning]         = useState('');
  const [filterAction,   setFilterAction]   = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filterAction)   params.set('action',        filterAction);
      if (filterResource) params.set('resource_type', filterResource);

      const res  = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load audit log');
      setEntries(data.entries || []);
      setWarning(data.warning || '');
    } catch (err: any) {
      setError(err.message || 'Could not load audit log');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterAction, filterResource]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived filter options from loaded data
  const actionOptions   = [...new Set(entries.map((e) => e.action))].sort();
  const resourceOptions = [...new Set(entries.map((e) => e.resource_type))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Audit Log</h1>
            <p className="mt-1 text-slate-400">Immutable record of admin actions — role changes, deletions, bulk operations.</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900 transition disabled:opacity-50"
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All actions</option>
          {actionOptions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All resource types</option>
          {resourceOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {(filterAction || filterResource) && (
          <button
            onClick={() => { setFilterAction(''); setFilterResource(''); }}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-800/40 bg-rose-950/30 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}
      {warning && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/40 p-4 text-sm text-amber-300">
          {warning}
        </div>
      )}

      {/* Log table */}
      {loading && entries.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-10">Loading audit log…</p>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Who</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      className="border-b border-slate-800/60 hover:bg-slate-950 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-200 max-w-[160px] truncate">
                        {entry.user_email || entry.user_id || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-medium text-slate-200">{entry.resource_type}</span>
                        {entry.resource_id && (
                          <span className="ml-1 text-slate-500 font-mono text-[10px]">
                            {entry.resource_id.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {entry.notes || (entry.new_value
                          ? JSON.stringify(entry.new_value).slice(0, 60)
                          : '—')}
                        {(entry.old_value || entry.new_value) && (
                          <span className="ml-1 text-blue-500">▼</span>
                        )}
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {expandedId === entry.id && (entry.old_value || entry.new_value) && (
                      <tr key={`${entry.id}-detail`} className="border-b border-slate-800/60 bg-slate-950/50">
                        <td colSpan={5} className="px-6 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {entry.old_value && (
                              <div>
                                <p className="text-slate-500 mb-1 font-medium uppercase tracking-wide text-[10px]">Before</p>
                                <pre className="rounded-lg bg-slate-900 p-2 overflow-x-auto text-slate-200 text-[11px] leading-relaxed">
                                  {JSON.stringify(entry.old_value, null, 2)}
                                </pre>
                              </div>
                            )}
                            {entry.new_value && (
                              <div>
                                <p className="text-slate-500 mb-1 font-medium uppercase tracking-wide text-[10px]">After</p>
                                <pre className="rounded-lg bg-slate-900 p-2 overflow-x-auto text-slate-200 text-[11px] leading-relaxed">
                                  {JSON.stringify(entry.new_value, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {entries.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500 text-sm">
                      No audit log entries yet. Actions like role changes will appear here automatically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {entries.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-800/60 text-xs text-slate-500">
              Showing {entries.length} entries · click any row to expand change details
            </div>
          )}
        </div>
      )}
    </div>
  );
}
