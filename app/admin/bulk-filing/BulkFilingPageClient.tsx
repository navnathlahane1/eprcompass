'use client';

import { useMemo, useState } from 'react';

function toCsv(rows: any[]) {
  if (!rows.length) return '';
  const headers = ['client_id', 'name', 'status', 'message'];
  const lines = rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replaceAll('"', '""')}"`).join(','));
  return [headers.join(','), ...lines].join('\n');
}

export default function BulkFilingPageClient({ clientRows }: { clientRows: any[] }) {
  const [step, setStep] = useState(1);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pollId, setPollId] = useState<any>(null);

  const [filters, setFilters] = useState({ state: 'All', category: 'All', status: 'All' });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [config, setConfig] = useState({
    service_type: 'Filing',
    waste_category: 'Plastic',
    fy: '2026-27',
    filing_type: 'Quarterly'
  });

  const rows = useMemo(() => {
    return (clientRows || []).filter((row: any) => {
      const stateOk = filters.state === 'All' || row.state === filters.state;
      const categoryOk = filters.category === 'All' || row.category === filters.category;
      const statusOk = filters.status === 'All' || row.status === filters.status;
      return stateOk && categoryOk && statusOk;
    });
  }, [clientRows, filters]);

  const selectedRows = rows.filter((row: any) => selected[row.id]);

  const reviewRows = selectedRows.map((row: any) => {
    const hasVerifiedDoc = (row.documents || []).some((d: any) => d.status === 'Verified');
    const hasService = (row.services || []).some((s: any) => s.service_type === config.service_type && s.waste_category === config.waste_category);
    return {
      ...row,
      warnings: [
        !hasVerifiedDoc ? 'Missing verified documents' : null,
        !hasService ? 'Matching service record not found' : null,
        row.status === 'At Risk' ? 'Client is At Risk' : null
      ].filter(Boolean)
    };
  });

  const resultsRows = useMemo(() => {
    if (!job?.results) return [];
    return Object.entries(job.results).map(([clientId, value]: any) => {
      const client = (clientRows || []).find((c: any) => c.id === clientId);
      if (typeof value === 'string') {
        return { client_id: clientId, name: client?.name || clientId, status: value, message: '' };
      }
      return {
        client_id: clientId,
        name: client?.name || clientId,
        status: value?.status || '',
        message: value?.message || ''
      };
    });
  }, [job, clientRows]);

  async function startJob() {
    if (!reviewRows.length) return;
    setLoading(true);

    try {
      const response = await fetch('/api/admin/bulk-filing/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          service_type: config.service_type,
          category: config.waste_category,
          fy: config.fy,
          filing_type: config.filing_type,
          client_ids: reviewRows.map((row: any) => row.id)
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to start job');

      setJobId(payload.job_id);
      setJob({ id: payload.job_id, status: 'Running', results: {} });
      setStep(3);

      const timer = window.setInterval(async () => {
        const r = await fetch(`/api/admin/bulk-filing/${payload.job_id}`);
        const p = await r.json();
        if (!r.ok) return;
        setJob(p);
        if (['Completed', 'Failed', 'Partial'].includes(p.status)) {
          window.clearInterval(timer);
          setPollId(null);
        }
      }, 3000);
      setPollId(timer);
    } finally {
      setLoading(false);
    }
  }

  function toggleAllMatching(checked: boolean) {
    const patch: Record<string, boolean> = {};
    rows.forEach((row: any) => {
      patch[row.id] = checked;
    });
    setSelected((prev) => ({ ...prev, ...patch }));
  }

  function downloadCsv() {
    const csv = toCsv(resultsRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-filing-${jobId || 'results'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Bulk Filing</h1>
        <p className="mt-1 text-sm text-slate-400">Configure, review, execute, and monitor filing jobs.</p>
      </div>

      {step === 1 ? (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Step 1 — Configure</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select value={config.service_type} onChange={(e) => setConfig((p) => ({ ...p, service_type: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
              {['Registration', 'Filing', 'Renewal', 'Certificate', 'Consulting'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={config.waste_category} onChange={(e) => setConfig((p) => ({ ...p, waste_category: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
              {['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={config.fy} onChange={(e) => setConfig((p) => ({ ...p, fy: e.target.value }))} placeholder="FY" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
            <input value={config.filing_type} onChange={(e) => setConfig((p) => ({ ...p, filing_type: e.target.value }))} placeholder="Filing type" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <select value={filters.state} onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
              <option value="All">State: All</option>
              {[...new Set((clientRows || []).map((r: any) => r.state).filter(Boolean))].map((item: any) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
              <option value="All">Category: All</option>
              {[...new Set((clientRows || []).map((r: any) => r.category).filter(Boolean))].map((item: any) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
              <option value="All">Status: All</option>
              {[...new Set((clientRows || []).map((r: any) => r.status).filter(Boolean))].map((item: any) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => toggleAllMatching(true)} className="rounded border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200">Select all matching</button>
            <button onClick={() => toggleAllMatching(false)} className="rounded border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200">Deselect all</button>
            <span className="rounded-full bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-300">Selected: {selectedRows.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="py-2 pr-3"></th>
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Last Filed</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3"><input type="checkbox" checked={Boolean(selected[row.id])} onChange={(e) => setSelected((p) => ({ ...p, [row.id]: e.target.checked }))} /></td>
                    <td className="py-2 pr-3 text-slate-200">{row.name}</td>
                    <td className="py-2 pr-3 text-slate-200">{row.category}</td>
                    <td className="py-2 pr-3 text-slate-200">{row.last_filed ? new Date(row.last_filed).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="py-2 pr-3 text-slate-200">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button disabled={!selectedRows.length} onClick={() => setStep(2)} className="btn-primary">
            Continue to Review
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Step 2 — Review</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 pr-3">Warnings</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.map((row: any) => (
                  <tr key={row.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3 text-slate-200">{row.name}</td>
                    <td className="py-2 pr-3">
                      {row.warnings.length ? <div className="space-y-1">{row.warnings.map((w: string) => <p key={w} className="text-xs font-semibold text-amber-700">{w}</p>)}</div> : <span className="text-xs text-emerald-700">No warnings</span>}
                    </td>
                    <td className="py-2 pr-3">
                      <button onClick={() => setSelected((p) => ({ ...p, [row.id]: false }))} className="rounded border border-rose-700/50 px-2 py-1 text-xs font-semibold text-rose-300">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setStep(1)} className="rounded border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200">Back</button>
            <button disabled={loading || !reviewRows.length} onClick={startJob} className="btn-primary">
              {loading ? 'Starting...' : `Proceed with ${reviewRows.length} clients`}
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Step 3 — Execute</h2>
          <p className="text-sm text-slate-400">Job: {jobId}</p>
          <p className="text-sm text-slate-200">Status: <span className="font-semibold">{job?.status || 'Running'}</span></p>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, (resultsRows.length / Math.max(1, selectedRows.length)) * 100)}%` }} />
          </div>

          <div className="space-y-2">
            {resultsRows.map((row: any) => (
              <article key={row.client_id} className="rounded border border-slate-800 p-2 text-sm">
                <p className="font-semibold text-slate-100">{row.name}</p>
                <p className="text-xs text-slate-200">{row.status === 'done' ? '✓ Done' : row.status === 'processing' ? '⟳ Processing' : row.status === 'failed' ? '✗ Failed' : row.status === 'skipped' ? '⚠ Skipped' : row.status}</p>
                {row.message ? <p className="text-xs text-slate-400">{row.message}</p> : null}
              </article>
            ))}
          </div>

          {['Completed', 'Failed', 'Partial'].includes(job?.status || '') ? (
            <button onClick={downloadCsv} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Download Results CSV
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
