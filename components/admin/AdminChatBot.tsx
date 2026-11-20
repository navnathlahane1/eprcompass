'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    'Hi! I\'m your EPR compliance assistant. Ask me about regulations, client filings, CPCB compliance, waste categories, or anything else related to the platform.',
};

const SUGGESTIONS = [
  'What are the EPR registration requirements for PIBOs?',
  'How do I onboard a new recycler client?',
  'What documents are required for EPR certificate filing?',
  'Explain the plastic waste management rules.',
];

export default function AdminChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const history = [...messages, userMsg];

    setMessages([...history, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: `Error: ${err.error || res.statusText}` },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: snap, streaming: true },
        ]);
      }

      // Mark streaming done
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: accumulated, streaming: false },
      ]);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clearChat() {
    abortRef.current?.abort();
    setMessages([WELCOME]);
    setInput('');
    setLoading(false);
  }

  return (
    <>
      {/* ── Floating trigger button ─────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        className={`
          fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center
          rounded-full shadow-lg transition-all duration-200
          ${open
            ? 'bg-gray-700 text-white hover:bg-gray-800'
            : 'bg-teal-600 text-white hover:bg-teal-700'
          }
        `}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.953 9.953 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 13H9V9h2v6zm4 0h-2V9h2v6z" />
          </svg>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────── */}
      <div
        aria-hidden={!open}
        className={`
          fixed bottom-20 right-5 z-50 flex flex-col
          w-[380px] max-w-[calc(100vw-24px)]
          rounded-2xl border border-gray-200 bg-white shadow-2xl
          dark:border-gray-700 dark:bg-gray-900
          transition-all duration-200 origin-bottom-right
          ${open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}
        `}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-100 bg-teal-600 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.953 9.953 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">EPR Assistant</p>
              <p className="text-[10px] text-teal-100 leading-tight">Powered by Claude AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearChat}
            title="Clear chat"
            className="rounded-lg p-1.5 text-teal-100 hover:bg-white/20 transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13H9V9h2v6zm4 0h-2V9h2v6z" />
                  </svg>
                </div>
              )}
              <div
                className={`
                  max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'rounded-br-sm bg-teal-600 text-white'
                    : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  }
                `}
              >
                {msg.content || (msg.streaming ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : '')}
                {msg.streaming && msg.content && (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-teal-500 align-text-bottom" />
                )}
              </div>
            </div>
          ))}

          {/* Suggestion chips — only show on initial state */}
          {messages.length === 1 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Suggested questions</p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-teal-700 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 rounded-b-2xl border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about EPR compliance…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-teal-900"
              style={{ maxHeight: '96px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
              }}
              aria-label="Chat input"
            />
            {loading ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                title="Stop generating"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500 hover:bg-red-200 transition"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-600">
            Claude AI · Admin only · EPR compliance context
          </p>
        </div>
      </div>
    </>
  );
}
