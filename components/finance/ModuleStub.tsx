'use client';

interface ModuleStubProps {
  title:       string;
  description: string;
  icon:        string;         // SVG path
  badge?:      string;         // e.g. "Coming Soon" | "In Development"
  features?:   string[];       // bullet list of planned features
  accent?:     'emerald' | 'blue' | 'amber' | 'violet' | 'rose';
}

const ACCENT = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  icon: 'text-violet-400',  badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    icon: 'text-rose-400',    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export default function ModuleStub({ title, description, icon, badge = 'Coming Soon', features, accent = 'emerald' }: ModuleStubProps) {
  const a = ACCENT[accent];
  return (
    <div className="flex flex-col min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Icon */}
        <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${a.bg} ${a.border}`}>
          <svg viewBox="0 0 24 24" className={`h-8 w-8 ${a.icon}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>

        {/* Title + badge */}
        <div className="mb-3 flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100 text-center">{title}</h1>
          {badge && (
            <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${a.badge}`}>
              {badge}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mb-8 text-center text-sm text-slate-400 leading-relaxed">{description}</p>

        {/* Planned features */}
        {features && features.length > 0 && (
          <div className={`rounded-xl border ${a.border} bg-slate-900/50 p-5`}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Planned Features</p>
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <span className={`mt-0.5 h-4 w-4 shrink-0 ${a.icon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
