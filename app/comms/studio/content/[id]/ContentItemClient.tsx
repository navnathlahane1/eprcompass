'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PostMetricsPanel from '@/components/comms/PostMetricsPanel';
import CommentThread from '@/components/comms/CommentThread';

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-slate-700/60 text-slate-400 border border-slate-700',
  in_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  approved:  'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  scheduled: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  published: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  archived:  'bg-slate-800/60 text-slate-600 border border-slate-800',
};

const WORKFLOW_ACTIONS: Record<string, Array<{ action: string; label: string; color: string }>> = {
  draft:     [{ action: 'submit_review', label: 'Submit for Review', color: 'bg-amber-600 hover:bg-amber-500' }],
  in_review: [
    { action: 'reject',  label: 'Reject → Draft',  color: 'bg-slate-700 hover:bg-slate-600 border border-slate-600' },
    { action: 'approve', label: 'Approve',          color: 'bg-sky-600 hover:bg-sky-500' },
  ],
  approved:  [
    { action: 'schedule', label: 'Schedule',     color: 'bg-violet-600 hover:bg-violet-500' },
    { action: 'publish',  label: 'Publish Now',  color: 'bg-emerald-600 hover:bg-emerald-500' },
  ],
  scheduled: [
    { action: 'revert',  label: 'Unschedule',  color: 'bg-slate-700 hover:bg-slate-600 border border-slate-600' },
    { action: 'publish', label: 'Publish Now', color: 'bg-emerald-600 hover:bg-emerald-500' },
  ],
  published: [{ action: 'archive', label: 'Archive', color: 'bg-slate-700 hover:bg-slate-600 border border-slate-600' }],
};

interface Permissions { canEdit: boolean; canApprove: boolean; canPublish: boolean; }
interface Connection  { id: string; platform: string; platform_account_id: string | null; comms_accounts: { name: string } | { name: string }[] | null; }

