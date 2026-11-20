'use client';

/**
 * EprNotificationBell — In-app notification bell for EPR events.
 * Polls /api/epr/notifications every 60s while mounted.
 * Drop this anywhere in the portal/admin nav.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  filing_status_updated: 'Filing status updated',
  document_approved: 'Document approved',
  document_rejected: 'Document rejected',
  audit_document_available: 'Audit document available',
  sla_breached: 'SLA breached',
};

const TYPE_ICONS: Record<string, string> = {
  filing_status_updated: '🔄',
  document_approved: '✅',
  document_rejected: '❌',
  audit_document_available: '📋',
  sla_breached: '⚠️',
};

interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

const POLL_INTERVAL = 60_000; // 60 seconds

export default function EprNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/epr/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread_count ?? 0);
    } catch {
      // network errors — silently ignore
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/epr/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }), headers: { 'Content-Type': 'application/json' } });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnread(0);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await fetch('/api/epr/notifications', { method: 'PATCH', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="text-xl" role="img" aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-semibold text-gray-900 text-sm">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <p className="text-2xl mb-2">🔔</p>
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map(n => (
                  <li
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.read_at ? 'bg-blue-50/40' : ''}`}
                    onClick={() => !n.read_at && markRead(n.id)}
                  >
                    <span className="text-lg shrink-0 mt-0.5" role="img" aria-hidden="true">
                      {TYPE_ICONS[n.type] ?? '•'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read_at ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {TYPE_LABELS[n.type] ?? n.type.replace(/_/g, ' ')}
                      </p>
                      {typeof n.payload?.category === 'string' && (
                        <p className="text-xs text-gray-500 mt-0.5">{n.payload.category}</p>
                      )}
                      <time className="text-xs text-gray-400 mt-0.5 block" dateTime={n.created_at}>
                        {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    {!n.read_at && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" aria-label="Unread" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
