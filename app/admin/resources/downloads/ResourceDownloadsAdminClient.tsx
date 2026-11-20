'use client';

import { useEffect, useMemo, useState } from 'react';

type ReportRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  file_name: string;
  file_size_bytes: number | null;
  status: 'Draft' | 'Published';
  created_at: string;
  download_count: number;
};

type EventRow = {
  id: string;
  report_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  designation: string | null;
  purpose: string | null;
  created_at: string;
};

const defaultForm = {
  title: '',
  category: 'EPR',
  description: '',
  status: 'Draft'
};

function bytesToReadable(bytes?: number | null) {
  const value = Number(bytes || 0);
  if (!value) return 'N/A';
  const kb = 1024;
  const mb = kb * 1024;
  if (value >= mb) return `${(value / mb).toFixed(2)} MB`;
  if (value >= kb) return `${(value / kb).toFixed(1)} KB`;
  return `${value} B`;
}

function badgeClass(status: string) {
  return status === 'Published'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700';
}

export default function ResourceDownloadsAdminClient() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportMap = useMemo(() => {
    const map = new Map<string, ReportRow>();
    for (const row of reports) map.set(String(row.id), row);
    return map;
  }, [reports]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/resources/reports', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to load report downloads');

      setReports(Array.isArray(payload?.reports) ? payload.reports : []);
      setEvents(Array.isArray(payload?.events) ? payload.events : []);
    } catch (err: any) {
      setError(String(err?.message || 'Failed to load report downloads'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!file) {
      setError('Please select a PDF file.');
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('category', form.category);
      body.append('description', form.description);
      body.append('status', form.status);
      body.append('file', file);

      const response = await fetch('/api/admin/resources/reports', {
        method: 'POST',
        body
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Upload failed');

      setMessage('Report uploaded successfully.');
      setForm(defaultForm);
      setFile(null);
      await loadData();
    } catch (err: any) {
      setError(String(err?.message || 'Upload failed'));
    } finally {
      setUploading(false);
    }
  }

  async function toggleStatus(row: ReportRow) {
    setError(null);
    setMessage(null);
    try {
      const nextStatus = row.status === 'Published' ? 'Draft' : 'Published';
      const response = await fetch(`/api/admin/resources/reports/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Status update failed');

      setReports((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)));
      setMessage(`Report moved to ${nextStatus}.`);
    } catch (err: any) {
      setError(String(err?.message || 'Status update failed'));
    }
  }

  async function deleteReport(id: string) {
    setError(null);
    setMessage(null);
    const yes = window.confirm('Delete this report? This also removes the PDF file and cannot be undone.');
    if (!yes) return;

    try {
      const response = await fetch(`/api/admin/resources/reports/${id}`, {
        method: 'DELETE'
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Delete failed');

      setReports((prev) => prev.filter((item) => item.id !== id));
      setEvents((prev) => prev.filter((item) => item.report_id !== id));
      setMessage('Report deleted successfully.');
    } catch (err: any) {
      setError(String(err?.message || 'Delete failed'));
    }
  }

  return (
    <div className="space-y-5 px-4 pb-10 pt-4 sm:px-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Resource Download Manager</h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload PDF reports, publish them under Resources, and track who downloaded each file.
        </p>
      </section>

      {(error || message) && (
        <section className={`rounded-xl border p-3 text-sm ${error ? 'border-rose-800/40 bg-rose-950/30 text-rose-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Upload New Report</h2>
        <form className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onUpload}>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Report title"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
          />

          <input
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Category (EPR, Plastic, Battery...)"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          />

          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>

          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Short report description"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
            rows={3}
          />

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
            required
          />

          <button
            disabled={uploading}
            className="btn-primary"
          >
            {uploading ? 'Uploading...' : 'Upload Report'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Uploaded Reports</h2>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-slate-400">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No reports uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-950 text-left text-slate-400">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">File Size</th>
                  <th className="px-4 py-3">Downloads</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((row) => (
                  <tr key={row.id} className="border-t border-slate-800/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-100">{row.title}</p>
                      <p className="text-xs text-slate-500">{row.file_name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{row.category}</td>
                    <td className="px-4 py-3 text-slate-200">{bytesToReadable(row.file_size_bytes)}</td>
                    <td className="px-4 py-3 text-slate-200">{Number(row.download_count || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleStatus(row)}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-950"
                        >
                          {row.status === 'Published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => deleteReport(row.id)}
                          className="rounded-md border border-rose-700/50 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Recent Downloads</h2>
        </div>

        {events.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No download activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-950 text-left text-slate-400">
                  <th className="px-4 py-3">Downloaded Report</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {events.map((row) => (
                  <tr key={row.id} className="border-t border-slate-800/60">
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {reportMap.get(row.report_id)?.title || 'Unknown report'}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{row.full_name}</td>
                    <td className="px-4 py-3 text-slate-200">{row.email}</td>
                    <td className="px-4 py-3 text-slate-200">{row.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-200">{row.company || '-'}</td>
                    <td className="px-4 py-3 text-slate-200">{new Date(row.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
