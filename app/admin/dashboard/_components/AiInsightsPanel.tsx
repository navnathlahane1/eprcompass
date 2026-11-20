'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth/authenticatedFetch';

type Insight = {
  type: 'risk' | 'opportunity' | 'alert' | 'trend';
  priority: 1 | 2 | 3;
  title: string;
  detail: string;
  action: string;
};

function typeClass(type: Insight['type']) {
  if (type === 'risk') return 'border-l-red-500';
  if (type === 'alert') return 'border-l-orange-500';
  if (type === 'opportunity') return 'border-l-green-500';
  return 'border-l-blue-500';
}

function iconShape(type: Insight['type']) {
  if (type === 'risk') return 'bg-red-500';
  if (type === 'alert') return 'bg-orange-500';
  if (type === 'opportunity') return 'bg-green-500';
  return 'bg-blue-500';
}

export default function AiInsightsPanel({ context }: { context: any }) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [notice, setNotice] = useState('');
  const fetchedOnceRef = useRef(false);

  const [canRefresh, setCanRefresh] = useState(true);
  useEffect(() => {
    const update = () => setCanRefresh(!generatedAt || Date.now() - new Date(generatedAt).getTime() > 6 * 60 * 60 * 1000);
    const first = setTimeout(update, 0);
    const interval = setInterval(update, 60_000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [generatedAt]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/insights', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ context })
      });
      if (!response.ok) {
        setApiUnavailable(true);
        setNotice(response.status === 401 ? 'Your session has expired. Sign in again to load insights.' : 'Insights could not be loaded. Please retry.');
        return;
      }

      const payload = await response.json();
      if (response.ok) {
        setApiUnavailable(false);
        setNotice(payload.notice || '');
        setInsights(payload.insights || []);
        setGeneratedAt(payload.generated_at || null);
      }
    } catch {
      setApiUnavailable(true);
      setNotice('Insights could not be loaded. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    if (fetchedOnceRef.current) return;
    fetchedOnceRef.current = true;
    fetchInsights();
  }, [fetchInsights]);

  return (
    <section className="min-w-0 border-t border-zinc-200 py-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">AI Insights</h2>

      {notice ? (
        <p role="status" className="mb-2 text-xs text-amber-700">{notice}</p>
      ) : null}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {!apiUnavailable && !insights.length && <p className="text-xs text-zinc-500">No insights available yet.</p>}
          {insights.slice(0, 6).map((insight, idx) => {
            const isOpen = Boolean(expanded[idx]);
            return (
              <article
                key={`${insight.title}-${idx}`}
                className={`rounded-lg border border-zinc-200 border-l-4 p-3 ${typeClass(insight.type)}`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <span className={`mt-1 h-2.5 w-2.5 rounded-sm ${iconShape(insight.type)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="break-words text-sm font-semibold text-zinc-900">{insight.title}</p>
                      <span className="h-2 w-2 rounded-full bg-teal-500" title={`Priority ${insight.priority}`} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{insight.detail}</p>
                  </div>
                </button>

                {isOpen ? (
                  <p className="mt-2 inline-flex rounded-full bg-teal-100 px-2 py-1 text-[11px] font-semibold text-teal-800">
                    {insight.action}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={fetchInsights}
          disabled={!canRefresh || loading}
          title={!canRefresh ? 'Refreshes every 6 hours' : ''}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh insights
        </button>
      </div>
    </section>
  );
}
