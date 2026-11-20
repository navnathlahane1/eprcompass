'use client';

import { useEffect, useState } from 'react';
import TourTarget from '@/components/portal/tour/TourTarget';

type AnnouncementItem = {
  recipientId: string;
  seenTop: boolean;
  recipientCreatedAt: string;
  announcement: {
    id: string;
    title: string;
    body: string;
    imageUrl: string | null;
    linkUrl: string | null;
    createdAt: string;
    expiresAt: string;
  };
};

export default function UserAnnouncementsClient() {
  const [rows, setRows] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/announcements', { method: 'GET' });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || 'Could not load announcements.');
      }

      setRows(Array.isArray(result?.rows) ? result.rows : []);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || 'Could not load announcements.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteAnnouncement(recipientId: string) {
    const ok = window.confirm('Delete this announcement from your view?');
    if (!ok) return;

    try {
      const response = await fetch(`/api/announcements/${recipientId}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Could not delete announcement.');
      }

      setRows((prev) => prev.filter((row) => row.recipientId !== recipientId));
    } catch (err: any) {
      alert(err?.message || 'Could not delete announcement.');
    }
  }

  return (
    <main className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Announcements</h1>
        <p className="mt-1 text-sm text-slate-600">
          Announcements are available for one year unless you delete them from your account.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">My Announcements</h2>
          <button onClick={load} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
            Refresh
          </button>
        </div>

        {loading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error && rows.length === 0 ? <p className="text-sm text-slate-500">No announcements found.</p> : null}

        <TourTarget id="announcements-list" className="space-y-3">
          {rows.map((row) => (
            <article key={row.recipientId} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">{row.announcement.title}</h3>
                  <p className="mt-1 text-sm text-slate-700">{row.announcement.body}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(row.announcement.createdAt).toLocaleString()} • Expires {new Date(row.announcement.expiresAt).toLocaleDateString()}
                  </p>
                </div>

                {row.announcement.imageUrl ? (
                  <img
                    src={row.announcement.imageUrl}
                    alt={row.announcement.title}
                    className="h-20 w-28 rounded-lg object-cover"
                  />
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-3">
                {row.announcement.linkUrl ? (
                  <a href={row.announcement.linkUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">
                    Open link
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => deleteAnnouncement(row.recipientId)}
                  className="text-xs font-semibold text-red-700 underline"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </TourTarget>
      </section>
    </main>
  );
}
