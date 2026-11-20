// [MODULE] Notifications and Communication
// [PURPOSE] In-app trading notification center using masked Trader IDs.
// [DEPENDENCIES] react, lucide-react

'use client';

import { Bell, Mail, MessageSquareMore } from 'lucide-react';

type Item = {
  id: string;
  channel: 'in_app' | 'email' | 'whatsapp';
  message: string;
  createdAt: string;
};

type Props = {
  items: Item[];
};

export default function NotificationCenter({ items }: Props) {
  return (
    <section className="rounded-2xl border border-[#1B2640] bg-[#0A0F1E] p-4 text-white">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 font-mono text-base font-semibold">
          <Bell className="h-4 w-4 text-[#00D4AA]" /> Notification Center
        </h3>
        <button className="rounded-lg border border-[#223359] px-2 py-1 text-xs text-slate-300 hover:border-[#00D4AA]/60">
          Preferences
        </button>
      </header>
      <div className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-[#223359] bg-[#0D1428] p-2 text-xs">
            <div className="mb-1 flex items-center gap-1 text-slate-300">
              {item.channel === 'email' ? <Mail className="h-3.5 w-3.5" /> : item.channel === 'whatsapp' ? <MessageSquareMore className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              <span className="uppercase">{item.channel}</span>
            </div>
            <p className="text-slate-100">{item.message}</p>
            <p className="mt-1 text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
          </article>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">TODO: wire WhatsApp hooks (Twilio/WATI) in backend notification worker.</p>
    </section>
  );
}
