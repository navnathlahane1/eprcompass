'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// ─── types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ─── quick-prompt suggestions ─────────────────────────────────────────────────

const SUGGESTIONS = [
  'What are my current EPR filing deadlines?',
  'Explain EPR credit trading in India.',
  'What documents do I need for Plastic EPR registration?',
  'How is my compliance score calculated?',
  'What is the penalty for missing EPR annual returns?',
];

// ─── markdown-lite renderer (bold + bullets only) ─────────────────────────────

function renderMarkdown(text: string) {
  // Bold **text**
  const withBold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Bullet lines starting with "- " or "• "
  const lines = withBold.split('\n');
  const html = lines
    .map((line) => {
      if (/^[-•]\s+/.test(line)) {
        return `<li class="ml-4 list-disc">${line.replace(/^[-•]\s+/, '')}</li>`;
      }
      return line ? `<p class="mb-1">${line}</p>` : '<br/>';
    })
    .join('');
  return html;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check auth once on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthed(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Restore from localStorage per session
  useEffect(() => {
    if (!authed) return;
    try {
      const saved = localStorage.getItem('epr_ai_chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (parsed.sessionId) setSessionId(parsed.sessionId);
      }
    } catch { /* ignore */ }
  }, [authed]);

  // Persist to localStorage when messages change
  useEffect(() => {
    if (!authed || !messages.length) return;
    try {
      localStorage.setItem('epr_ai_chat', JSON.stringify({ messages: messages.slice(-40), sessionId }));
    } catch { /* ignore */ }
  }, [messages, sessionId, authed]);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/compliance-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          sessionId: sessionId ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error === 'AI service not configured' ? 'AI service is temporarily unavailable.' : (data?.error ?? 'Something went wrong. Please try again.'));
        // Remove the user message we just added so they can retry
        setMessages(messages);
        return;
      }

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);
    } catch {
      setError('Network error. Please check your connection.');
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }, [messages, sessionId, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    localStorage.removeItem('epr_ai_chat');
  };

  // Don't render for unauthenticated visitors
  if (!authed) return null;

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="AI Compliance Assistant"
          aria-modal="true"
          className="fixed bottom-24 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:right-6"
          style={{ height: 'min(520px, calc(100dvh - 8rem))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">
                🤖
              </span>
              <div>
                <p className="text-xs font-semibold text-white leading-tight">AI Compliance Assistant</p>
                <p className="text-[10px] text-emerald-100">EPR · CPCB · Indian Regulations</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="rounded-md px-2 py-1 text-[10px] text-emerald-100 hover:bg-white/10"
                  aria-label="Clear conversation"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="ml-1 rounded-md p-1 text-white hover:bg-white/20"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                  Ask me anything about your EPR compliance, deadlines, filings, or regulations.
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-emerald-950/30"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <span className="mr-1.5 mt-0.5 flex-shrink-0 text-sm">🤖</span>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-emerald-600 text-white'
                        : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <span className="mr-1.5 text-sm">🤖</span>
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2.5 dark:bg-gray-800">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your EPR compliance…"
                rows={1}
                disabled={loading}
                aria-label="Type your compliance question"
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                style={{ maxHeight: '80px', overflowY: 'auto' }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = 'auto';
                  t.style.height = `${Math.min(t.scrollHeight, 80)}px`;
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex-shrink-0 rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="mt-1 text-center text-[10px] text-gray-400">
              AI may make mistakes — verify critical compliance info
            </p>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI Compliance Assistant' : 'Open AI Compliance Assistant'}
        aria-expanded={open}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl ${
          open
            ? 'bg-gray-700 text-white'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
        }`}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {/* Robot / AI icon */}
            <rect x="4" y="8" width="16" height="11" rx="3" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
            <path d="M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M12 8V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="4" r="1" fill="currentColor"/>
            <path d="M4 13H2M22 13h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
        {/* Pulse indicator for new users */}
        {!open && messages.length === 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
        )}
      </button>
    </>
  );
}
