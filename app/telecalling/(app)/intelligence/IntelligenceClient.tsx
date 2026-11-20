'use client';

import { useMemo, useState } from 'react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface SourceRef {
  title: string;
  category: string;
  sourceUrl: string;
  publishedAt?: string | null;
}

export default function IntelligenceClient() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        'Telecalling Intelligence ready. Ask about EPR applicability, objection handling, compliance timelines, or latest notification impact for a client category.',
    },
  ]);
  const [sources, setSources] = useState<SourceRef[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  function mapErrorMessage(raw: string): string {
    const msg = (raw || '').toLowerCase();
    if (msg.includes('ai service not configured')) {
      return 'AI is not configured for this environment. Ask admin to set Anthropic API key in Telecalling Settings.';
    }
    return raw;
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/telecalling/intelligence/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');

      setMessages((prev) => [...prev, { role: 'assistant', content: String(data?.reply || '') }]);
      setSources(Array.isArray(data?.sources) ? data.sources : []);
    } catch (err: any) {
      setError(mapErrorMessage(err?.message || 'Failed to get response'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
        <h1 className="text-lg font-semibold text-slate-100">Telecalling Intelligence</h1>
        <p className="mt-1 text-sm text-slate-300">
          Ask call-ready questions based on your local regulatory notification corpus and EPR domain context.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60">
        <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'assistant'
                  ? 'bg-slate-800 text-slate-100'
                  : 'bg-teal-500/15 border border-teal-500/30 text-white'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400">Thinking...</div>}
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>

        <form onSubmit={onSend} className="border-t border-slate-700/60 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: objection handling for battery EPR client saying registration cost is high"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400/60"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-lg bg-teal-500/15 border border-teal-500/30 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Matched Sources</h2>
        {sources.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">No source match yet. Run notification sync to populate corpus.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-slate-300">
            {sources.map((s, i) => (
              <li key={`${s.sourceUrl}-${i}`} className="rounded-md bg-slate-800/40 p-2">
                <div className="font-medium">{s.title}</div>
                <div>{s.category}{s.publishedAt ? ` • ${s.publishedAt}` : ''}</div>
                <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                  {s.sourceUrl}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
