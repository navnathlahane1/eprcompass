'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type Brief = {
  id: string;
  company_id: string;
  brief_text: string;
  word_count: number;
  confidence: number;
  generation_model: string;
  review_status: string;
  is_active: boolean;
  hallucination_flags: Array<{ flag_type: string; description: string }>;
  grounding_facts: Array<{ fact: string; confidence: number }>;
  created_at: string;
  intel_companies?: { canonical_name: string; state: string | null } | null;
};

const REVIEW_STATUS_COLOR: Record<string, string> = {
  pending: 'border-amber-600/40 bg-amber-500/10 text-amber-300',
  approved: 'border-emerald-600/40 bg-emerald-500/10 text-emerald-300',
  rejected: 'border-red-600/40 bg-red-500/10 text-red-300',
  override: 'border-purple-600/40 bg-purple-500/10 text-purple-300',
};

export default function IntelBriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const BASE = getIntelApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${BASE}/intel/admin/briefs/pending?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBriefs(data.briefs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load briefs');
    } finally {
      setLoading(false);
    }
  }, [BASE, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function reviewBrief(brief: Brief, action: 'approve' | 'reject') {
    setActionBusy(brief.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in.');
      const res = await fetch(`${BASE}/intel/companies/${brief.company_id}/brief/${brief.id}/review`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setBriefs((prev) => prev.filter((b) => b.id !== brief.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/intel-enrichment" className="text-xs text-teal-400 hover:underline">
            ← Control Center
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-100">Brief Review</h1>
          <p className="mt-0.5 text-sm text-slate-400">Review and approve AI-generated company briefs before activation</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button onClick={load} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-600">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center">
          <p className="text-sm text-slate-400">No briefs with status: {statusFilter}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefs.map((brief) => {
            const company = brief.intel_companies as any;
            const isExpanded = expandedId === brief.id;
            const busy = actionBusy === brief.id;

            return (
              <div key={brief.id} className="rounded-xl border border-slate-800 bg-slate-900/70">
                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/intel/companies/${brief.company_id}`} className="font-semibold text-teal-300 hover:underline text-sm">
                        {company?.canonical_name || brief.company_id.slice(0, 12)}
                      </Link>
                      {company?.state && (
                        <span className="text-[11px] text-slate-500">{company.state}</span>
                      )}
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${REVIEW_STATUS_COLOR[brief.review_status] || ''}`}>
                        {brief.review_status}
                      </span>
                      {brief.is_active && (
                        <span className="rounded border border-teal-700/50 bg-teal-500/10 px-1.5 py-0.5 text-[10px] text-teal-300">
                          Active
                        </span>
                      )}
                      {brief.hallucination_flags.length > 0 && (
                        <span className="rounded border border-orange-700/50 bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-300">
                          {brief.hallucination_flags.length} flag(s)
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200">{brief.brief_text}</p>
                    <div className="mt-2 flex gap-4 text-[10px] text-slate-500">
                      <span>{brief.word_count}w</span>
                      <span>Confidence: {Math.round(brief.confidence * 100)}%</span>
                      <span>{brief.generation_model}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : brief.id)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {isExpanded ? 'Hide details' : `${brief.grounding_facts.length} grounding facts`}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Grounding Facts</p>
                        <ul className="space-y-1">
                          {brief.grounding_facts.map((f, i) => (
                            <li key={i} className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{f.fact}</span>
                              <span className="text-slate-500">{Math.round(f.confidence * 100)}%</span>
                            </li>
                          ))}
                        </ul>
                        {brief.hallucination_flags.length > 0 && (
                          <>
                            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-orange-400 mb-1">Flags</p>
                            {brief.hallucination_flags.map((f, i) => (
                              <p key={i} className="text-[11px] text-orange-300">{f.flag_type}: {f.description}</p>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {brief.review_status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        disabled={busy}
                        onClick={() => reviewBrief(brief, 'approve')}
                        className="rounded-md border border-emerald-700/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {busy ? '…' : 'Approve + Activate'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => reviewBrief(brief, 'reject')}
                        className="rounded-md border border-red-700/50 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {busy ? '…' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
