'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type DynamicColumnRow = {
  id: string;
  target_table: string;
  column_key: string;
  inferred_type: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'renamed';
  approved_name: string | null;
  approved_type: string | null;
  applied_to_table?: string | null;
  applied_column?: string | null;
  applied_at?: string | null;
  apply_error?: string | null;
  created_at: string;
  intel_sources?: {
    source_name?: string;
    source_type?: string;
    license_flag?: string;
  } | null;
};

type SchemaChangeQueueRow = {
  id: string;
  dynamic_column_id?: string | null;
  target_table: string;
  target_column: string;
  target_sql_type: string;
  status: 'queued' | 'applied' | 'failed';
  requested_at: string;
  applied_at: string | null;
  error_message: string | null;
};

export default function IntelDynamicColumnsPage() {
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<DynamicColumnRow[]>([]);
  const [queueRows, setQueueRows] = useState<SchemaChangeQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [queueStatusFilter, setQueueStatusFilter] = useState('all');
  const [columnsPage, setColumnsPage] = useState(1);
  const [columnsPageSize, setColumnsPageSize] = useState<number>(25);
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState<number>(25);

  useEffect(() => {
    const nextStatus = searchParams.get('status');
    const nextQueueStatus = searchParams.get('queueStatus');

    if (nextStatus && ['pending', 'approved', 'rejected', 'renamed'].includes(nextStatus)) {
      setStatusFilter(nextStatus);
    }
    if (nextQueueStatus && ['all', 'queued', 'applied', 'failed'].includes(nextQueueStatus)) {
      setQueueStatusFilter(nextQueueStatus);
    }
  }, [searchParams]);

  const authToken = useCallback(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const fetchIntelDynamic = useCallback(async (path: string, token: string, init?: RequestInit) => {
    const apiBaseUrl = getIntelApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const headers = {
      ...(init?.headers || {}),
      authorization: `Bearer ${token}`
    };

    try {
      return await fetch(`${apiBaseUrl}${normalizedPath}`, {
        ...init,
        headers
      });
    } catch (primaryError) {
      if (!apiBaseUrl) {
        throw primaryError;
      }

      return fetch(normalizedPath, {
        ...init,
        headers
      });
    }
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');

    const token = await authToken();
    if (!token) {
      setError('No active session token found.');
      setLoading(false);
      return;
    }

    const queuePath =
      queueStatusFilter && queueStatusFilter !== 'all'
        ? `/api/intel/dynamic-columns/queue?status=${encodeURIComponent(queueStatusFilter)}`
        : '/api/intel/dynamic-columns/queue';

    const [columnsResponse, queueResponse] = await Promise.all([
      fetchIntelDynamic(`/api/intel/dynamic-columns?status=${encodeURIComponent(statusFilter)}`, token),
      fetchIntelDynamic(queuePath, token)
    ]);

    const columnsPayload = await columnsResponse.json();
    const queuePayload = await queueResponse.json();

    if (!columnsResponse.ok) {
      setError(columnsPayload.error || 'Failed to load dynamic columns');
      setLoading(false);
      return;
    }
    if (!queueResponse.ok) {
      setError(queuePayload.error || 'Failed to load schema change queue');
      setLoading(false);
      return;
    }

    setRows((columnsPayload.rows || []) as DynamicColumnRow[]);
    setQueueRows((queuePayload.rows || []) as SchemaChangeQueueRow[]);
    setLoading(false);
  }, [authToken, fetchIntelDynamic, queueStatusFilter, statusFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  async function updateRow(row: DynamicColumnRow, update: Partial<DynamicColumnRow>) {
    setError('');
    setSuccess('');

    const token = await authToken();
    if (!token) {
      setError('No active session token found.');
      return;
    }

    const response = await fetchIntelDynamic(`/api/intel/dynamic-columns/${row.id}`, token, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(update)
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Update failed');
      return;
    }

    setSuccess('Dynamic column updated.');
    await loadRows();
  }

  async function applyRow(row: DynamicColumnRow) {
    setError('');
    setSuccess('');

    const token = await authToken();
    if (!token) {
      setError('No active session token found.');
      return;
    }

    const response = await fetchIntelDynamic(`/api/intel/dynamic-columns/${row.id}/apply`, token, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Apply failed');
      return;
    }

    setSuccess(`Applied to ${payload.target_table}.${payload.target_column}`);
    await loadRows();
  }

  async function backfillRow(row: DynamicColumnRow) {
    setError('');
    setSuccess('');

    const token = await authToken();
    if (!token) {
      setError('No active session token found.');
      return;
    }

    const response = await fetchIntelDynamic(`/api/intel/dynamic-columns/${row.id}/backfill`, token, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Backfill failed');
      return;
    }

    setSuccess(`Backfill completed. Updated rows: ${payload.updated_rows || 0}`);
    await loadRows();
  }

  async function backfillAll() {
    setError('');
    setSuccess('');

    const token = await authToken();
    if (!token) {
      setError('No active session token found.');
      return;
    }

    const response = await fetchIntelDynamic('/api/intel/dynamic-columns/backfill-all', token, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Bulk backfill failed');
      return;
    }

    setSuccess(`Bulk backfill done. Success: ${payload.successful_columns || 0}, Failed: ${payload.failed_columns || 0}`);
    await loadRows();
  }

  async function retryQueueRow(row: SchemaChangeQueueRow) {
    setError('');
    setSuccess('');

    const token = await authToken();
    if (!token) {
      setError('No active session token found.');
      return;
    }

    const response = await fetchIntelDynamic(`/api/intel/dynamic-columns/queue/${row.id}/retry`, token, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Queue retry failed');
      return;
    }

    setSuccess(`Retry successful for ${payload.target_table}.${payload.target_column}`);
    await loadRows();
  }

  const columnsTotalPages = Math.max(1, Math.ceil(rows.length / columnsPageSize));
  const columnsPageSafe = Math.min(columnsPage, columnsTotalPages);
  const columnsStart = (columnsPageSafe - 1) * columnsPageSize;
  const columnsEnd = columnsStart + columnsPageSize;
  const pagedRows = rows.slice(columnsStart, columnsEnd);

  const queueTotalPages = Math.max(1, Math.ceil(queueRows.length / queuePageSize));
  const queuePageSafe = Math.min(queuePage, queueTotalPages);
  const queueStart = (queuePageSafe - 1) * queuePageSize;
  const queueEnd = queueStart + queuePageSize;
  const pagedQueueRows = queueRows.slice(queueStart, queueEnd);

  useEffect(() => {
    setColumnsPage(1);
  }, [statusFilter, rows.length, columnsPageSize]);

  useEffect(() => {
    setQueuePage(1);
  }, [queueStatusFilter, queueRows.length, queuePageSize]);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Dynamic Columns</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-violet-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dynamic Columns</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">Approve, reject, or rename discovered columns before operational use.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-blue-700 px-3 py-2 text-xs font-semibold text-blue-300 hover:border-blue-500"
              onClick={backfillAll}
            >
              Backfill All Applied
            </button>
            <Link href="/intel/export" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
              Export
            </Link>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Column Status Filter</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="renamed">renamed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Queue Status Filter</label>
              <select
                value={queueStatusFilter}
                onChange={(event) => setQueueStatusFilter(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="all">all</option>
                <option value="queued">queued</option>
                <option value="applied">applied</option>
                <option value="failed">failed</option>
              </select>
            </div>
          </div>
        </div>

        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="mb-3 text-sm text-emerald-300">{success}</p> : null}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
          <p>
            Showing {rows.length === 0 ? 0 : columnsStart + 1}-{Math.min(columnsEnd, rows.length)} of {rows.length} dynamic columns
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="columns-page-size" className="text-slate-400">
              Rows
            </label>
            <select
              id="columns-page-size"
              value={columnsPageSize}
              onChange={(event) => setColumnsPageSize(Number(event.target.value))}
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-teal-400"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setColumnsPage((prev) => Math.max(1, prev - 1))}
              disabled={columnsPageSafe <= 1}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {columnsPageSafe} / {columnsTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setColumnsPage((prev) => Math.min(columnsTotalPages, prev + 1))}
              disabled={columnsPageSafe >= columnsTotalPages}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-3 py-2">Target Table</th>
                <th className="px-3 py-2">Column Key</th>
                <th className="px-3 py-2">Inferred Type</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">License</th>
                <th className="px-3 py-2">Approved Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Applied</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4">
                    <div className="space-y-2 animate-pulse p-4">
                      {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                    <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="mt-2">No dynamic columns found for selected status.</p>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-900">
                    <td className="px-3 py-2 text-slate-200">{row.target_table}</td>
                    <td className="px-3 py-2 text-slate-200">{row.column_key}</td>
                    <td className="px-3 py-2 text-slate-300">{row.inferred_type}</td>
                    <td className="px-3 py-2 text-slate-300">{row.intel_sources?.source_name || '-'}</td>
                    <td className="px-3 py-2 text-slate-300">{row.intel_sources?.license_flag || '-'}</td>
                    <td className="px-3 py-2 text-slate-300">{row.approved_name || '-'}</td>
                    <td className="px-3 py-2 text-slate-300">{row.approval_status}</td>
                    <td className="px-3 py-2 text-slate-300">
                      {row.applied_at ? (
                        <span>
                          {row.applied_to_table}.{row.applied_column}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-300 hover:border-emerald-500"
                          onClick={() => updateRow(row, { approval_status: 'approved', approved_name: row.approved_name || row.column_key, approved_type: row.approved_type || row.inferred_type })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded border border-amber-700 px-2 py-1 text-xs text-amber-300 hover:border-amber-500"
                          onClick={() => {
                            const renamed = window.prompt('Enter approved name', row.approved_name || row.column_key);
                            if (!renamed) return;
                            updateRow(row, { approval_status: 'renamed', approved_name: renamed, approved_type: row.approved_type || row.inferred_type });
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          disabled={!['approved', 'renamed'].includes(row.approval_status)}
                          className="rounded border border-cyan-700 px-2 py-1 text-xs text-cyan-300 hover:border-cyan-500 disabled:opacity-50"
                          onClick={() => applyRow(row)}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          disabled={!row.applied_at}
                          className="rounded border border-blue-700 px-2 py-1 text-xs text-blue-300 hover:border-blue-500 disabled:opacity-50"
                          onClick={() => backfillRow(row)}
                        >
                          Backfill
                        </button>
                        <button
                          type="button"
                          className="rounded border border-rose-700 px-2 py-1 text-xs text-rose-300 hover:border-rose-500"
                          onClick={() => updateRow(row, { approval_status: 'rejected' })}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-teal-300">Schema Change Queue</h2>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            <p>
              Showing {queueRows.length === 0 ? 0 : queueStart + 1}-{Math.min(queueEnd, queueRows.length)} of {queueRows.length} queue records
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="queue-page-size" className="text-slate-400">
                Rows
              </label>
              <select
                id="queue-page-size"
                value={queuePageSize}
                onChange={(event) => setQueuePageSize(Number(event.target.value))}
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-teal-400"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setQueuePage((prev) => Math.max(1, prev - 1))}
                disabled={queuePageSafe <= 1}
                className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {queuePageSafe} / {queueTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setQueuePage((prev) => Math.min(queueTotalPages, prev + 1))}
                disabled={queuePageSafe >= queueTotalPages}
                className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-3 py-2">Target Table</th>
                <th className="px-3 py-2">Column</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2">Applied</th>
                <th className="px-3 py-2">Error</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {queueRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                    <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="mt-2">No schema changes queued yet.</p>
                  </td>
                </tr>
              ) : (
                pagedQueueRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-900">
                    <td className="px-3 py-2 text-slate-200">{row.target_table}</td>
                    <td className="px-3 py-2 text-slate-300">{row.target_column}</td>
                    <td className="px-3 py-2 text-slate-300">{row.target_sql_type}</td>
                    <td className="px-3 py-2 text-slate-300">{row.status}</td>
                    <td className="px-3 py-2 text-slate-400">{new Date(row.requested_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-400">{row.applied_at ? new Date(row.applied_at).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2 text-rose-300">{row.error_message || '-'}</td>
                    <td className="px-3 py-2">
                      {row.status === 'failed' ? (
                        <button
                          type="button"
                          className="rounded border border-amber-700 px-2 py-1 text-xs text-amber-300 hover:border-amber-500"
                          onClick={() => retryQueueRow(row)}
                        >
                          Retry
                        </button>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </section>
    </div>
  );
}
