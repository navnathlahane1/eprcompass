'use client';

import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type ExportRow = Record<string, unknown>;

export default function IntelExportPage() {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewRows, setPreviewRows] = useState<ExportRow[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);

  const previewColumns = useMemo(() => {
    if (!previewRows.length) return [];
    return Object.keys(previewRows[0]);
  }, [previewRows]);

  async function fetchIntelExport(path: string, token: string, init?: RequestInit) {
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
  }

  async function exportData() {
    setLoading(true);
    setError('');
    setSuccess('');

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      setError('No active session token found.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/intel/export', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        format,
        filters: {
          state: stateFilter || undefined,
          category: categoryFilter || undefined,
        },
        include_dynamic: true,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Export failed');
      setLoading(false);
      return;
    }

    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    setPreviewRows(rows.slice(0, 20));
    setBlockedCount(Number(payload.blocked_by_license_count || 0));

    if (format === 'csv') {
      const csvText = String(payload.csv || '');
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `intel_export_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'IntelExport');
      XLSX.writeFile(workbook, `intel_export_${Date.now()}.xlsx`);
    }

    setSuccess(`Export complete: ${rows.length} rows. Blocked by license: ${payload.blocked_by_license_count || 0}.`);
    setLoading(false);
  }

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
              <span className="text-[11px] text-slate-400">Export</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">License-Aware Export</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Client-facing export. Rows from <span className="text-amber-200">internal-use-only</span> sources are blocked.
              Each row includes source name, license flag, reliability tier, and notice confidence.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/intel/companies" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
              Companies
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Format</label>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value as 'csv' | 'xlsx')}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">XLSX</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">State Filter</label>
              <input
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
                placeholder="Maharashtra"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Category Filter</label>
              <input
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                placeholder="Plastic"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={exportData}
                disabled={loading}
                className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
              >
                {loading ? 'Exporting...' : 'Run Export'}
              </button>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
          {blockedCount > 0 ? (
            <p className="mt-2 text-xs text-amber-300">{blockedCount} rows were blocked due to source license restrictions.</p>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {previewColumns.length === 0 ? <th className="px-2 py-2">Preview</th> : previewColumns.map((column) => <th key={column} className="px-2 py-2">{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewRows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(1, previewColumns.length)} className="px-2 py-3 text-slate-500">
                      No preview data yet.
                    </td>
                  </tr>
                ) : (
                  previewRows.map((row, index) => (
                    <tr key={index} className="border-b border-slate-900">
                      {previewColumns.map((column) => (
                        <td key={`${index}-${column}`} className="px-2 py-2 text-slate-300">
                          {typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
