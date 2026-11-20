'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { FORM_TYPES, getFormLabel } from './formTypes';

interface FormSubmission {
  id: string;
  module_key: string;
  source: string | null;
  status: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  submission_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

type Props = {
  initialType?: string;
};

function toFormPath(key: string) {
  return key === 'all' ? '/admin/forms' : `/admin/forms/${key}`;
}

export default function AdminFormsSubmissionsClient({ initialType = 'all' }: Props) {
  const [rows, setRows] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState(initialType);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveType(initialType || 'all');
  }, [initialType]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (activeType !== 'all') params.set('module_key', activeType);
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/admin/forms/submissions?${params.toString()}`, { method: 'GET' });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to load form submissions.');
      }

      setRows(Array.isArray(result?.rows) ? result.rows : []);
    } catch (err: any) {
      setRows([]);
      setError(String(err?.message || 'Failed to load form submissions.'));
    } finally {
      setLoading(false);
    }
  }, [activeType, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      load();
    }, search.trim() ? 250 : 0);

    return () => clearTimeout(timeout);
  }, [load, search]);

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    try {
      const response = await fetch('/api/admin/forms/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Could not update status.');
      }
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    } catch (err: any) {
      alert(err?.message || 'Could not update status.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteSubmission(id: string) {
    const ok = window.confirm('Delete this submission record? This action cannot be undone.');
    if (!ok) return;

    setSavingId(id);
    try {
      const response = await fetch('/api/admin/forms/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Could not delete submission.');
      }

      setRows((prev) => prev.filter((row) => row.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      alert(err?.message || 'Could not delete submission.');
    } finally {
      setSavingId(null);
    }
  }

  const selectedLabel = useMemo(() => getFormLabel(activeType), [activeType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Form Submissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeType === 'all'
              ? 'All public form submissions across the website'
              : `Showing submissions for ${selectedLabel}`}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-950"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FORM_TYPES.map((ft) => (
          <Link
            key={ft.key}
            href={toFormPath(ft.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeType === ft.key
                ? 'bg-blue-600 text-white'
                : 'border border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-950'
            }`}
          >
            {ft.label}
          </Link>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search by name, email, phone or source URL"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-md border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No submissions found.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-800/60 text-sm">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Form Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Source URL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((row) => {
                const sourceUrl =
                  String(row.submission_data?.source_url || row.submission_data?.sourceUrl || '') || '—';

                return (
                  <Fragment key={row.id}>
                    <tr className="hover:bg-slate-950">
                      <td className="px-4 py-3 font-medium text-slate-100">{row.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{row.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{row.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-blue-950/30 px-2 py-0.5 text-xs font-medium text-blue-300">
                          {getFormLabel(row.module_key)}
                        </span>
                      </td>
                      <td
                        className="max-w-[180px] truncate px-4 py-3 text-xs text-slate-500"
                        title={sourceUrl === '—' ? '' : sourceUrl}
                      >
                        {sourceUrl}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.status || 'new'}
                          onChange={(e) => updateStatus(row.id, e.target.value)}
                          disabled={savingId === row.id}
                          className="rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 disabled:opacity-60"
                        >
                          {['new', 'open', 'in_progress', 'closed', 'spam'].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          {expandedId === row.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteSubmission(row.id)}
                          disabled={savingId === row.id}
                          className="rounded border border-rose-700/50 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-950/30 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr>
                        <td colSpan={9} className="bg-slate-950 px-4 py-3">
                          <pre className="max-h-60 overflow-x-auto whitespace-pre-wrap text-xs text-slate-200">
                            {JSON.stringify(row.submission_data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-500">Showing {rows.length} submissions</p>
    </div>
  );
}
