interface Props {
  label:    string;
  value:    number | string;
  sub?:     string;
  icon:     string;
  color:    string; // tailwind classes e.g. "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  mono?:    boolean;
  trend?:   number;  // positive = up, negative = down
}

export default function MetricCard({ label, value, sub, icon, color, mono = true, trend }: Props) {
  const [text, bg, border] = color.split(' ');

  return (
    <div className={`rounded-xl border p-4 ${bg} ${border}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border mb-3 ${bg} ${border}`}>
        <svg viewBox="0 0 24 24" className={`h-4.5 w-4.5 ${text}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div className="flex items-end gap-2">
        <p className={`text-2xl font-bold ${text} ${mono ? 'font-mono' : ''}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {trend !== undefined && (
          <span className={`text-xs font-medium mb-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-700 mt-0.5">{sub}</p>}
    </div>
  );
}
