'use client';

/**
 * InboxBell
 *
 * Bell icon button with unread count badge.
 * Opens/closes the InboxPanel on click.
 * Polls for unread count every 60 seconds.
 *
 * Usage:
 *   <InboxBell />
 */

import { useCallback, useEffect, useState } from 'react';
import InboxPanel from './InboxPanel';

export default function InboxBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/inbox?unread_count=1');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <InboxPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        onUnreadChange={setUnreadCount}
      />
    </>
  );
}
