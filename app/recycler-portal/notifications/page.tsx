'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Severity = 'info' | 'warning' | 'critical';
type NotifType = 'CPCB_ALERT' | 'CERT_RENEWAL' | 'TENDER_MATCH' | 'INVOICE';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  severity: Severity;
  created_at: string;
  read: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const SEVERITY_ICON: Record<Severity, string> = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
};

const TYPE_LABEL: Record<NotifType, string> = {
  CPCB_ALERT: 'CPCB Alert',
  CERT_RENEWAL: 'Cert Renewal',
  TENDER_MATCH: 'Tender Match',
  INVOICE: 'Invoice',
};

const TYPE_BADGE_COLOR: Record<NotifType, string> = {
  CPCB_ALERT: 'bg-purple-100 text-purple-700',
  CERT_RENEWAL: 'bg-amber-100 text-amber-700',
  TENDER_MATCH: 'bg-blue-100 text-blue-700',
  INVOICE: 'bg-red-100 text-red-700',
};

type FilterSeverity = 'all' | Severity;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterSeverity>('all');

  useEffect(() => {
    fetch('/api/recycler-portal/notifications')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread_count ?? 0);
      })
      .catch(() => setError('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.severity === filter);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Severity filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'critical', 'warning', 'info'] as FilterSeverity[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">✅</span>
          <p className="text-lg font-medium text-gray-700">You&apos;re all caught up</p>
          <p className="text-sm text-gray-500 mt-1">No notifications match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 transition-colors ${
                n.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5 shrink-0">{SEVERITY_ICON[n.severity]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className={`font-semibold text-sm ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_COLOR[n.type]}`}>
                      {TYPE_LABEL[n.type]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/recycler-portal/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
