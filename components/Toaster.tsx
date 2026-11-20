'use client';

import { useToast, type ToastType } from '@/lib/toast/ToastContext';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

const PALETTE: Record<ToastType, string> = {
  success: 'border-emerald-500/50 bg-emerald-950/95 text-emerald-100',
  error:   'border-rose-500/50    bg-rose-950/95    text-rose-100',
  warning: 'border-amber-500/50   bg-amber-950/95   text-amber-100',
  info:    'border-blue-500/50    bg-blue-950/95    text-blue-100',
};

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error:   'text-rose-400',
  warning: 'text-amber-400',
  info:    'text-blue-400',
};

/**
 * Drop this anywhere inside a <ToastProvider> to render the toast stack.
 * Positioned fixed bottom-right; sits on top of everything (z-[9999]).
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3',
            'shadow-2xl text-sm backdrop-blur-sm transition-all animate-in slide-in-from-right-4 fade-in',
            PALETTE[t.type],
          ].join(' ')}
        >
          <span className={['mt-0.5 shrink-0 font-bold text-base', ICON_COLOR[t.type]].join(' ')}>
            {ICONS[t.type]}
          </span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 ml-1 opacity-50 hover:opacity-100 transition-opacity text-xs leading-none pt-0.5"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
