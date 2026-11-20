'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type QueueItem = {
  id: string;
  company_id: string;
  enrichment_type: string;
  status: string;
  priority: number;
  retry_count: number;
  worker_id: string | null;
  error_message: string | null;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  triggered_by: string;
  intel_companies?: { canonical_name: string } | null;
};

type QueueResponse = {
  items: QueueItem[];
  total: number;
};

const STATUS_COLOR: Record<string, string> = {
  queued: 'border-blue-600/40 bg-blue-500/10 text-blue-300',
  processing: 'border-amber-600/40 bg-amber-500/10 text-amber-300',
  completed: 'border-emerald-600/40 bg-emerald-500/10 text-emerald-300',
  failed: 'border-red-600/40 bg-red-500/10 text-red-300',
  skipped: 'border-slate-600 bg-slate-800/40 text-slate-400',
};

const ENRICHMENT_LABELS: Record<string, string> = {
  entity_classification: 'Entity',
  web_crawl: 'Crawl',
  ai_product_extraction: 'Products',
  compliance_prediction: 'Compliance',
  brief_generation: 'Brief',
  sales_scoring: 'Score',
};

function fromNow(iso: string | null): string {
  if (!iso) return '—';
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function IntelQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('');
  const BASE = getIntelApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter) params.set('enrichment_type', typeFilter);
      const res = await fetch(`${BASE}/intel/enrichment/queue?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: QueueResponse = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [BASE, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/intel-enrichment" className="text-xs text-teal-400 hover:underline">
            ← Control Center
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-100">Queue Monitor</h1>
        </div>
        <button
          onClick={load}
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-teal-600"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
        >
          <option value="all">All statuses</option>
          <option value="active">Active (queued + processing)</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
        >
          <option value="">All types</option>
          {Object.entries(ENRICHMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="border-b border-slate-800 px-4 py-3 text-xs text-slate-400">
          {loading ? 'Loading…' : `${total} jobs`}
        </div>
        {!loading && items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No queue items matching filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Retries</th>
                  <th className="px-4 py-3">Triggered</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                    <td className="px-4 py-2">
                      <Link href={`/intel/companies/${item.company_id}`} className="font-medium text-teal-300 hover:underline text-xs">
                        {(item.intel_companies as any)?.canonical_name || item.company_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-300">
                      {ENRICHMENT_LABELS[item.enrichment_type] || item.enrichment_type}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[item.status] || 'border-slate-700 text-slate-400'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400">{item.priority}</td>
                    <td className="px-4 py-2 text-xs text-slate-400">{item.retry_count}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{item.triggered_by}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{fromNow(item.started_at)}</td>
                    <td className="px-4 py-2 text-xs text-red-400 max-w-[200px] truncate" title={item.error_message || ''}>
                      {item.error_message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
