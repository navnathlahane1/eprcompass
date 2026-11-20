'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type QueueStat = {
  status: string;
  enrichment_type: string;
  count: string;
  avg_seconds: number | null;
};

type Coverage = {
  enriched: string;
  pending: string;
  total: string;
};

type PendingReview = {
  pending_briefs: string;
  pending_classifications: string;
};

type Stats = {
  queue_stats: QueueStat[];
  coverage: Coverage;
  pending_review: PendingReview;
};

const ENRICHMENT_LABELS: Record<string, string> = {
  entity_classification: 'Entity Classification',
  web_crawl: 'Web Crawl',
  ai_product_extraction: 'Product AI',
  compliance_prediction: 'Compliance',
  brief_generation: 'Brief Gen',
  sales_scoring: 'Sales Score',
  sendpilot_contact_discovery: 'Contact Discovery',
};

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-300',
  processing: 'text-amber-300',
  queued: 'text-blue-300',
  failed: 'text-red-400',
  skipped: 'text-slate-500',
};

const ADMIN_SECTIONS = [
  { href: '/admin/intel-enrichment/queue', label: 'Queue Monitor', desc: 'Live view of enrichment jobs' },
  { href: '/admin/intel-enrichment/briefs', label: 'Brief Review', desc: 'Approve or reject AI-generated briefs' },
  { href: '/admin/intel-enrichment/classifications', label: 'Classifications', desc: 'Review entity type assignments' },
  { href: '/admin/intel-enrichment/products', label: 'Products', desc: 'Manage extracted product records' },
  { href: '/admin/intel-enrichment/taxonomy', label: 'Taxonomy', desc: 'Product taxonomy + search synonyms' },
  { href: '/admin/intel-enrichment/sendpilot', label: 'SendPilot Contacts', desc: 'LinkedIn contact discovery jobs + credits' },
];

export default function IntelEnrichmentControlCenterPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const BASE = getIntelApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const res = await fetch(`${BASE}/intel/admin/enrichment/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  const enrichedPct = stats?.coverage
    ? Math.round((Number(stats.coverage.enriched) / Math.max(Number(stats.coverage.total), 1)) * 100)
    : 0;

  const byType: Record<string, Record<string, number>> = {};
  for (const row of stats?.queue_stats || []) {
    if (!byType[row.enrichment_type]) byType[row.enrichment_type] = {};
    byType[row.enrichment_type][row.status] = Number(row.count);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Intel Enrichment Control Center</h1>
        <p className="mt-1 text-sm text-slate-400">Monitor AI enrichment pipeline — last 24 hours</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {error}
          <button onClick={load} className="ml-3 underline text-red-200 hover:text-white text-xs">Retry</button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Companies', value: loading ? '…' : stats?.coverage.total ?? '—' },
          {
            label: 'Enriched',
            value: loading ? '…' : `${stats?.coverage.enriched ?? 0} (${enrichedPct}%)`,
          },
          { label: 'Briefs Pending Review', value: loading ? '…' : stats?.pending_review.pending_briefs ?? '—' },
          { label: 'Classifications Pending', value: loading ? '…' : stats?.pending_review.pending_classifications ?? '—' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Enrichment coverage bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-teal-300">Overall Enrichment Coverage</p>
          <p className="text-sm font-bold text-slate-100">{enrichedPct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${enrichedPct}%` }}
          />
        </div>
        <div className="mt-2 flex gap-6 text-[11px] text-slate-500">
          <span>Enriched: {stats?.coverage.enriched ?? 0}</span>
          <span>Pending: {stats?.coverage.pending ?? 0}</span>
          <span>Total: {stats?.coverage.total ?? 0}</span>
        </div>
      </div>

      {/* Queue stats table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm font-semibold text-slate-300">Queue Jobs (Last 24h)</p>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : Object.keys(byType).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No queue activity in the last 24 hours.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Enrichment Type</th>
                  <th className="py-2 pr-4 text-emerald-400">Completed</th>
                  <th className="py-2 pr-4 text-blue-400">Queued</th>
                  <th className="py-2 pr-4 text-amber-400">Processing</th>
                  <th className="py-2 pr-4 text-red-400">Failed</th>
                  <th className="py-2 pr-4 text-slate-500">Skipped</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byType).map(([type, counts]) => (
                  <tr key={type} className="border-b border-slate-800/50">
                    <td className="py-2 pr-4 font-medium text-slate-200">
                      {ENRICHMENT_LABELS[type] || type}
                    </td>
                    {['completed', 'queued', 'processing', 'failed', 'skipped'].map((s) => (
                      <td key={s} className={`py-2 pr-4 ${STATUS_COLOR[s] || 'text-slate-300'}`}>
                        {counts[s] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-teal-600/50 hover:bg-slate-900"
          >
            <p className="font-semibold text-slate-100 group-hover:text-teal-300">{section.label}</p>
            <p className="mt-1 text-xs text-slate-500">{section.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
