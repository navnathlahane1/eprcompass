'use client';

/**
 * LatestNotificationsWidget
 * ──────────────────────────
 * Embeddable sidebar/homepage widget showing the 5 most recent
 * EPR notifications. Fetches client-side with SWR-like pattern.
 */

import { useEffect, useState } from 'react';
import Link                    from 'next/link';
import { Bell, FileText, ExternalLink, Loader2 } from 'lucide-react';

interface NotifItem {
  id:             string;
  slug:           string;
  title:          string;
  epr_type:       string | null;
  published_date: string | null;
  authority_name?: string;
  has_file?:      boolean;
}

interface Props {
  eprType?:     string;
  limit?:       number;
  showHeader?:  boolean;
  className?:   string;
}

const EPR_BADGE_COLORS: Record<string, string> = {
  'Plastic':   'bg-green-50  text-green-700',
  'E-Waste':   'bg-blue-50   text-blue-700',
  'Battery':   'bg-yellow-50 text-yellow-700',
  'Tyre':      'bg-gray-50   text-gray-700',
  'Hazardous': 'bg-purple-50 text-purple-700',
  'Used-Oil':  'bg-orange-50 text-orange-700',
};

function formatDate(d?: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function LatestNotificationsWidget({
  eprType, limit = 5, showHeader = true, className = ''
}: Props) {
  const [items,   setItems]   = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (eprType) params.set('epr_type', eprType);

    fetch(`/api/notifications?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eprType, limit]);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              {eprType ? `${eprType} Notifications` : 'Latest Notifications'}
            </h3>
          </div>
          <Link href={`/notifications${eprType ? `?epr_type=${eprType}` : ''}`}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View all <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">No notifications yet</div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/notifications/${item.slug}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mt-0.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 group-hover:text-blue-600 font-medium line-clamp-2 leading-snug transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {item.epr_type && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${EPR_BADGE_COLORS[item.epr_type] || 'bg-gray-50 text-gray-600'}`}>
                      {item.epr_type}
                    </span>
                  )}
                  {item.published_date && (
                    <span className="text-[11px] text-gray-400">{formatDate(item.published_date)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-50">
          <Link
            href={`/notifications${eprType ? `?epr_type=${eprType}` : ''}`}
            className="block text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1 hover:bg-blue-50 rounded-lg transition-colors">
            View all EPR notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
