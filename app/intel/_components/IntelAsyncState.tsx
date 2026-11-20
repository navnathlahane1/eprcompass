import Link from 'next/link';

type IntelAsyncStateProps = {
  type: 'loading' | 'error' | 'empty';
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

const ICONS: Record<IntelAsyncStateProps['type'], string> = {
  loading: '⏳',
  error: '⚠️',
  empty: '📭',
};

const THEMES: Record<IntelAsyncStateProps['type'], string> = {
  loading: 'border-slate-800 bg-slate-950/50 text-slate-300',
  error: 'border-rose-800/60 bg-rose-950/30 text-rose-200',
  empty: 'border-slate-800 bg-slate-950/50 text-slate-300',
};

export function IntelAsyncState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: IntelAsyncStateProps) {
  const actionClass = 'mt-3 inline-flex rounded-md border border-teal-700/50 px-3 py-1.5 text-xs text-teal-300 hover:border-teal-500';

  return (
    <div className={`rounded-xl border p-6 text-center ${THEMES[type]}`} role={type === 'error' ? 'alert' : 'status'}>
      <p className="text-2xl">{ICONS[type]}</p>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={actionClass}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && !actionHref && onAction ? (
        <button type="button" onClick={onAction} className={actionClass}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
