'use client';

import React from 'react';

/**
 * InboxBanners
 *
 * Fetches undismissed announcements for the current user and renders
 * colored dismissible banner strips at the top of a dashboard layout.
 *
 * Message types:
 *   info        → Blue
 *   warning     → Amber
 *   announcement → Violet
 *   urgent      → Rose (pulsing border)
 */

import { useCallback, useEffect, useState } from 'react';

type MessageType = 'info' | 'warning' | 'announcement' | 'urgent';

interface Banner {
  recipientId: string;
  announcementId: string;
  title: string;
  body: string;
  messageType: MessageType;
  linkUrl: string | null;
  createdAt: string;
  isRead: boolean;
}

const TYPE_STYLES: Record<MessageType, { bar: string; icon: string; badge: string; label: string }> = {
  info: {
    bar:   'bg-blue-500/10 border-blue-500/30 text-blue-100',
    icon:  'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    label: 'Info',
  },
  warning: {
    bar:   'bg-amber-500/10 border-amber-500/30 text-amber-100',
    icon:  'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    label: 'Warning',
  },
  announcement: {
    bar:   'bg-violet-500/10 border-violet-500/30 text-violet-100',
    icon:  'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    label: 'Announcement',
  },
  urgent: {
    bar:   'bg-rose-500/10 border-rose-500/30 text-rose-100 animate-pulse-subtle',
    icon:  'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    label: 'Urgent',
  },
};

function TypeIcon({ type, className }: { type: MessageType; className?: string }) {
  const icons: Record<MessageType, React.ReactElement> = {
    info: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    warning: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    announcement: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    ),
    urgent: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2}>
      {icons[type]}
    </svg>
  );
}

export default function InboxBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/banners');
      if (!res.ok) return;
      const data = await res.json();
      setBanners(data.banners ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  async function dismiss(recipientId: string) {
    // Optimistic
    setDismissed((prev) => new Set([...prev, recipientId]));

    try {
      await fetch('/api/messages/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, action: 'dismiss' }),
      });
    } catch {}
  }

  const visible = banners.filter((b) => !dismissed.has(b.recipientId));

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-0 border-b border-slate-800/60">
      {visible.map((banner) => {
        const s = TYPE_STYLES[banner.messageType] ?? TYPE_STYLES.info;
        return (
          <div
            key={banner.recipientId}
            className={`relative flex items-start gap-3 border-b border-opacity-40 px-4 py-2.5 text-sm last:border-b-0 ${s.bar}`}
          >
            {/* Left accent bar */}
            <TypeIcon type={banner.messageType} className={`mt-0.5 ${s.icon}`} />

            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {/* Type badge */}
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.badge}`}>
                {s.label}
              </span>

              {/* Title */}
              <span className="font-semibold">{banner.title}</span>

              {/* Body */}
              <span className="text-xs opacity-80">{banner.body}</span>

              {/* Link */}
              {banner.linkUrl && (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-xs underline underline-offset-2 opacity-70 hover:opacity-100"
                >
                  Learn more →
                </a>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => dismiss(banner.recipientId)}
              aria-label="Dismiss"
              className="ml-2 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-50 hover:opacity-100 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
