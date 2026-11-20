import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckCircle } from 'lucide-react';
import UnifiedSignInBox from '@/components/auth/UnifiedSignInBox';
import PublicBrand from '@/components/public-site/PublicBrand';

export const metadata: Metadata = { title: 'Sign In | EPR Compass' };


const STATS = [
  { value: '2,500+', label: 'Clients' },
  { value: '10K+', label: 'Filings' },
  { value: '25+', label: 'Countries' },
];

const FEATURES = [
  'Plastic, e-waste, battery, tyre, ELV and used oil EPR',
  'Deadline tracking, vault, and CPCB-ready filings',
  'Verified recyclers, PROs, and credit trading',
];

export default function LoginPage() {
  return (
    <main className="epr-public grid min-h-dvh lg:grid-cols-[minmax(280px,42%)_1fr]">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[#032f3a] px-6 py-7 text-white sm:px-10 lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#07875f]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-[#78c943]/15 blur-3xl" />

        <div className="relative z-10">
          <PublicBrand inverse compact />
        </div>

        <div className="relative z-10 mt-10 max-w-md lg:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78c943]">EPR compliance platform</p>
          <h1 className="mt-3 text-[28px] font-extrabold leading-[1.15] tracking-tight sm:text-[34px]">
            Everything EPR.<br />
            <span className="text-[#78c943]">One sign-in.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Use your EPR Compass account. We open the workspace for your role — client, partner, consultant, recycler, or staff.
          </p>
          <ul className="mt-6 hidden space-y-2.5 sm:block">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/85">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#78c943]" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-8 hidden grid-cols-3 gap-2 sm:grid lg:mt-10">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-lg font-extrabold leading-none">{s.value}</p>
              <p className="mt-1.5 text-[11px] text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex items-start justify-center bg-[#fbfdfc] px-5 py-10 sm:px-8 lg:items-center lg:px-16 lg:py-12">
        <div className="w-full max-w-[420px]">
          <h2 className="text-[1.65rem] font-extrabold tracking-tight text-[#102c32]">Welcome back</h2>
          <p className="mt-1.5 text-sm text-[#607279]">Sign in with email. We route you to the right portal.</p>

          <div className="mt-7">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-white" />}>
              <UnifiedSignInBox />
            </Suspense>
          </div>

          <Link href="/signup" className="mt-6 inline-block text-sm font-semibold text-[#07875f]">New to EPR Compass? Create an account</Link>

          <div className="mt-8 flex items-center justify-between border-t border-[#dfe9e4] pt-5 text-sm">
            <Link href="/contact" className="font-medium text-[#607279] hover:text-[#07875f]">Need help?</Link>
            <Link href="/" className="font-medium text-[#07875f] hover:underline">← Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

