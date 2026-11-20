'use client';

import { useMemo, useState } from 'react';
import { TEMPLATES } from '../../../lib/whatsapp/templates';

type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'template' | 'document' | 'image';
  content: string;
  template_name?: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string | null;
  created_at: string;
};

export default function ConversationThread({
  phone,
  initialMessages
}: {
  phone: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'text' | 'template'>('text');
  const [text, setText] = useState('');
  const [templateName, setTemplateName] = useState<string>(TEMPLATES.LEAD_REPLY);
  const [templateParams, setTemplateParams] = useState('');

  const sorted = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  );

  async function onSend(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);

    try {
      const payload =
        mode === 'text'
          ? { phone, mode: 'text', message: text }
          : {
              phone,
              mode: 'template',
              templateName,
              params: templateParams
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            };

      const response = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result?.success) return;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          direction: 'outbound',
          message_type: mode,
          content: mode === 'text' ? text : templateParams,
          template_name: mode === 'template' ? templateName : null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]);

      setText('');
      setTemplateParams('');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-100">Conversation: {phone}</h3>

      <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3">
        <div className="space-y-2">
          {sorted.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  message.direction === 'inbound'
                    ? 'bg-slate-800 text-slate-100'
                    : 'bg-teal-600 text-white'
                }`}
              >
                <p>{message.content || message.template_name || '-'}</p>
                <p className="mt-1 text-[11px] opacity-80">
                  {message.status} · {new Date(message.created_at).toLocaleTimeString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSend} className="mt-3 space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${mode === 'text' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-200'}`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setMode('template')}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${mode === 'template' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-200'}`}
          >
            Template
          </button>
        </div>

        {mode === 'text' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            className="min-h-24 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
        ) : (
          <div className="space-y-2">
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {Object.values(TEMPLATES).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              value={templateParams}
              onChange={(e) => setTemplateParams(e.target.value)}
              placeholder="Template params (comma-separated)"
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          disabled={sending}
          className="btn-primary"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
}
