'use client';

/**
 * /portal/epr-activity-log — Client-facing activity feed
 * Shows the client's own EPR activity (status changes, document events, comments).
 */

import { useState, useEffect, useCallback } from 'react';

const ACTION_LABELS: Record<string, string> = {
  filing_status_updated: 'Status Updated',
  document_uploaded: 'Document Uploaded',
  document_approved: 'Document Approved',
  document_rejected: 'Document Rejected',
  document_reviewed: 'Document Reviewed',
  document_deleted: 'Document Deleted',
  audit_document_updated: 'Audit Doc Updated',
  audit_document_deleted: 'Audit Doc Deleted',
  comment_posted: 'Comment Posted',
  sla_breached: 'SLA Breached',
};

const ACTION_COLORS: Record<string, string> = {
  filing_status_updated: 'bg-blue-100 text-blue-700',
  document_uploaded: 'bg-sky-100 text-sky-700',
  document_approved: 'bg-green-100 text-green-700',
  document_rejected: 'bg-red-100 text-red-700',
  document_reviewed: 'bg-amber-100 text-amber-700',
  document_deleted: 'bg-red-50 text-red-500',
  audit_document_updated: 'bg-purple-100 text-purple-700',
  audit_document_deleted: 'bg-red-50 text-red-500',
  comment_posted: 'bg-indigo-100 text-indigo-700',
  sla_breached: 'bg-orange-100 text-orange-700',
};

const ACTION_ICONS: Record<string, string> = {
  filing_status_updated: '🔄',
  document_uploaded: '📤',
  document_approved: '✅',
  document_rejected: '❌',
  document_reviewed: '🔍',
  document_deleted: '🗑️',
  audit_document_updated: '📋',
  audit_document_deleted: '🗑️',
  comment_posted: '💬',
  sla_breached: '⚠️',
};

interface ActivityEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  client_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

const PAGE_SIZE = 20;

export default function PortalActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (pageIndex: number, replace: boolean) => {
    pageIndex === 0 ? setLoading(true) : setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(pageIndex * PAGE_SIZE),
      });
      if (filterAction) params.set('action', filterAction);

      const res = await fetch(`/api/epr/activity-log?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data: ActivityEntry[] = await res.json();

      if (replace) {
        setEntries(data);
      } else {
        setEntries(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterAction]);

  // Reset and reload when filter changes
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
  }, [filterAction, fetchPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  };

  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  const describeChange = (entry: ActivityEntry): string | null => {
    const nv = entry.new_values;
    if (!nv) return null;
    if (entry.action === 'filing_status_updated' && nv.new_status) {
      return `→ ${nv.new_status}${nv.comment ? ` · "${nv.comment}"` : ''}`;
    }
    if (entry.action === 'document_uploaded' && nv.file_name) {
      return `File: ${nv.file_name}`;
    }
    if ((entry.action === 'document_approved' || entry.action === 'document_rejected') && nv.status) {
      return `Status: ${nv.status}${nv.admin_comment ? ` · "${nv.admin_comment}"` : ''}`;
    }
    if (entry.action === 'comment_posted' && nv.body) {
      const body = String(nv.body);
      return body.length > 80 ? body.slice(0, 77) + '…' : body;
    }
    return null;
  };

  const actionOptions = Object.keys(ACTION_LABELS);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-slate-500 text-sm mt-1">Your EPR compliance activity history</p>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filter by action type"
        >
          <option value="">All activity</option>
          {actionOptions.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">{error}</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-medium">No activity yet</p>
          <p className="text-sm mt-1">Actions on your EPR filings and documents will appear here</p>
        </div>
      ) : (
        <>
          <ol className="relative border-l border-slate-200 ml-3 space-y-0">
            {entries.map(entry => {
              const label = ACTION_LABELS[entry.action] ?? entry.action;
              const color = ACTION_COLORS[entry.action] ?? 'bg-slate-100 text-slate-600';
              const icon = ACTION_ICONS[entry.action] ?? '•';
              const change = describeChange(entry);
              const actor = entry.profiles?.full_name ?? 'System';

              return (
                <li key={entry.id} className="mb-6 ml-6">
                  {/* Timeline dot */}
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-white border-2 border-slate-200 rounded-full text-sm">
                    {icon}
                  </span>

                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                        {label}
                      </span>
                      <time
                        className="text-xs text-slate-400"
                        dateTime={entry.created_at}
                        title={new Date(entry.created_at).toLocaleString()}
                      >
                        {new Date(entry.created_at).toLocaleString(undefined, {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </time>
                    </div>

                    {change && (
                      <p className="mt-2 text-sm text-slate-700 leading-snug">{change}</p>
                    )}

                    <p className="mt-1 text-xs text-slate-400">
                      By {actor} · {entry.entity_type}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-5 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                aria-label="Load more activity"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
