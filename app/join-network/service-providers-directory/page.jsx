import Link from 'next/link';
import {
  CheckCircle, ArrowRight, Search, Building2, UserCheck,
  Droplets, Wind, Leaf, BarChart3,
} from 'lucide-react';

export const metadata = {
  title: 'Environmental Services Directory | Find Verified Service Providers | EPR Compass',
  description:
    "India's verified directory of environmental service providers — EIA, water management, air quality, soil remediation, green certification, and sustainability services.",
  alternates: { canonical: '/join-network/service-providers-directory' },
};

const STATS = [
  { value: '150+', label: 'Listed Companies' },
  { value: '8', label: 'Service Categories' },
  { value: '500+', label: 'Corporate Clients' },
  { value: '20+', label: 'States' },
];

const BULLET_POINTS = [
  'EIA (Environmental Impact Assessment) specialists',
  'Water quality management and treatment experts',
  'Air quality monitoring and compliance firms',
  'Green building certification and sustainability reporting',
  'Soil remediation and waste disposal services',
];

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Search by Service Type',
    desc: 'Filter by EIA, water, air quality, remediation or sustainability service. Narrow by state and certification.',
  },
  {
    num: '02',
    title: 'Review Credentials',
    desc: 'Check certifications, past projects, state coverage and service scope from verified profiles.',
  },
  {
    num: '03',
    title: 'Request a Quote',
    desc: 'Send an inquiry directly. Firms respond within 48 hours with scope and pricing.',
  },
];

const WHY_LIST = [
  'Access 500+ corporate clients actively seeking environmental services',
  'Admin-verified listing builds instant credibility with buyers',
  'State-specific visibility for regional firms',
  'Listed firms average 3x more inbound inquiries vs. cold outreach',
];

export default function ServiceProvidersDirectoryLandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#04141a] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-80px] left-[-80px] w-[440px] h-[440px] bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[280px] h-[280px] bg-cyan-500/8 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-cyan-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6">
                <Search className="w-4 h-4 text-teal-400" />
                <span className="text-teal-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  EPR Marketplace · Service Providers
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                India&apos;s Verified{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                  Environmental Services Directory
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                One directory for all environmental compliance and sustainability services — EIA consultants, water
                management experts, air quality specialists, soil remediation firms and green certification bodies.
              </p>

              <ul className="space-y-2.5 mb-8">
                {BULLET_POINTS.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/join-network/service-providers-directory/listing"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/40 transition-all"
                >
                  Browse Providers <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/join-network/register/service-provider"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  List Your Company
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

      {/* ── Who Uses This ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Who Uses This Directory
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Connecting environmental service buyers with pre-verified providers — across every clearance and compliance type.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                FOR CORPORATES & DEVELOPERS
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">You Need Environmental Clearances</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Companies needing EIA reports, sustainability disclosures, water quality assessments or environmental
                clearances. Browse pre-verified firms by service type and state — no cold calls needed.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-8">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-5">
                <UserCheck className="w-6 h-6 text-teal-600" />
              </div>
              <span className="inline-block bg-teal-100 text-teal-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                FOR ENVIRONMENTAL FIRMS
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">Reach the Right Corporate Clients</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Environmental firms wanting to reach corporate buyers without cold outreach. List once, get discovered
                continuously by clients actively searching your services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-cyan-700">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">How It Works</h2>
            <p className="text-teal-100/80 text-sm">
              Find the right environmental services partner in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+16px)] w-8 border-t-2 border-dashed border-teal-300/40" />
                )}
                <div className="bg-white/[0.1] backdrop-blur-sm border border-white/[0.15] rounded-2xl p-7 h-full">
                  <div className="text-5xl font-black text-white/20 mb-3 leading-none">{step.num}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-teal-100/80 text-sm leading-relaxed">{step.desc}</p>
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
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Why List Your Company Here</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Inbound beats outbound. Be where the buyers are looking.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {WHY_LIST.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-teal-700 py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
            Find Your Environmental Services Partner
          </h2>
          <p className="text-teal-100 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            150+ verified firms across 8 service categories and 20+ states. Search free, connect directly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/join-network/service-providers-directory/listing"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-teal-700 hover:bg-teal-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Browse All Providers <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/join-network/register/service-provider"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/[0.1] hover:bg-white/[0.18] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              List Your Company
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

