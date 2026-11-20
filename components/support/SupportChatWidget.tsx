'use client';

import { useState, useEffect, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

// ─── Supabase client ──────────────────────────────────────────────────────────


// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender_type: 'visitor' | 'agent';
  sender_name?: string | null;
  message: string;
  created_at: string;
}

interface SupportChatWidgetProps {
  /** Which portal this widget is embedded in. Stored on the chat record. */
  portal?: string;
  /** Accent colour for the widget button */
  accent?: 'blue' | 'indigo' | 'teal' | 'green' | 'gray';
}

const ACCENT_CLASSES: Record<NonNullable<SupportChatWidgetProps['accent']>, { btn: string; header: string; bubble: string; sendBtn: string }> = {
  blue:   { btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/30',   header: 'bg-blue-600',   bubble: 'bg-blue-600',   sendBtn: 'bg-blue-600 hover:bg-blue-700' },
  indigo: { btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/30', header: 'bg-indigo-600', bubble: 'bg-indigo-600', sendBtn: 'bg-indigo-600 hover:bg-indigo-700' },
  teal:   { btn: 'bg-teal-600 hover:bg-teal-700 shadow-teal-900/30',   header: 'bg-teal-600',   bubble: 'bg-teal-600',   sendBtn: 'bg-teal-600 hover:bg-teal-700' },
  green:  { btn: 'bg-green-700 hover:bg-green-800 shadow-green-900/30', header: 'bg-green-700',  bubble: 'bg-green-700',  sendBtn: 'bg-green-700 hover:bg-green-800' },
  gray:   { btn: 'bg-slate-700 hover:bg-slate-800 shadow-slate-900/30', header: 'bg-slate-800',  bubble: 'bg-slate-700',  sendBtn: 'bg-slate-700 hover:bg-slate-800' },
};

const SESSION_STORAGE_KEY = 'epr-support-session';

function getOrCreateSession(): { chatId: string | null; sessionKey: string } {
  if (typeof window === 'undefined') return { chatId: null, sessionKey: '' };
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { chatId: null, sessionKey: crypto.randomUUID() };
}

function saveSession(chatId: string, sessionKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ chatId, sessionKey }));
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function SupportChatWidget({ portal = 'general', accent = 'blue' }: SupportChatWidgetProps) {
  if (!isSupabaseConfigured) return null;
  return <ConfiguredSupportChatWidget portal={portal} accent={accent} />;
}

