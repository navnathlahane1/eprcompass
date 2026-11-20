import Link from 'next/link';
import { ReactNode } from 'react';

type IntelHeaderAction = {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'subtle';
};

type IntelPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badges?: ReactNode;
  chips?: ReactNode;
  actions?: IntelHeaderAction[];
};

function actionClasses(variant: IntelHeaderAction['variant'] = 'default'): string {
  if (variant === 'primary') {
    return 'border-teal-500/40 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20 hover:text-teal-100';
  }
  if (variant === 'subtle') {
    return 'border-slate-700/70 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:text-slate-100';
  }
  return 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-teal-400 hover:text-teal-300';
}

export function IntelPageHeader({
  eyebrow,
  title,
  description,
  badges,
  chips,
  actions = [],
}: IntelPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
        {chips ? <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">{chips}</div> : null}
      </div>
      <div className="flex flex-col items-end gap-3">
        {badges ? <div className="flex max-w-xl flex-wrap justify-end gap-2">{badges}</div> : null}
        {actions.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-2">
            {actions.map((action) => {
              const className = `rounded-md border px-3 py-2 text-xs font-semibold transition ${actionClasses(action.variant)}`;
              if (action.href) {
                return (
                  <Link key={action.key} href={action.href} className={className}>
                    {action.label}
                  </Link>
                );
              }
              return (
                <button key={action.key} type="button" onClick={action.onClick} className={className}>
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
