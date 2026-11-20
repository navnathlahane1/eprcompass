'use client';

/**
 * MessageAcademyManagerButton
 *
 * Used on the client portal side.
 * Sends a message to the client's assigned academy manager.
 * POST /api/messages/direct  { body, toAcademyManager: true }
 */

import { useState } from 'react';

export default function MessageAcademyManagerButton() {
  const [open,    setOpen]    = useState(false);
  const [body,    setBody]    = useState('');
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), toAcademyManager: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, text: 'Message sent to your Academy Manager.' });
        setBody('');
        setTimeout(() => { setOpen(false); setResult(null); }, 2500);
      } else {
        setResult({ ok: false, text: data.error ?? 'Failed to send message.' });
      }
    } catch {
      setResult({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); setResult(null); }}
        className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Message Academy
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-slate-700/60 bg-[#0c1022] p-4 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-200">Message Your Academy Manager</p>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition" aria-label="Close">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSend} className="space-y-2.5">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Ask about trainings, certifications, compliance programs…"
              required
              className="w-full resize-none rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
            {result && (
              <p className={`text-xs ${result.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{result.text}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-600">{body.length}/2000</span>
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