function ConfiguredSupportChatWidget({ portal = 'general', accent = 'blue' }: SupportChatWidgetProps) {
  const ac = ACCENT_CLASSES[accent];

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'chat'>('intro');

  // Intro form state
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  // Chat state
  const [chatId, setChatId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [agentOnline, setAgentOnline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing session on mount
  useEffect(() => {
    const session = getOrCreateSession();
    setSessionKey(session.sessionKey);
    if (session.chatId) {
      setChatId(session.chatId);
      setPhase('chat');
    }
  }, []);

  // Load messages when chatId is known
  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;

    (async () => {
      const { data } = await (supabase as any)
        .from('support_messages')
        .select('id, sender_type, sender_name, message, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (!cancelled) setMessages(data || []);
    })();

    // Realtime subscription
    const channel = (supabase as any)
      .channel(`chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        if (!open && (payload.new as Message).sender_type === 'agent') {
          setUnreadCount((c) => c + 1);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      (supabase as any).removeChannel(channel);
    };
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if any agent has replied (sets agentOnline)
  useEffect(() => {
    if (messages.some((m) => m.sender_type === 'agent')) {
      setAgentOnline(true);
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear unread when panel opens
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => replyInputRef.current?.focus(), 100);
    }
  }, [open]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!visitorName.trim() || !firstMessage.trim()) return;
    setStarting(true);
    setStartError('');

    try {
      // Create chat
      const { data: chat, error: chatErr } = await (supabase as any)
        .from('support_chats')
        .insert({
          session_key: sessionKey,
          portal,
          visitor_name: visitorName.trim(),
          visitor_email: visitorEmail.trim() || null,
          status: 'open',
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (chatErr || !chat) {
        setStartError('Unable to start chat. Please try again.');
        return;
      }

      const newChatId = chat.id as string;

      // Send first message
      await (supabase as any).from('support_messages').insert({
        chat_id: newChatId,
        sender_type: 'visitor',
        sender_name: visitorName.trim(),
        message: firstMessage.trim(),
      });

      saveSession(newChatId, sessionKey);
      setChatId(newChatId);
      setMessages([{
        id: 'initial',
        sender_type: 'visitor',
        sender_name: visitorName.trim(),
        message: firstMessage.trim(),
        created_at: new Date().toISOString(),
      }]);
      setPhase('chat');
    } catch {
      setStartError('Something went wrong. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !chatId || sending) return;
    const text = reply.trim();
    setReply('');
    setSending(true);

    try {
      await (supabase as any).from('support_messages').insert({
        chat_id: chatId,
        sender_type: 'visitor',
        sender_name: visitorName || 'You',
        message: text,
      });
      // Also update last_message_at
      await (supabase as any)
        .from('support_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* Chat panel */}
      {open && (
        <div className="w-[340px] sm:w-[360px] rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden flex flex-col" style={{ maxHeight: '520px' }}>

          {/* Header */}
          <div className={`${ac.header} px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">EPR Support</p>
                <p className="text-[11px] text-white/70 leading-tight">
                  {agentOnline ? 'Agent replied · We are here' : 'Typically replies in minutes'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close chat"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          {phase === 'intro' ? (
            <form onSubmit={handleStart} className="flex flex-col gap-3 p-4 overflow-y-auto">
              {/* Welcome */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-sm font-semibold text-slate-800">👋 Hi there!</p>
                <p className="mt-0.5 text-xs text-slate-500">Our EPR compliance team is ready to help. Start by sharing your details and your question.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Name *</label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Email (optional)</label>
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Question *</label>
                <textarea
                  required
                  rows={3}
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="How can we help you with EPR compliance?"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>

              {startError && (
                <p className="text-xs text-red-600">{startError}</p>
              )}

              <button
                type="submit"
                disabled={starting || !visitorName.trim() || !firstMessage.trim()}
                className={`w-full rounded-xl ${ac.sendBtn} py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {starting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Starting chat…
                  </>
                ) : (
                  <>
                    Start Chat
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>

                {/* Agent welcome */}
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 mt-1">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-700">Thanks for reaching out! Our team has received your message and will respond shortly. ✅</p>
                  </div>
                </div>

                {messages.map((msg, i) => (
                  <div key={msg.id ?? i} className={`flex items-end gap-2 ${msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender_type === 'agent' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 mb-1 text-[10px] font-bold text-slate-600">
                        {(msg.sender_name || 'A')[0].toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[78%] space-y-0.5`}>
                      {msg.sender_type === 'agent' && (
                        <p className="text-[10px] text-slate-400 px-1">{msg.sender_name || 'Support Agent'}</p>
                      )}
                      <div className={`rounded-xl px-3 py-2 text-sm ${
                        msg.sender_type === 'visitor'
                          ? `${ac.bubble} text-white rounded-br-sm`
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <p className={`text-[10px] px-1 ${msg.sender_type === 'visitor' ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-slate-100 px-3 py-2.5">
                <textarea
                  ref={replyInputRef}
                  rows={1}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  style={{ maxHeight: '80px' }}
                />
                <button
                  type="submit"
                  disabled={!reply.trim() || sending}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ac.sendBtn} text-white transition disabled:opacity-40`}
                  aria-label="Send message"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 text-center">
                <p className="text-[10px] text-slate-400">Powered by <span className="font-semibold text-slate-500">EPR Compass Support</span></p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating bubble button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full ${ac.btn} text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95`}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}

        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
        )}

        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}

