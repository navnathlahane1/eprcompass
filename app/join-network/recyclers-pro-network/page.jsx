import Link from 'next/link';
import {
  CheckCircle, ArrowRight, RefreshCw, Building2, UserCheck,
  ShieldCheck, Award, TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Recyclers & PRO Network | EPR Target Fulfilment Partners | EPR Compass',
  description:
    'Connect with 200+ verified recyclers and PROs for EPR target fulfilment. Plastic, e-waste, battery and tyre recyclers — with CPCB registration, capacity data and credit pricing.',
  alternates: { canonical: '/join-network/recyclers-pro-network' },
};

const STATS = [
  { value: '200+', label: 'Verified Recyclers & PROs' },
  { value: '6', label: 'Waste Categories' },
  { value: '₹30K/T', label: 'Max Credit Value' },
  { value: '28', label: 'States Covered' },
];

const BULLET_POINTS = [
  'Plastic, e-waste, battery, tyre, ELV and used oil recyclers',
  'PROs with pan-India take-back networks',
  'Capacity data: MT/month, states covered, EPR categories',
  'CPCB registration status and compliance score',
];

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'List or Search',
    desc: 'PIBOs search by waste category, state and quantity. Recyclers/PROs submit their profile with CPCB registration and capacity data.',
  },
  {
    num: '02',
    title: 'Review Credentials',
    desc: 'Check CPCB registration, waste categories, state coverage and capacity. View compliance score for each listed partner.',
  },
  {
    num: '03',
    title: 'Connect & Fulfil',
    desc: 'Initiate contact, agree on terms, generate EPR certificates. Immutable evidence for CPCB returns.',
  },
];

const WHY_LIST = [
  'Reach 500+ corporate EPR buyers actively searching for partners',
  'Your CPCB credentials are verified and showcased — builds instant trust',
  'Get matched with long-term corporate offtake agreements',
  'Access AI tender matching and live auction rooms via Recycler Portal',
];

export default function RecyclersProNetworkLandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#08041a] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-80px] left-[-80px] w-[440px] h-[440px] bg-violet-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[280px] h-[280px] bg-purple-500/8 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-6">
                <RefreshCw className="w-4 h-4 text-violet-400" />
                <span className="text-violet-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  EPR Marketplace · Recyclers & PROs
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                India&apos;s Verified{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
                  Recyclers & PRO Network
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                Where EPR credit deals get done. Connect with 200+ CPCB-registered recyclers and Producer Responsibility
                Organisations for target fulfilment, credit generation and channelization evidence.
              </p>

              <ul className="space-y-2.5 mb-8">
                {BULLET_POINTS.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/join-network/recyclers-pro-network/listing"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition-all"
                >
                  Browse Recyclers & PROs <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/join-network/register/recycler-pro"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  List Your Organisation
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 text-center"
                >
                  <div className="text-3xl lg:text-4xl font-extrabold text-white mb-2">{s.value}</div>
                  <div className="text-slate-400 text-[12px] leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Who It's For ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Who This Network Is For
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Two sides of the EPR fulfilment market — corporate buyers and verified recyclers/PROs — matched on one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                FOR PIBOs
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">Find Verified Recycling Partners</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Companies with EPR targets who need verified recyclers and PROs to fulfil obligations. Stop chasing
                unverified vendors — browse pre-verified partners with capacity data, CPCB registration and compliance scores.
              </p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-8">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-5">
                <UserCheck className="w-6 h-6 text-violet-600" />
              </div>
              <span className="inline-block bg-violet-100 text-violet-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                FOR RECYCLERS & PROS
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">Get Discovered by 500+ Corporate Buyers</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Recyclers and PROs wanting to be discovered by 500+ corporate EPR buyers. List once, get matched
                continuously — with your CPCB credentials front and centre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-violet-700 to-purple-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">How It Works</h2>
            <p className="text-violet-100/80 text-sm">
              From target obligation to fulfilled certificate — in three steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+16px)] w-8 border-t-2 border-dashed border-violet-300/40" />
                )}
                <div className="bg-white/[0.1] backdrop-blur-sm border border-white/[0.15] rounded-2xl p-7 h-full">
                  <div className="text-5xl font-black text-white/20 mb-3 leading-none">{step.num}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-violet-100/80 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why List ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Why List as a Recycler or PRO</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Corporate EPR buyers are actively searching. Be where they look.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {WHY_LIST.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <CheckCircle className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-violet-700 py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
            Find Your EPR Fulfilment Partner
          </h2>
          <p className="text-violet-100 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            200+ CPCB-verified recyclers and PROs across 6 waste categories and 28 states. Browse free, connect directly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/join-network/recyclers-pro-network/listing"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-violet-700 hover:bg-violet-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Browse Recyclers & PROs <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/join-network/register/recycler-pro"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/[0.1] hover:bg-white/[0.18] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Register Your Organisation
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

