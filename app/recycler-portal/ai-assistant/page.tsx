'use client';

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Msg { id?: string; role: 'user' | 'assistant'; content: string; created_at?: string; }

const SUGGESTIONS = [
  'What returns do I need to file this quarter?',
  'How do I generate EPR credits from processed plastic?',
  'What documents are needed for CTO renewal?',
  'Explain traceability requirements for e-waste credits.',
];

function renderContent(text: string) {
  // Lightweight markdown-ish rendering for **bold** and bullet lines
  return text.split('\n').map((line, i) => {
    const bolded = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong>
        : <span key={j}>{part}</span>
    );
    return <p key={i} className={line.trim().startsWith('•') || /^\d+\./.test(line.trim()) ? 'pl-2' : ''}>{bolded}</p>;
  });
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/recycler-portal/ai-assistant').then(r => r.json())
      .then(d => setMessages(d.messages ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setSending(true);
    trackEvent('Recycler AI Assistant Message Sent', {});
    try {
      const r = await fetch('/api/recycler-portal/ai-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const d = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply || d.error || 'Sorry, I could not respond.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally { setSending(false); }
  }

  async function clearChat() {
    if (!confirm('Clear conversation history?')) return;
    await fetch('/api/recycler-portal/ai-assistant', { method: 'DELETE' });
    trackEvent('Recycler AI Assistant Chat Cleared', {});
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EPR Compliance Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">Ask anything about EPR filings, credits, authorizations, and traceability.</p>
        </div>
        {messages.length > 0 && <button onClick={clearChat} className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50">Clear</button>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-4">
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 mb-3">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-700">How can I help with your EPR compliance?</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Try one of these:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="text-left rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:border-teal-300 hover:bg-teal-50 transition-colors">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={m.id ?? i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed space-y-1 ${
                m.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
              }`}>
                {m.role === 'assistant' ? renderContent(m.content) : m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about returns, credits, authorizations…"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button onClick={() => send()} disabled={sending || !input.trim()} className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">Send</button>
      </div>
      <p className="text-[11px] text-gray-400 mt-2 text-center">AI guidance is informational. Always verify against the latest CPCB notifications.</p>
    </div>
  );
}
