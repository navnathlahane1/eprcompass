'use client';

import { useState, useEffect, useRef } from 'react';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_email: string;
  profiles: { full_name: string | null } | null;
}

interface Props {
  contentId:     string;
  currentUserId: string;
  currentRole:   string;
  initialCount?: number;
}

export default function CommentThread({ contentId, currentUserId, currentRole, initialCount = 0 }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded]     = useState(false);
  const [open, setOpen]         = useState(initialCount > 0);
  const [draft, setDraft]       = useState('');
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');
  const [count, setCount]       = useState(initialCount);
  const bottomRef               = useRef<HTMLDivElement>(null);

  const canModerateAny = ['admin', 'manager', 'comms_cmo'].includes(currentRole);

  async function load() {
    const res  = await fetch(`/api/comms/content/${contentId}/comments`);
    const data = await res.json();
    if (res.ok) {
      setComments(data.comments ?? []);
      setCount(data.comments?.length ?? 0);
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (open && !loaded) load();
  }, [open]);

  useEffect(() => {
    if (open && loaded) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true); setError('');
    const res  = await fetch(`/api/comms/content/${contentId}/comments`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ body: draft.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setComments(prev => [...prev, data.comment]);
      setCount(c => c + 1);
      setDraft('');
    } else {
      setError(data.error || 'Failed to post comment');
    }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(
      `/api/comms/content/${contentId}/comments?commentId=${commentId}`,
      { method: 'DELETE' },
    );
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCount(n => Math.max(0, n - 1));
    }
  }

  function initials(comment: Comment) {
    const name = comment.profiles?.full_name || comment.author_email;
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function displayName(comment: Comment) {
    return comment.profiles?.full_name || comment.author_email;
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0c1022]">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-xs font-semibold text-slate-400">
            Comments
            {count > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                {count}
              </span>
            )}
          </span>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-800/60">
          {/* Comment list */}
          <div className="max-h-72 overflow-y-auto px-5 py-4 space-y-4">
            {!loaded && (
              <p className="text-xs text-slate-600 text-center py-4">Loading…</p>
            )}
            {loaded && comments.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">
                No comments yet. Be the first to leave feedback.
              </p>
            )}
            {comments.map(c => {
              const isMine = c.author_id === currentUserId;
              return (
                <div key={c.id} className="flex items-start gap-3 group">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 select-none">
                    {initials(c)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-300">{displayName(c)}</span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-300 whitespace-pre-wrap leading-snug">{c.body}</p>
                  </div>
                  {(isMine || canModerateAny) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition text-slate-700 hover:text-rose-400 mt-0.5"
                      title="Delete comment"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <form onSubmit={handleSubmit} className="flex items-end gap-3 border-t border-slate-800/60 px-5 py-3">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
              placeholder="Leave a comment… (Enter to send, Shift+Enter for newline)"
              rows={2}
              maxLength={2000}
              className="flex-1 resize-none rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 transition"
              title="Send comment"
            >
              {sending
                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )
              }
            </button>
          </form>

          {error && <p className="px-5 pb-2 text-xs text-rose-400">{error}</p>}
          {draft.length > 1800 && (
            <p className="px-5 pb-2 text-[10px] text-amber-500 text-right">{draft.length}/2000</p>
          )}
        </div>
      )}
    </div>
  );
}
