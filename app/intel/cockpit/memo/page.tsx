'use client';

// Portfolio strategy memo viewer. Triggers POST /intel/strategy/portfolio
// to generate a new memo, and lists history via GET /intel/strategy/portfolio.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import PlatformPulseBanner from '../_components/PlatformPulseBanner';

type MemoPayload = {
  headline?: string;
  executive_summary?: string;
  where_to_double_down?: Array<{ scope?: string; rationale?: string; projected_inr?: number }>;
  where_to_pull_back?: Array<{ scope?: string; rationale?: string }>;
  watch_list?: Array<{ scope?: string; why?: string }>;
  decisions_required?: string[];
};

type BriefRow = {
  id: string;
  kind: string;
  fy: number | null;
  scope_filter: { state?: string | null; waste_category?: string | null };
  payload: MemoPayload;
  model_used: string | null;
  provider: string;
  cache_hit: boolean | null;
  input_tokens: number | null;
  output_tokens: number | null;
  generated_at: string;
};

function formatInr(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CockpitMemoPage() {
  const [generating, setGenerating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BriefRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fy, setFy] = useState<number>(new Date().getUTCFullYear());
  const [state, setState] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Not signed in. Please log in via /intel/login.');
        setLoadingHistory(false);
        return;
      }
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/strategy/portfolio?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const rows = (data.rows || []) as BriefRow[];
      setHistory(rows);
      if (rows.length > 0 && !selectedId) setSelectedId(rows[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memo history');
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in.');
      const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/strategy/portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          fy,
          state: state.trim() || null,
          waste_category: category.trim() || null
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      // Refresh history and select the new one
      await loadHistory();
      if (data.brief?.id) setSelectedId(data.brief.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Memo generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const selected = history.find((h) => h.id === selectedId) || history[0];
  const memo: MemoPayload = selected?.payload || {};
  const isFallback = selected?.provider === 'fallback';

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {/* ─── Header ───────────────────────────────────────────── */}
      <section className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <Link href="/intel/cockpit" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Cockpit</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Memo</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Portfolio strategy memo</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              AI-synthesised board memo over the cockpit-wide marts. Cites only numbers in
              the snapshot — never invents. History is persisted so you can compare quarter-over-quarter.
            </p>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="rounded-md border border-teal-400/40 bg-teal-500/15 px-4 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate new memo'}
          </button>
        </div>

        {/* Scope controls */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-300">FY</span>
            <select
              value={fy}
              onChange={(e) => setFy(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none"
            >
              {[fy - 1, fy, fy + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-300">State (optional)</span>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="leave blank for nationwide"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-300">Waste category (optional)</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Battery Waste"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none"
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {isFallback ? (
          <p className="mt-4 rounded-lg border border-amber-700/60 bg-amber-950/30 px-4 py-2 text-xs text-amber-200">
            This memo was produced by the deterministic fallback (no Anthropic API key configured). Set
            <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 text-amber-100">ANTHROPIC_API_KEY</code>
            or save <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-100">anthropic_api_key</code> in intel settings to enable narrative synthesis.
          </p>
        ) : null}
      </section>

      <PlatformPulseBanner />

      {/* ─── Memo + history ───────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Selected memo */}
        <section
          aria-labelledby="memo-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-6 xl:col-span-8"
        >
          {!selected ? (
            <div className="text-sm text-slate-400">
              {loadingHistory ? (
                <div className="mt-3 space-y-2 animate-pulse">
                  {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
                  ))}
                </div>
              ) : (
                <p>
                  No memos yet. Click <span className="text-teal-300">Generate new memo</span> to produce the first.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Generated {formatDateTime(selected.generated_at)} · {selected.model_used || '—'} · FY {selected.fy ?? '—'}
              </p>
              <h2
                id="memo-heading"
                className="mt-2 font-display text-2xl font-bold leading-tight text-slate-100 sm:text-3xl"
              >
                {memo.headline || '(headline missing)'}
              </h2>
              {memo.executive_summary ? (
                <p className="mt-4 text-sm leading-relaxed text-slate-200">{memo.executive_summary}</p>
              ) : null}

              {/* Double down */}
              {(memo.where_to_double_down ?? []).length > 0 ? (
                <section className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-300">
                    Where to double down
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {(memo.where_to_double_down ?? []).map((d, i) => (
                      <li
                        key={`dd-${i}`}
                        className="flex items-start justify-between gap-3 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-100">{d.scope || '—'}</p>
                          <p className="mt-1 text-xs text-slate-300">{d.rationale || '—'}</p>
                        </div>
                        {d.projected_inr ? (
                          <span className="shrink-0 text-sm font-bold tabular-nums text-teal-300">
                            {formatInr(d.projected_inr)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* Pull back */}
              {(memo.where_to_pull_back ?? []).length > 0 ? (
                <section className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-300">
                    Where to pull back
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {(memo.where_to_pull_back ?? []).map((d, i) => (
                      <li
                        key={`pb-${i}`}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3"
                      >
                        <p className="text-sm font-semibold text-slate-100">{d.scope || '—'}</p>
                        <p className="mt-1 text-xs text-slate-300">{d.rationale || '—'}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* Watch list */}
              {(memo.watch_list ?? []).length > 0 ? (
                <section className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                    Watch list
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {(memo.watch_list ?? []).map((d, i) => (
                      <li
                        key={`wl-${i}`}
                        className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
                      >
                        <p className="text-sm font-semibold text-slate-100">{d.scope || '—'}</p>
                        <p className="mt-1 text-xs text-slate-300">{d.why || '—'}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* Decisions */}
              {(memo.decisions_required ?? []).length > 0 ? (
                <section className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                    Decisions required
                  </h3>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-100">
                    {(memo.decisions_required ?? []).map((q, i) => (
                      <li key={`dq-${i}`}>{q}</li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {/* Telemetry */}
              <p className="mt-6 text-[10px] uppercase tracking-widest text-slate-500 tabular-nums">
                tokens — in {selected.input_tokens ?? '—'} · out {selected.output_tokens ?? '—'}
                {selected.cache_hit ? ' · cache hit' : ''}
              </p>
            </>
          )}
        </section>

        {/* History */}
        <section
          aria-labelledby="history-heading"
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-4"
        >
          <h2 id="history-heading" className="mb-3 text-sm font-semibold text-teal-300">
            History
          </h2>
          {loadingHistory ? (
            <div className="mt-3 space-y-2 animate-pulse">
              {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm text-slate-400">No memos generated yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => {
                const isActive = row.id === selectedId;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`w-full rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                        isActive
                          ? 'border-teal-400/40 bg-teal-500/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/70'
                      }`}
                    >
                      <p className="truncate text-xs font-semibold text-slate-100">
                        {row.payload?.headline || '(no headline)'}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500 tabular-nums">
                        {formatDateTime(row.generated_at)} · FY {row.fy ?? '—'}
                        {row.scope_filter?.state ? ` · ${row.scope_filter.state}` : ''}
                        {row.scope_filter?.waste_category ? ` · ${row.scope_filter.waste_category}` : ''}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
        <Link href="/intel/cockpit" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to Cockpit
        </Link>
      </div>
    </div>
  );
}
