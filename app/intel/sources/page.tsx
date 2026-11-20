'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
// getApiBaseUrl removed — Google Sheet ingestion now uses a Next.js API route (relative URL)

type IntelSourceType =
  | 'government_order'
  | 'portal_scrape'
  | 'manual_entry'
  | 'bulk_upload'
  | 'vendor_dataset'
  | 'news'
  | 'exchange_filing'
  | 'social';

type LicenseFlag = 'internal-use-only' | 'shareable' | 'time-limited';

type IntelSourceRow = {
  id: string;
  source_name: string;
  source_type: IntelSourceType;
  vendor_name: string | null;
  license_flag: LicenseFlag;
  reliability_tier: number;
  refresh_cadence: string | null;
  active: boolean;
  updated_at: string;
};

const SOURCE_TYPES: IntelSourceType[] = [
  'government_order',
  'portal_scrape',
  'manual_entry',
  'bulk_upload',
  'vendor_dataset',
  'news',
  'exchange_filing',
  'social'
];

const LICENSE_FLAGS: LicenseFlag[] = ['internal-use-only', 'shareable', 'time-limited'];

export default function IntelSourcesPage() {
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [sources, setSources] = useState<IntelSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importingFromSheet, setImportingFromSheet] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState<IntelSourceType>('vendor_dataset');
  const [vendorName, setVendorName] = useState('');
  const [licenseFlag, setLicenseFlag] = useState<LicenseFlag>('internal-use-only');
  const [reliabilityTier, setReliabilityTier] = useState(3);
  const [refreshCadence, setRefreshCadence] = useState('monthly');
  const [sheetSourceId, setSheetSourceId] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');

  useEffect(() => {
    if (!sheetSourceId && sources.length > 0) {
      setSheetSourceId(sources[0].id);
    }
  }, [sheetSourceId, sources]);

  async function loadSources() {
    setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('intel_sources')
      .select('*')
      .order('updated_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setSources((data || []) as IntelSourceRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadSources();
  }, []);

  async function handleCreateSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const { error: insertError } = await supabase.from('intel_sources').insert({
      source_name: sourceName.trim(),
      source_type: sourceType,
      vendor_name: vendorName.trim() || null,
      license_flag: licenseFlag,
      reliability_tier: reliabilityTier,
      refresh_cadence: refreshCadence.trim() || null,
      active: true,
      updated_at: new Date().toISOString()
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSourceName('');
    setVendorName('');
    setRefreshCadence('monthly');
    setSuccess('Source created.');
    setSaving(false);
    await loadSources();
  }

  async function toggleSource(source: IntelSourceRow) {
    setError('');
    setSuccess('');

    const { error: updateError } = await supabase
      .from('intel_sources')
      .update({ active: !source.active, updated_at: new Date().toISOString() })
      .eq('id', source.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(source.active ? 'Source deactivated.' : 'Source activated.');
    await loadSources();
  }

  async function handleImportFromGoogleSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImportingFromSheet(true);
    setError('');
    setSuccess('');

    try {
      if (!sheetSourceId) {
        setError('Select a source before importing.');
        setImportingFromSheet(false);
        return;
      }

      if (!googleSheetUrl.trim()) {
        setError('Google Sheet URL is required.');
        setImportingFromSheet(false);
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        setError('No active Intel session found. Please log in again.');
        setImportingFromSheet(false);
        return;
      }

      // Use relative URL — handled by Next.js API route, no Express backend needed
      const response = await fetch('/api/intel/ingest/google-sheet', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          source_id: sheetSourceId,
          google_sheet_url: googleSheetUrl.trim()
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Google Sheet import failed');
        setImportingFromSheet(false);
        return;
      }

      const counts = payload.counts || {};
      setSuccess(
        `Imported from Google Sheet. Job ${payload.job_id}. Inserted ${counts.insertedRows || 0}, updated ${counts.updatedRows || 0}, skipped ${counts.skippedRows || 0}.`
      );
      setGoogleSheetUrl('');
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Google Sheet import failed');
    } finally {
      setImportingFromSheet(false);
    }
  }

  const activeCount = useMemo(() => sources.filter((item) => item.active).length, [sources]);
  const totalPages = Math.max(1, Math.ceil(sources.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedSources = sources.slice(pageStart, pageEnd);

  useEffect(() => {
    setCurrentPage(1);
  }, [sources.length, pageSize]);

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
              <span className="text-[11px] text-slate-400">Sources</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-violet-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Source Registry</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">Manage data source provenance, licensing, and reliability tiers.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/intel/templates" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
              Mapping Templates
            </Link>
            <Link href="/intel/upload" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
              Upload & Map
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-teal-400" />
            <p className="text-xs text-slate-400">Total Sources</p>
            <p className="mt-1 text-2xl font-semibold">{sources.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-teal-400" />
            <p className="text-xs text-slate-400">Active Sources</p>
            <p className="mt-1 text-2xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2.5 h-0.5 w-7 rounded-full bg-teal-400" />
            <p className="text-xs text-slate-400">Inactive Sources</p>
            <p className="mt-1 text-2xl font-semibold">{Math.max(0, sources.length - activeCount)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-1">
            <h2 className="text-sm font-semibold text-teal-300">Create Source</h2>
            <form className="mt-4 space-y-3" onSubmit={handleCreateSource}>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Source Name</label>
                <input
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="CPCB Show Cause Notices"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Source Type</label>
                <select
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value as IntelSourceType)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  {SOURCE_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Vendor Name</label>
                <input
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="Tofler / ZaubaCorp / Internal"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">License Flag</label>
                <select
                  value={licenseFlag}
                  onChange={(event) => setLicenseFlag(event.target.value as LicenseFlag)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  {LICENSE_FLAGS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Reliability Tier (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={reliabilityTier}
                  onChange={(event) => setReliabilityTier(Number.parseInt(event.target.value || '3', 10))}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Refresh Cadence</label>
                <input
                  value={refreshCadence}
                  onChange={(event) => setRefreshCadence(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="daily / weekly / monthly"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Create Source'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <h3 className="text-sm font-semibold text-teal-300">Import From Google Sheet</h3>
              <p className="mt-1 text-xs text-slate-400">Paste a Google Sheet link and ingest it directly into Intel data tables.</p>
              <form className="mt-3 space-y-3" onSubmit={handleImportFromGoogleSheet}>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Source</label>
                  <select
                    value={sheetSourceId}
                    onChange={(event) => setSheetSourceId(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    required
                  >
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.source_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Google Sheet URL</label>
                  <input
                    value={googleSheetUrl}
                    onChange={(event) => setGoogleSheetUrl(event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={importingFromSheet}
                  className="w-full rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
                >
                  {importingFromSheet ? 'Importing...' : 'Import From Sheet'}
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-teal-300">Registered Sources</h2>
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
              <p>
                Showing {sources.length === 0 ? 0 : pageStart + 1}-{Math.min(pageEnd, sources.length)} of {sources.length}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sources-page-size" className="text-slate-400">
                  Rows
                </label>
                <select
                  id="sources-page-size"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
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
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPageSafe <= 1}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {currentPageSafe} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPageSafe >= totalPages}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">License</th>
                    <th className="px-3 py-2">Tier</th>
                    <th className="px-3 py-2">Cadence</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4">
                        <div className="space-y-2 animate-pulse p-4">
                          {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
                        </div>
                      </td>
                    </tr>
                  ) : sources.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                        <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="mt-2">No sources registered yet.</p>
                      </td>
                    </tr>
                  ) : (
                    pagedSources.map((source) => (
                      <tr key={source.id} className="border-b border-slate-900">
                        <td className="px-3 py-2 font-medium text-slate-100">{source.source_name}</td>
                        <td className="px-3 py-2 text-slate-300">{source.source_type}</td>
                        <td className="px-3 py-2 text-slate-300">{source.vendor_name || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{source.license_flag}</td>
                        <td className="px-3 py-2 text-slate-300">{source.reliability_tier}</td>
                        <td className="px-3 py-2 text-slate-300">{source.refresh_cadence || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-1 text-xs ${source.active ? 'bg-emerald-600/20 text-emerald-300' : 'bg-rose-600/20 text-rose-300'}`}>
                            {source.active ? 'active' : 'inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300"
                            onClick={() => toggleSource(source)}
                          >
                            {source.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
