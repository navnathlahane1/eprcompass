'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { trackEvent } from '@/lib/analytics';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chat {
  id: string;
  visitor_name?: string | null;
  visitor_email?: string | null;
  portal: string;
  status: 'open' | 'resolved' | 'closed';
  last_message_at: string;
  created_at: string;
  assigned_agent_id?: string | null;
  _lastMessage?: string;
  _unread?: boolean;
}

interface Message {
  id: string;
  sender_type: 'visitor' | 'agent';
  sender_name?: string | null;
  message: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function portalBadge(portal: string) {
  const map: Record<string, string> = {
    client: 'bg-blue-100 text-blue-800',
    partner: 'bg-indigo-100 text-indigo-800',
    recycler: 'bg-teal-100 text-teal-800',
    cepc: 'bg-purple-100 text-purple-800',
    admin: 'bg-slate-100 text-slate-700',
    general: 'bg-slate-100 text-slate-700',
  };
  return map[portal] || 'bg-slate-100 text-slate-700';
}

function statusBadge(status: string) {
  if (status === 'open') return 'bg-emerald-100 text-emerald-800';
  if (status === 'resolved') return 'bg-slate-100 text-slate-500';
  return 'bg-red-100 text-red-700';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WebSupportClientProps {
  agentName: string;
  initialChats: Chat[];
}

export default function WebSupportClient({ agentName, initialChats }: WebSupportClientProps) {
  const supabase = getSupabaseClient();

  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    initialChats.length > 0 ? initialChats[0].id : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  // Load messages for selected chat
  const loadMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    const { data } = await (supabase as any)
      .from('support_messages')
      .select('id, sender_type, sender_name, message, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMessages(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId);
    }
  }, [selectedChatId, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime: new messages on selected chat
  useEffect(() => {
    if (!selectedChatId) return;

    const channel = (supabase as any)
      .channel(`agent-chat-${selectedChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `chat_id=eq.${selectedChatId}`,
      }, (payload: any) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [selectedChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: new chats + chat updates
  useEffect(() => {
    const channel = (supabase as any)
      .channel('agent-chats-list')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_chats',
      }, (payload: any) => {
        setChats((prev) => [payload.new as Chat, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_chats',
      }, (payload: any) => {
        setChats((prev) => prev.map((c) => c.id === payload.new.id ? { ...c, ...payload.new } : c));
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: update last message preview when new message comes in (any chat)
  useEffect(() => {
    const channel = (supabase as any)
      .channel('agent-all-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, (payload: any) => {
        const msg = payload.new as { id: string; chat_id: string; message: string; created_at: string; sender_type: 'visitor' | 'agent'; sender_name?: string | null };
        setChats((prev) =>
          prev.map((c) =>
            c.id === msg.chat_id
              ? { ...c, _lastMessage: msg.message, last_message_at: msg.created_at, _unread: msg.chat_id !== selectedChatId }
              : c
          )
        );
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [selectedChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selectedChatId || sending) return;
    const text = reply.trim();
    setReply('');
    setSending(true);

    try {
      await (supabase as any).from('support_messages').insert({
        chat_id: selectedChatId,
        sender_type: 'agent',
        sender_name: agentName,
        message: text,
      });
      await (supabase as any)
        .from('support_chats')
        .update({ last_message_at: new Date().toISOString(), status: 'open' })
        .eq('id', selectedChatId);
      trackEvent('Telecalling Support Reply Sent', {});
    } finally {
      setSending(false);
      setTimeout(() => replyRef.current?.focus(), 50);
    }
  }

  async function updateChatStatus(chatId: string, status: 'open' | 'resolved' | 'closed') {
    await (supabase as any).from('support_chats').update({ status }).eq('id', chatId);
    trackEvent('Telecalling Support Chat Status Changed', { status });
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, status } : c));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  const filteredChats = chats.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.visitor_name || '').toLowerCase().includes(q) ||
        (c.visitor_email || '').toLowerCase().includes(q) ||
        (c.portal || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = chats.filter((c) => c.status === 'open').length;

  return (
    <div className="flex h-[calc(100vh-96px)] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">

      {/* ─── Left: chat list ──────────────────────────────────────────── */}
      <div className="flex w-[300px] shrink-0 flex-col border-r border-slate-200">

        {/* Header */}
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">Inbox</h2>
            {openCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{openCount} open</span>
            )}
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Search chats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-slate-100">
          {(['open', 'resolved', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-1 py-2 text-[11px] font-semibold capitalize transition-colors ${
                filterStatus === s ? 'border-b-2 border-teal-500 text-teal-700' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs text-slate-500">No chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => { setSelectedChatId(chat.id); setChats((p) => p.map((c) => c.id === chat.id ? { ...c, _unread: false } : c)); }}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${
                  selectedChatId === chat.id ? 'bg-teal-50 border-l-2 border-l-teal-500' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {chat.visitor_name || 'Anonymous'}
                    {chat._unread && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-teal-500" />}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">{formatTime(chat.last_message_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${portalBadge(chat.portal)}`}>
                    {chat.portal}
                  </span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(chat.status)}`}>
                    {chat.status}
                  </span>
                </div>
                {chat._lastMessage && (
                  <p className="text-[11px] text-slate-500 truncate">{chat._lastMessage}</p>
                )}
                {chat.visitor_email && (
                  <p className="text-[10px] text-slate-400 truncate">{chat.visitor_email}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── Right: conversation ──────────────────────────────────────── */}
      {!selectedChat ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-slate-400 px-8">
          <svg viewBox="0 0 24 24" className="h-14 w-14 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">Select a chat to respond</p>
          <p className="text-xs text-slate-400">All incoming web support chats appear in the inbox</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col min-w-0">

          {/* Chat header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-bold">
                {(selectedChat.visitor_name || 'A')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{selectedChat.visitor_name || 'Anonymous Visitor'}</p>
                <div className="flex items-center gap-2">
                  {selectedChat.visitor_email && (
                    <p className="text-xs text-slate-500 truncate">{selectedChat.visitor_email}</p>
                  )}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${portalBadge(selectedChat.portal)}`}>
                    {selectedChat.portal} portal
                  </span>
                </div>
              </div>
            </div>
            {/* Status actions */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedChat.status === 'open' && (
                <button
                  onClick={() => updateChatStatus(selectedChat.id, 'resolved')}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  ✓ Mark Resolved
                </button>
              )}
              {selectedChat.status === 'resolved' && (
                <button
                  onClick={() => updateChatStatus(selectedChat.id, 'open')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Reopen
                </button>
              )}
              <button
                onClick={() => updateChatStatus(selectedChat.id, 'closed')}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <svg className="h-6 w-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                <p>No messages yet.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender_type === 'visitor' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 mb-1">
                      {(selectedChat.visitor_name || 'V')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="max-w-[70%] space-y-0.5">
                    <p className={`text-[11px] text-slate-400 px-1 ${msg.sender_type === 'agent' ? 'text-right' : ''}`}>
                      {msg.sender_name || (msg.sender_type === 'agent' ? 'You' : 'Visitor')}
                    </p>
                    <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.sender_type === 'agent'
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                    <p className={`text-[10px] text-slate-400 px-1 ${msg.sender_type === 'agent' ? 'text-right' : ''}`}>
                      {formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                  {msg.sender_type === 'agent' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-700 mb-1">
                      {(agentName || 'A')[0].toUpperCase()}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input */}
          {selectedChat.status !== 'closed' ? (
            <form
              onSubmit={handleSend}
              className="flex items-end gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3"
            >
              <textarea
                ref={replyRef}
                rows={2}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                style={{ maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!reply.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-40"
                aria-label="Send reply"
              >
                {sending ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          ) : (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">This chat is closed. Reopen it to reply.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
