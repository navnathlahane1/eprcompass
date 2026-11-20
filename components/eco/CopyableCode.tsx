'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyableCodeProps {
  value: string;
  label: string;
}

/**
 * Monospace, copyable identifier chip for account or certificate codes.
 */
export function CopyableCode({ value, label }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);
  const safeValue = useMemo(() => value || 'Not assigned', [value]);

  async function onCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-800/70">
      <span className="truncate font-mono text-xs text-[var(--brand-text)] dark:text-gray-100" title={safeValue}>
        {safeValue}
      </span>
      <button
        type="button"
        onClick={onCopy}
        disabled={!value}
        aria-label={`Copy ${label}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--brand-secondary)] transition hover:bg-white hover:text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700"
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <span aria-live="polite" className="sr-only">{copied ? `${label} copied` : ''}</span>
    </div>
  );
}
