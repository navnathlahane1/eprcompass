'use client';

/**
 * InboxPanel
 *
 * Slide-out notification center.
 * Shows announcements + direct messages for the current user.
 * Tabs: All | Unread | Direct Messages | Archived
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type MessageType = 'info' | 'warning' | 'announcement' | 'urgent';

interface InboxMessage {
  id: string;
  recipientId?: string;
  dmId?: string;
  type: 'announcement' | 'direct_message';
  messageType: MessageType;
  title: string;
  body: string;
  linkUrl: string | null;
  createdAt: string;
  isRead: boolean;
  isDismissed: boolean;
  isArchived: boolean;
  senderRole?: string;
  senderName?: string;
}

type Tab = 'all' | 'unread' | 'messages' | 'archived';

const TYPE_COLORS: Record<MessageType, string> = {
  info:         'border-l-blue-500 bg-blue-500/5',
  warning:      'border-l-amber-500 bg-amber-500/5',
  announcement: 'border-l-violet-500 bg-violet-500/5',
  urgent:       'border-l-rose-500 bg-rose-500/5',
};

const TYPE_BADGE: Record<MessageType, string> = {
  info:         'bg-blue-500/20 text-blue-300',
  warning:      'bg-amber-500/20 text-amber-300',
  announcement: 'bg-violet-500/20 text-violet-300',
  urgent:       'bg-rose-500/20 text-rose-300',
};

const TYPE_LABEL: Record<MessageType, string> = {
  info:         'Info',
  warning:      'Warning',
  announcement: 'Announcement',
  urgent:       'Urgent',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function InboxPanel({ isOpen, onClose, onUnreadChange }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (archived = false) => {
    setLoading(true);
    try {
      const url = archived ? '/api/messages/inbox?archived=1' : '/api/messages/inbox';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const msgs: InboxMessage[] = data.messages ?? [];
      setMessages(msgs);
      onUnreadChange?.(msgs.filter((m) => !m.isRead && !m.isArchived).length);
    } catch {}
    finally { setLoading(false); }
  }, [onUnreadChange]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages(tab === 'archived');
    }
  }, [isOpen, tab, fetchMessages]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  async function markAction(msg: InboxMessage, action: 'read' | 'archive') {
    const id = msg.id;
    try {
      await fetch(`/api/messages/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          return {
            ...m,
            isRead: action === 'read' ? true : m.isRead,
            isArchived: action === 'archive' ? true : m.isArchived,
          };
        })
      );
      const updated = messages.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          isRead: action === 'read' ? true : m.isRead,
          isArchived: action === 'archive' ? true : m.isArchived,
        };
      });
      onUnreadChange?.(updated.filter((m) => !m.isRead && !m.isArchived).length);
    } catch {}
  }

  async function markAllRead() {
    const unread = filtered.filter((m) => !m.isRead);
    await Promise.all(unread.map((m) => markAction(m, 'read')));
  }

  const filtered = messages.filter((m) => {
    if (tab === 'archived') return m.isArchived;
    if (m.isArchived) return false;
    if (tab === 'unread') return !m.isRead;
    if (tab === 'messages') return m.type === 'direct_message';
    return true;
  });

  const unreadCount = messages.filter((m) => !m.isRead && !m.isArchived).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-slate-800 bg-[#0c1022] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-sm font-semibold text-slate-100">Notifications</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && tab !== 'archived' && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-slate-500 hover:text-teal-400 transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/60 shrink-0">
          {([
            { key: 'all',      label: 'All' },
            { key: 'unread',   label: 'Unread' },
            { key: 'messages', label: 'Messages' },
            { key: 'archived', label: 'Archive' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 text-xs font-medium transition ${
                tab === key
                  ? 'border-b-2 border-teal-400 text-teal-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              Loading…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m8-7v7" />
              </svg>
              <p className="text-sm text-slate-500">
                {tab === 'archived' ? 'No archived notifications.' : 'All caught up!'}
              </p>
            </div>
          )}

          <div className="divide-y divide-slate-800/50">
            {filtered.map((msg) => {
              const typeKey = (msg.messageType ?? 'info') as MessageType;
              const colorClass = TYPE_COLORS[typeKey] ?? TYPE_COLORS.info;
              const badgeClass = TYPE_BADGE[typeKey] ?? TYPE_BADGE.info;
              const typeLabel = msg.type === 'direct_message'
                ? `From ${msg.senderName ?? 'User'}`
                : (TYPE_LABEL[typeKey] ?? 'Info');

              return (
                <div
                  key={msg.id}
                  className={`relative border-l-4 px-4 py-3 ${colorClass} ${!msg.isRead ? 'bg-opacity-100' : 'opacity-70'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                          {typeLabel}
                        </span>
                        {!msg.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-100 leading-snug">{msg.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400 leading-snug line-clamp-3">{msg.body}</p>
                      {msg.linkUrl && (
                        <a
                          href={msg.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-[11px] text-teal-400 hover:underline"
                        >
                          View details →
                        </a>
                      )}
                      <p className="mt-1.5 text-[10px] text-slate-600">{timeAgo(msg.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-1">
                      {!msg.isRead && (
                        <button
                          onClick={() => markAction(msg, 'read')}
                          title="Mark as read"
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-800 hover:text-teal-400 transition"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      {!msg.isArchived && (
                        <button
                          onClick={() => markAction(msg, 'archive')}
                          title="Archive"
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/60 px-4 py-2 shrink-0">
          <p className="text-[10px] text-slate-600 text-center">
            Notifications are kept for 6 months then archived automatically.
          </p>
        </div>
      </div>
    </>
  );
}
