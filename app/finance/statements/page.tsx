import Link from 'next/link';

const SECTIONS = [
  { href: '/finance/statements/pl',       title: 'Profit & Loss',    desc: 'Revenue, EBITDA, Net Profit',        icon: 'M7 21h10M12 3v18M5 9l7-6 7 6',                   color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  { href: '/finance/statements/balance',  title: 'Balance Sheet',    desc: 'Assets, Liabilities, Equity',        icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3', color: 'text-blue-400',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10'   },
  { href: '/finance/statements/cashflow', title: 'Cash Flow',        desc: 'Operating, Investing, Financing',    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',   color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10'  },
  { href: '/finance/statements/ledger',   title: 'General Ledger',   desc: 'Journal entries, trial balance',     icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',                 color: 'text-violet-400',  border: 'border-violet-500/30',  bg: 'bg-violet-500/10' },
];

export default function StatementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Financial Statements</h1>
        <p className="text-sm text-slate-500 mt-0.5">P&amp;L, Balance Sheet, Cash Flow and General Ledger</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href}
            className={`group flex items-start gap-4 rounded-xl border ${s.border} ${s.bg} p-5 hover:opacity-90 transition`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/60 border ${s.border}`}>
              <svg viewBox="0 0 24 24" className={`h-5 w-5 ${s.color}`} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-semibold ${s.color}`}>{s.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
