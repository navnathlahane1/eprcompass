// [MODULE] Anonymous Negotiation Engine
// [PURPOSE] Trader-ID-only negotiation room with offer actions, timeline, and redacted communication thread.
// [DEPENDENCIES] react, lucide-react, @/lib/epr-trading/*

'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Handshake, SendHorizontal, ShieldCheck, XCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/epr-trading/i18n';
import type { NegotiationMessage, NegotiationRoom } from '@/lib/epr-trading/types';

type Props = {
  room: NegotiationRoom;
  messages: NegotiationMessage[];
  activeTraderId: string;
  onPostMessage: (payload: { message: string; action: 'make_offer' | 'counter_offer' | 'accept' | 'walk_away' }) => Promise<void>;
  onStatusChange: (status: NegotiationRoom['status']) => Promise<void>;
};

const STATUS_STEPS: NegotiationRoom['status'][] = [
  'open',
  'in_discussion',
  'terms_agreed',
  'pending_reveal',
  'deal_closed'
];

export default function NegotiationRoom({ room, messages, activeTraderId, onPostMessage, onStatusChange }: Props) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const deadlineLabel = useMemo(() => formatDateTime(room.expiresAt), [room.expiresAt]);

  async function send(action: 'make_offer' | 'counter_offer' | 'accept' | 'walk_away') {
    if (!draft.trim() && action !== 'accept' && action !== 'walk_away') return;

    setBusy(true);
    try {
      await onPostMessage({ message: draft.trim() || action.toUpperCase(), action });
      if (action === 'accept') await onStatusChange('terms_agreed');
      if (action === 'walk_away') await onStatusChange('cancelled');
      setDraft('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#1B2640] bg-[#0A0F1E] p-4 text-white">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-lg font-semibold">Negotiation Room {room.id.slice(0, 8).toUpperCase()}</h2>
          <p className="mt-1 text-xs text-slate-300">
            {room.brandTraderId} <span className="mx-2">vs</span> {room.recyclerTraderId}
          </p>
        </div>
        <div className="rounded-lg border border-[#223359] bg-[#0E1529] px-3 py-2 text-xs">
          <div className="inline-flex items-center gap-2 text-slate-300">
            <Clock3 className="h-4 w-4 text-[#00D4AA]" /> Expires {deadlineLabel}
          </div>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_STEPS.map((step) => {
          const active = room.status === step;
          return (
            <button
              key={step}
              onClick={() => onStatusChange(step)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? 'border-[#00D4AA] bg-[#00D4AA]/20 text-[#00D4AA]'
                  : 'border-[#223359] bg-[#0D1428] text-slate-300 hover:border-[#00D4AA]/50'
              }`}
            >
              {step.replace('_', ' ')}
            </button>
          );
        })}
      </div>

      <div className="mb-4 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-[#223359] bg-[#0D1428] p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-400">No messages yet. Start with a masked offer.</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderTraderId === activeTraderId;
            return (
              <article
                key={msg.id}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  mine ? 'border-[#00D4AA]/40 bg-[#00D4AA]/10 text-[#DDFCF5]' : 'border-[#223359] bg-[#101A33] text-slate-100'
                }`}
              >
                <p className="mb-1 font-mono text-[11px] text-slate-400">{msg.senderTraderId}</p>
                <p>{msg.redactedPreview}</p>
                <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(msg.createdAt)}</p>
              </article>
            );
          })
        )}
      </div>

      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type offer terms (contact details auto-redacted)."
          className="h-24 w-full rounded-lg border border-[#223359] bg-[#0D1428] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#00D4AA] focus:outline-none"
          aria-label="Negotiation message"
        />

        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => send('make_offer')}
            className="inline-flex items-center gap-1 rounded-lg bg-[#00D4AA] px-3 py-2 text-xs font-semibold text-[#05261F] transition hover:brightness-110"
          >
            <SendHorizontal className="h-4 w-4" /> Make Offer
          </button>
          <button
            disabled={busy}
            onClick={() => send('counter_offer')}
            className="inline-flex items-center gap-1 rounded-lg border border-[#00D4AA] px-3 py-2 text-xs font-semibold text-[#8FF7E0] hover:bg-[#00D4AA]/10"
          >
            <Handshake className="h-4 w-4" /> Counter Offer
          </button>
          <button
            disabled={busy}
            onClick={() => send('accept')}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
          >
            <CheckCircle2 className="h-4 w-4" /> Accept
          </button>
          <button
            disabled={busy}
            onClick={() => send('walk_away')}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10"
          >
            <XCircle className="h-4 w-4" /> Walk Away
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-[#223359] bg-[#0D1428] p-2 text-xs text-slate-300">
          <ShieldCheck className="mb-1 h-4 w-4 text-[#00D4AA]" /> Contact details are auto-redacted.
        </div>
        <div className="rounded-lg border border-[#223359] bg-[#0D1428] p-2 text-xs text-slate-300">
          <AlertTriangle className="mb-1 h-4 w-4 text-yellow-300" /> Identity reveal needs both parties to spend 1000 credits.
        </div>
        <div className="rounded-lg border border-[#223359] bg-[#0D1428] p-2 text-xs text-slate-300">
          <Clock3 className="mb-1 h-4 w-4 text-sky-300" /> Extend timer before expiry to keep room active.
        </div>
      </div>
    </section>
  );
}