export default function ContentItemClient({ item, history, permissions, currentUserId, userRole = '', connections = [], postMetrics = null, commentCount = 0 }: {
  item: any; history: any[]; permissions: Permissions; currentUserId: string; userRole?: string; connections?: Connection[]; postMetrics?: any; commentCount?: number;
}) {
  const router = useRouter();
  const [activeVariant, setActiveVariant]   = useState(-1);
  const [actionLoading, setActionLoading]   = useState('');
  const [actionError, setActionError]       = useState('');
  const [scheduleDate, setScheduleDate]     = useState('');
  const [showSchedule, setShowSchedule]     = useState(false);
  const [showPublish, setShowPublish]       = useState(false);
  const [selectedConn, setSelectedConn]     = useState(connections[0]?.id ?? '');
  const [status, setStatus]                 = useState(item.status);
  const [platformPostId, setPlatformPostId] = useState(item.platform_post_id ?? '');
  const [notes, setNotes]                   = useState('');
  const [duplicating, setDuplicating]       = useState(false);
  const [showRepurpose, setShowRepurpose]   = useState(false);
  const [repurposePlatform, setRepurposePlatform] = useState('');

  const variants = item.variants ?? [];
  const current  = activeVariant === -1 ? item : variants[activeVariant];

  async function handleAction(action: string) {
    if (action === 'schedule' && !scheduleDate) { setShowSchedule(true); return; }
    if (action === 'publish') {
      if (connections.length > 0 && !showPublish) { setShowPublish(true); return; }
      // Real platform publish
      if (connections.length > 0 && selectedConn) {
        setActionLoading('publish'); setActionError('');
        const res = await fetch(`/api/comms/content/${item.id}/publish`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ connection_id: selectedConn }),
        });
        const data = await res.json();
        setActionLoading('');
        if (res.ok) {
          setStatus('published');
          setPlatformPostId(data.platformPostId ?? '');
          setShowPublish(false);
        } else {
          setActionError(data.error || 'Publish failed');
        }
        return;
      }
    }
    // All other workflow actions go through approve route
    setActionLoading(action); setActionError('');
    const res = await fetch(`/api/comms/content/${item.id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, notes, scheduled_at: action === 'schedule' ? scheduleDate : undefined }),
    });
    const data = await res.json();
    setActionLoading('');
    if (res.ok) { setStatus(data.newStatus); setShowSchedule(false); setShowPublish(false); setNotes(''); }
    else setActionError(data.error || 'Action failed');
  }

  async function handleDuplicate(overridePlatform?: string) {
    setDuplicating(true); setActionError('');
    const res = await fetch(`/api/comms/content/${item.id}/duplicate`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(overridePlatform ? { platform: overridePlatform } : {}),
    });
    const data = await res.json();
    setDuplicating(false);
    if (res.ok) {
      router.push(`/comms/studio/content/${data.contentId}`);
    } else {
      setActionError(data.error || 'Duplicate failed');
    }
  }

  const PLATFORMS = ['linkedin','twitter','facebook','instagram','youtube','tiktok','threads'];
  const canDoApprovalActions = permissions.canApprove || permissions.canPublish;
  const actions = WORKFLOW_ACTIONS[status] ?? [];
  const filteredActions = actions.filter(a => {
    if (['approve','reject','schedule','revert','archive'].includes(a.action)) return permissions.canApprove;
    if (a.action === 'publish') return permissions.canPublish;
    return true; // submit_review — any creator
  });

  const inputCls = 'rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/50';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/comms/studio/content" className="text-slate-500 hover:text-slate-200 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-100 capitalize">{item.platform} · {item.content_type}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status] ?? ''}`}>
                {status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {item.topic && <span>{item.topic} · </span>}
              {item.profiles?.full_name && <span>{item.profiles.full_name} · </span>}
              {new Date(item.created_at).toLocaleDateString()}
              {item.generated_by === 'ai' && (
                <span className="ml-1 rounded px-1 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono text-[9px]">AI</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowRepurpose(r => !r); setRepurposePlatform(''); }}
          title="Duplicate or repurpose this content"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition shrink-0"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Duplicate
        </button>
      </div>

      {/* Duplicate / repurpose */}
      {showRepurpose && (
        <div className="flex items-center gap-2 flex-wrap rounded-xl border border-slate-800/60 bg-[#0c1022] p-3">
          <p className="text-xs font-semibold text-slate-400 shrink-0">Repurpose for:</p>
          <select value={repurposePlatform} onChange={e => setRepurposePlatform(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50">
            <option value="">— same platform —</option>
            {PLATFORMS.filter(p => p !== item.platform).map(p => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </select>
          <button onClick={() => handleDuplicate(repurposePlatform || undefined)} disabled={duplicating}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
            {duplicating ? 'Duplicating…' : 'Duplicate'}
          </button>
          <button onClick={() => setShowRepurpose(false)} className="text-xs text-slate-500 hover:text-slate-300 px-2 transition">Cancel</button>
        </div>
      )}

      {/* Variant tabs */}
      {variants.length > 0 && (
        <div className="flex gap-1 border-b border-slate-800/60">
          {[{ label: 'Main', idx: -1 }, ...variants.map((v: any, i: number) => ({ label: v.label || `Variant ${String.fromCharCode(65+i)}`, idx: i }))].map(t => (
            <button key={t.idx} onClick={() => setActiveVariant(t.idx)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeVariant === t.idx ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content display */}
      <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5 space-y-4">
        {current?.hook && (
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Hook</p>
            <p className="text-sm font-semibold text-slate-100 leading-snug">{current.hook}</p>
          </div>
        )}
        {current?.body && (
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Body</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{current.body}</p>
          </div>
        )}
        {current?.cta && (
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">CTA</p>
            <p className="text-sm text-emerald-400">{current.cta}</p>
          </div>
        )}
        {current?.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
            {current.hashtags.map((h: string, i: number) => (
              <span key={i} className="rounded px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400">{h}</span>
            ))}
          </div>
        )}
        {item.image_brief && (
          <div className="pt-2 border-t border-slate-800/60">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Image Brief</p>
            <p className="text-xs text-amber-400/80 italic leading-relaxed">{item.image_brief}</p>
          </div>
        )}
      </div>

      {/* Published badge */}
      {status === 'published' && platformPostId && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-400">Published successfully</p>
            <p className="text-[10px] text-slate-500 font-mono truncate">Post ID: {platformPostId}</p>
          </div>
        </div>
      )}

      {/* Approval workflow */}
      {filteredActions.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400">Workflow Actions</p>

          {showSchedule && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                className={inputCls} />
              <button onClick={() => handleAction('schedule')} disabled={!scheduleDate || !!actionLoading}
                className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition">
                Confirm
              </button>
              <button onClick={() => setShowSchedule(false)} className="text-xs text-slate-500 hover:text-slate-300 transition px-2">Cancel</button>
            </div>
          )}

          {showPublish && connections.length > 0 && (
            <div className="rounded-lg border border-emerald-500/20 bg-slate-900/60 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Select account to publish from</p>
              <select value={selectedConn} onChange={e => setSelectedConn(e.target.value)}
                className={inputCls + ' w-full'}>
                {connections.map(c => (
                  <option key={c.id} value={c.id}>
                    {(Array.isArray(c.comms_accounts) ? c.comms_accounts[0]?.name : c.comms_accounts?.name) ?? c.platform_account_id ?? c.id}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={() => handleAction('publish')} disabled={!selectedConn || !!actionLoading}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                  {actionLoading === 'publish' ? 'Publishing…' : 'Publish Now'}
                </button>
                <button onClick={() => setShowPublish(false)} className="text-xs text-slate-500 hover:text-slate-300 px-2 transition">Cancel</button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] text-slate-600 mb-1">Notes (optional)</label>
            <input type="text" placeholder="Reason for rejection, feedback…" value={notes}
              onChange={e => setNotes(e.target.value)} className={inputCls + ' w-full'} />
          </div>

          <div className="flex flex-wrap gap-2">
            {filteredActions.map(a => (
              <button key={a.action} onClick={() => handleAction(a.action)}
                disabled={!!actionLoading}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition ${a.color}`}>
                {actionLoading === a.action ? 'Working…' : a.label}
              </button>
            ))}
          </div>

          {actionError && <p className="text-xs text-rose-400">{actionError}</p>}
        </div>
      )}

      {/* Performance metrics */}
      {(status === 'published' || postMetrics) && (
        <PostMetricsPanel metrics={postMetrics} />
      )}

      {/* Comments */}
      <CommentThread
        contentId={item.id}
        currentUserId={currentUserId}
        currentRole={userRole}
        initialCount={commentCount}
      />

      {/* Audit history */}
      {history.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Workflow History</p>
          <div className="space-y-2">
            {history.map((h: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <p className="text-slate-600 w-28 shrink-0 font-mono">{new Date(h.created_at).toLocaleDateString()}</p>
                <p className="text-slate-400 w-24 shrink-0 capitalize">{h.action.replace('_', ' ')}</p>
                {(h.from_status || h.to_status) && (
                  <p className="text-slate-600">
                    {h.from_status && <span className="capitalize">{h.from_status.replace('_',' ')}</span>}
                    {h.from_status && h.to_status && <span> → </span>}
                    {h.to_status && <span className="text-slate-400 capitalize">{h.to_status.replace('_',' ')}</span>}
                  </p>
                )}
                {h.notes && <p className="text-slate-600 italic flex-1 truncate">"{h.notes}"</p>}
                <p className="text-slate-600 ml-auto shrink-0">{(h.actor as any)?.full_name ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
