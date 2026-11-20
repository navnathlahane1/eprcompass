'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppJoinCTA({ communityName, link, className = '' }) {
  if (!link) return null;
  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-5 text-center ${className}`}>
      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
        Join the {communityName} WhatsApp Community
      </p>
      <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
        Connect with fellow members, get updates, and access exclusive resources.
      </p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-[#052e16] font-semibold py-2.5 px-5 text-sm transition"
      >
        <MessageCircle size={16} /> Join WhatsApp Community
      </a>
    </div>
  );
}
