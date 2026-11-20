'use client';

interface Props {
  title: string;
  description: string;
  icon: string;
  badge?: string;
  features: string[];
  accent?: 'emerald' | 'blue' | 'amber' | 'violet' | 'rose';
}

const ACCENT_MAP = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'text-blue-400',    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',       dot: 'bg-blue-400'    },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',     dot: 'bg-amber-400'   },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: 'text-violet-400',  badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',  dot: 'bg-violet-400'  },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: 'text-rose-400',    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',        dot: 'bg-rose-400'    },
};

export default function TenderingStub({ title, description, icon, badge = 'Coming Soon', features, accent = 'amber' }: Props) {
  const a = ACCENT_MAP[accent];

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">

        {/* Icon + Badge */}
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${a.bg} border ${a.border}`}>
            <svg viewBox="0 0 24 24" className={`h-7 w-7 ${a.icon}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
          </div>
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{title}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${a.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${a.dot} animate-pulse`} />
                {badge}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Planned Features</p>
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 mt-0.5 ${a.icon}`} fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-slate-600">
          This module is under active development and will be available soon.
        </p>
      </div>
    </div>
  );
}
