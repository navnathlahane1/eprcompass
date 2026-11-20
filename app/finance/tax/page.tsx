import Link from 'next/link';

const SECTIONS = [
  { href: '/finance/tax/gst',    title: 'GST',        desc: 'GSTR-1, 3B, 9 filing tracker & ITC',   icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  { href: '/finance/tax/tds',    title: 'TDS',        desc: '26Q/24Q returns, Form 16, challans',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',                    color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10'  },
  { href: '/finance/tax/income', title: 'Income Tax', desc: 'Advance tax, ITR status, MAT/AMT',       icon: 'M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8z',                                                                                                                   color: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10'   },
];

export default function TaxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Tax Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">GST, TDS and Income Tax compliance</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href}
            className={`group flex flex-col items-center gap-3 rounded-xl border ${s.border} ${s.bg} p-6 text-center hover:opacity-90 transition`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/60 border ${s.border}`}>
              <svg viewBox="0 0 24 24" className={`h-6 w-6 ${s.color}`} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-bold ${s.color}`}>{s.title}</p>
              <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
