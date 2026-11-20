'use client';

import { useEffect, useState } from 'react';

type TopRow = {
  recipientId: string;
  seenTop: boolean;
  announcement: {
    id: string;
    title: string;
    body: string;
    imageUrl: string | null;
    linkUrl: string | null;
  };
};

export default function TopAnnouncementBanner() {
  const [row, setRow] = useState<TopRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch('/api/announcements?topOnly=1', { method: 'GET' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) return;

        const nextRow = result?.row || null;
        if (!active || !nextRow) {
          setRow(null);
          setLoading(false);
          return;
        }

        setRow(nextRow);
        setLoading(false);

        // Mark as shown once, so it will not reappear on subsequent logins.
        fetch(`/api/announcements/${nextRow.recipientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_top_seen' })
        }).catch(() => {
          // Best effort only.
        });
      } catch {
        if (active) {
          setRow(null);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading || !row) return null;

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Announcement</p>
          <h2 className="mt-1 text-sm font-semibold text-amber-900">{row.announcement.title}</h2>
          <p className="mt-1 text-sm text-amber-800">{row.announcement.body}</p>
          <div className="mt-2 flex items-center gap-3">
            {row.announcement.linkUrl ? (
              <a
                href={row.announcement.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-amber-900 underline"
              >
                Open link
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setRow(null)}
              className="text-xs font-medium text-amber-800 underline"
            >
              Dismiss
            </button>
          </div>
        </div>

        {row.announcement.imageUrl ? (
          <img
            src={row.announcement.imageUrl}
            alt={row.announcement.title}
            className="h-20 w-28 rounded-lg object-cover"
          />
        ) : null}
      </div>
    </section>
  );
}
