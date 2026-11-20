import Link from 'next/link';
import {
  CheckCircle, ArrowRight, Search, Building2, UserCheck,
  ShieldCheck, FileText, AlertTriangle, IndianRupee,
} from 'lucide-react';

export const metadata = {
  title: 'EPR Consultants Network | CPCB Filing Specialists | EPR Compass',
  description:
    "Get matched with India's vetted EPR compliance consultants. CPCB/SPCB filing, annual returns, target management and credit trading specialists — by category and state.",
  alternates: { canonical: '/join-network/compliance-consultants' },
};

const STATS = [
  { value: '180+', label: 'EPR Specialists' },
  { value: '6', label: 'Obligation Categories' },
  { value: '₹1L+', label: 'Avg Penalty Avoided' },
  { value: '48hr', label: 'Response SLA' },
];

const BULLET_POINTS = [
  'CPCB portal registration and annual return experts',
  'Plastic, e-waste, battery and tyre category specialists',
  'Target calculation and credit settlement advisors',
  'Penalty response and SPCB notice management',
];

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Describe Your Need',
    desc: 'Share your waste category, obligation stage and state. Or submit your consultant profile for review.',
  },
  {
    num: '02',
    title: 'Get Matched',
    desc: 'Our team matches you with 3 pre-vetted specialists who cover your category and state.',
  },
  {
    num: '03',
    title: 'Engage & Comply',
    desc: 'Start engagement, file returns on time and stay penalty-free throughout the compliance cycle.',
  },
];

const WHY_JOIN = [
  'Only EPR-focused network in India — zero dilution with general environmental firms',
  'High-intent client matching — you only hear from companies that need exactly what you offer',
  'Earn ₹1–5 lakh per client annually on recurring compliance retainers',
  'Build CEPC-verified credibility on your profile',
];

export default function ComplianceConsultantsLandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#040818] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-80px] left-[-80px] w-[440px] h-[440px] bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[280px] h-[280px] bg-indigo-500/8 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-6">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  EPR Marketplace · Compliance Specialists
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                Get Matched with India&apos;s{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                  Vetted EPR Filing Specialists
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                Purpose-built network of EPR compliance experts who live and breathe CPCB portals, plastic waste
                accounting and annual return filings. Find the specialist your obligation category demands.
              </p>

              <ul className="space-y-2.5 mb-8">
                {BULLET_POINTS.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/join-network/compliance-consultants/listing"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition-all"
                >
                  Find a Specialist <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/join-network/register/compliance-consultant"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  Join as EPR Consultant
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

      {/* ── Why Different ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Why This Network Is Different
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              This is not a general environmental consultants directory. Every profile here is vetted for EPR expertise specifically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                FOR COMPANIES
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">EPR Experts Only — No Generalists</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every consultant in this network is vetted specifically for EPR/CPCB expertise. Not general environmental
                consultants — EPR specialists only. Get matched to someone who has filed exactly your category's returns before.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-8">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-5">
                <UserCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                FOR CONSULTANTS
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">India&apos;s Only EPR-Exclusive Network</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get matched with PIBOs who specifically need your CPCB portal skills — no noise, high intent. The only
                network where your EPR specialisation is your advantage, not just one line in a bio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">How It Works</h2>
            <p className="text-blue-100/80 text-sm">
              From requirement to matched specialist — in three steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+16px)] w-8 border-t-2 border-dashed border-blue-300/40" />
                )}
                <div className="bg-white/[0.1] backdrop-blur-sm border border-white/[0.15] rounded-2xl p-7 h-full">
                  <div className="text-5xl font-black text-white/20 mb-3 leading-none">{step.num}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-blue-100/80 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Join as Consultant ─────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Why Join as a Consultant</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              High-intent clients, recurring revenue, and a credential that sets you apart.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {WHY_JOIN.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-blue-700 py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
            Find an EPR Specialist Today
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            180+ vetted EPR consultants across 6 obligation categories and 28 states. Match fast, file on time.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/join-network/compliance-consultants/listing"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Find an EPR Specialist <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/join-network/register/compliance-consultant"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/[0.1] hover:bg-white/[0.18] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Join the Network
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

