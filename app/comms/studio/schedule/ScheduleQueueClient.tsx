'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn', twitter: 'X / Twitter', facebook: 'Facebook',
  instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok',
  threads: 'Threads',
};

interface QueueItem {
  id: string; platform: string; content_type: string; status: string;
  hook: string | null; topic: string | null; audience_segment: string | null;
  scheduled_at: string | null; created_at: string;
}

interface Props {
  items: QueueItem[];
  canPublish: boolean;
  canApprove: boolean;
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function countdown(target: string, now: number): string {
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return 'Due now';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function ScheduleQueueClient({ items: initial, canPublish, canApprove }: Props) {
  const router = useRouter();
  const now = useNow();
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState<Record<string, string>>({});
  const [error, setError]   = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleVal, setRescheduleVal] = useState('');
  const [runningCron, setRunningCron] = useState(false);
  const [cronMsg, setCronMsg] = useState('');

  const scheduled = items.filter(i => i.status === 'scheduled').sort((a, b) =>
    a.scheduled_at && b.scheduled_at
      ? new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      : a.scheduled_at ? -1 : 1
  );
  const approved = items.filter(i => i.status === 'approved');

  async function doAction(id: string, action: string, extra?: Record<string, unknown>) {
    setLoading(l => ({ ...l, [id]: action }));
    setError('');
    const res = await fetch(`/api/comms/content/${id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json();
    setLoading(l => { const n = { ...l }; delete n[id]; return n; });
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: data.newStatus, scheduled_at: extra?.scheduled_at as string ?? i.scheduled_at } : i));
      setRescheduleId(null);
      router.refresh();
    } else {
      setError(data.error || 'Action failed');
    }
  }

  async function runPublishQueue() {
    setRunningCron(true); setCronMsg('');
    const res = await fetch('/api/comms/publish-queue', { method: 'POST' });
    const d = await res.json();
    setRunningCron(false);
    setCronMsg(`Published ${d.published ?? 0} item${d.published !== 1 ? 's' : ''}${d.failed ? `, ${d.failed} failed` : ''}`);
    if (d.published > 0) {
      setItems(prev => prev.map(i =>
        (d.ids ?? []).includes(i.id) ? { ...i, status: 'published' } : i
      ));
    }
    setTimeout(() => setCronMsg(''), 5000);
  }

  const inputCls = 'rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/50';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Publish Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {scheduled.length} scheduled · {approved.length} approved &amp; waiting
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cronMsg && <p className="text-xs text-emerald-400">{cronMsg}</p>}
          {error && <p className="text-xs text-rose-400">{error}</p>}
          {canPublish && (
            <button onClick={runPublishQueue} disabled={runningCron}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition">
              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${runningCron ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {runningCron ? 'Publishing…' : 'Run Queue Now'}
            </button>
          )}
        </div>
      </div>

      {/* Scheduled section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          <p className="text-sm font-semibold text-slate-200">Scheduled</p>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-violet-500/10 text-violet-400">{scheduled.length}</span>
        </div>

        {scheduled.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1022]/40 p-8 text-center">
            <p className="text-sm text-slate-600">No content scheduled yet.</p>
            <p className="text-xs text-slate-700 mt-1">Approve content and set a publish time from the content detail page.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduled.map(item => {
              const isDue = item.scheduled_at ? new Date(item.scheduled_at).getTime() <= now : false;
              return (
                <div key={item.id} className={`rounded-xl border bg-[#0c1022] p-4 ${isDue ? 'border-amber-500/30' : 'border-slate-800/60'}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/comms/studio/content/${item.id}`} className="text-sm font-medium text-slate-100 hover:text-emerald-400 transition truncate">
                          {item.hook || item.topic || '(no hook)'}
                        </Link>
                        {isDue && <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">Due</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        {PLATFORM_LABELS[item.platform] ?? item.platform} · {item.content_type}
                        {item.audience_segment && ` · ${item.audience_segment}`}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.scheduled_at ? (
                        <>
                          <p className={`text-xs font-mono font-semibold ${isDue ? 'text-amber-400' : 'text-violet-400'}`}>
                            {countdown(item.scheduled_at, now)}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {new Date(item.scheduled_at).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-600">No time set</p>
                      )}
                    </div>
                  </div>

                  {/* Reschedule form */}
                  {rescheduleId === item.id && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <input type="datetime-local" value={rescheduleVal} onChange={e => setRescheduleVal(e.target.value)} className={inputCls} />
                      <button onClick={() => doAction(item.id, 'reschedule_update', { scheduled_at: rescheduleVal })}
                        disabled={!rescheduleVal || !!loading[item.id]}
                        className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition">
                        Save
                      </button>
                      <button onClick={() => setRescheduleId(null)} className="text-xs text-slate-500 hover:text-slate-300 px-2 transition">Cancel</button>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2 flex-wrap">
                    {canPublish && (
                      <button onClick={() => doAction(item.id, 'publish')} disabled={!!loading[item.id]}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                        {loading[item.id] === 'publish' ? 'Publishing…' : 'Publish Now'}
                      </button>
                    )}
                    {canApprove && (
                      <>
                        <button onClick={() => { setRescheduleId(item.id); setRescheduleVal(item.scheduled_at?.slice(0, 16) ?? ''); }}
                          className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition">
                          Reschedule
                        </button>
                        <button onClick={() => doAction(item.id, 'revert')} disabled={!!loading[item.id]}
                          className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition">
                          {loading[item.id] === 'revert' ? 'Working…' : 'Unschedule'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approved & waiting section */}
      {approved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <p className="text-sm font-semibold text-slate-200">Approved — Awaiting Schedule</p>
            <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-sky-500/10 text-sky-400">{approved.length}</span>
          </div>
          <div className="space-y-2">
            {approved.map(item => (
              <div key={item.id} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/comms/studio/content/${item.id}`} className="text-sm font-medium text-slate-100 hover:text-emerald-400 transition truncate block">
                    {item.hook || item.topic || '(no hook)'}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">
                    {PLATFORM_LABELS[item.platform] ?? item.platform} · {item.content_type}
                  </p>
                </div>
                <Link href={`/comms/studio/content/${item.id}`}
                  className="shrink-0 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition">
                  Schedule →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1022]/40 p-12 text-center space-y-2">
          <p className="text-sm text-slate-500">No approved or scheduled content yet.</p>
          <Link href="/comms/studio/content" className="text-xs text-emerald-500 hover:text-emerald-400 transition">
            Go to Content Studio →
          </Link>
        </div>
      )}
    </div>
  );
}
