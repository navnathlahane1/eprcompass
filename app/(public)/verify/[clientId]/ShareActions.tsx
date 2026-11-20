'use client';

import { useState } from 'react';

export default function ShareActions({ company, verifyUrl }: { company: string; verifyUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(`View the EPR service record for ${company}: ${verifyUrl}`)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <button type="button" onClick={copyLink} className="min-h-11 rounded-lg border border-slate-300 px-4">
        {copied ? 'Copied' : 'Copy Link'}
      </button>
      <a href={waHref} target="_blank" rel="noreferrer" className="min-h-11 rounded-lg border border-slate-300 px-4 py-2">
        WhatsApp Share
      </a>
      <a href={liHref} target="_blank" rel="noreferrer" className="min-h-11 rounded-lg border border-slate-300 px-4 py-2">
        LinkedIn Share
      </a>
    </div>
  );
}
