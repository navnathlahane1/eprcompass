import Link from 'next/link';
import ContactEmail from '@/components/public-site/ContactEmail';
import {
  CheckCircle, ArrowRight, Factory, Award, BarChart3, ShieldCheck,
  FileText, TrendingUp, AlertTriangle, Users, Building2, Package,
  Calculator, ClipboardList, ChevronRight, Star, Target,
} from 'lucide-react';

export const metadata = {
  title: 'EPR Academy for PIBOs & Corporates | Know Your Obligations, Avoid Penalties',
  description:
    'EPR compliance training for Producers, Importers and Brand Owners. Understand plastic, e-waste and battery EPR obligations, calculate targets, trade credits and avoid CPCB penalties.',
  keywords:
    'EPR training for producers India, PIBO EPR compliance course, plastic EPR obligations, brand owner EPR registration, EPR target calculation, e-waste EPR training, corporate sustainability compliance India',
  alternates: { canonical: '/courses/for-pibs-corporates' },
  openGraph: {
    title: 'EPR Academy for PIBOs & Corporates',
    description:
      'Know your plastic, e-waste and battery EPR obligations. Calculate targets, file returns and trade credits — with expert-led training from ₹0.',
    url: '/courses/for-pibs-corporates',
    type: 'website',
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const WHO_PROFILES = [
  {
    icon: '🏭',
    title: 'Producers & Manufacturers',
    profile: 'Companies that manufacture plastic-packaged goods, electronics, batteries, tyres or vehicles sold in India',
    obligation: 'You owe EPR targets proportional to the quantity of regulated products placed on the market annually',
    benefit: 'Learn to calculate your exact targets, register on CPCB portal and select the right PRO or in-house compliance model',
    badge: 'Core audience',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    icon: '🌐',
    title: 'Importers',
    profile: 'Companies importing plastic packaging, EEE, batteries or vehicles into India for distribution or resale',
    obligation: 'Importers carry the same EPR obligations as domestic producers — often overlooked until a CPCB notice arrives',
    benefit: 'Understand import-volume EPR accounting, CPCB portal importer registration and annual return requirements',
    badge: 'High risk',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    icon: '🛍️',
    title: 'Brand Owners',
    profile: 'Brands that own the packaging or product design — even if manufacturing is outsourced',
    obligation: 'Brand ownership triggers EPR liability regardless of whether you operate a factory yourself',
    benefit: 'Clarify your liability boundary, set up EPR cost budgets and engage PROs for target fulfilment on your behalf',
    badge: '',
    badgeColor: '',
  },
  {
    icon: '🏪',
    title: 'FMCG & Retail Chains',
    profile: 'Consumer goods companies, supermarket chains and e-commerce platforms placing packaged goods on the market',
    obligation: 'Multi-material packaging (plastic, tetra-packs, multi-layer) creates complex PWM obligations across SKUs',
    benefit: 'Learn multi-SKU EPR target aggregation, packaging weight declarations and PWM annual return methodology',
    badge: 'Complex obligations',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    icon: '💻',
    title: 'Electronics & EEE Companies',
    profile: 'Manufacturers and importers of IT equipment, consumer electronics, telecom hardware and solar panels',
    obligation: 'E-Waste Rules 2022 mandate annual EPR targets with credit settlement on the CPCB portal by September 30',
    benefit: 'Navigate ITEW/CEEW category classification, credit purchase strategy and extended producer responsibility audits',
    badge: 'Strict deadlines',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    icon: '⚡',
    title: 'EHS / Sustainability Teams',
    profile: 'Corporate EHS managers, sustainability officers and compliance heads handling EPR across business units',
    obligation: 'EPR is now a board-level sustainability metric — missed targets attract penalties and ESG reporting flags',
    benefit: 'Build internal capability to run EPR compliance independently, reducing dependence on external consultants',
    badge: 'In-house upskill',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
];

const WHAT_YOU_GAIN = [
  { icon: Calculator, title: 'Calculate Your Exact EPR Targets', desc: 'Use category, quantity and packaging-weight data to model your plastic, e-waste and battery obligations accurately' },
  { icon: ShieldCheck, title: 'Avoid CPCB Penalties & Notices', desc: 'Understand common compliance failures — missed filings, incorrect declarations and credit shortfalls — before they happen' },
  { icon: Target, title: 'Navigate CPCB Portal Confidently', desc: 'Step-by-step portal walkthroughs: producer registration, annual return filing and EPR credit settlement' },
  { icon: TrendingUp, title: 'Optimise EPR Costs', desc: 'Compare PRO partnerships vs. in-house fulfilment, and learn how to procure EPR credits at the best market rate' },
  { icon: FileText, title: 'File Accurate Annual Returns', desc: 'Avoid rejection with correctly structured plastic waste accounting, weight declarations and supporting documentation' },
  { icon: Users, title: 'Build an Internal Compliance Team', desc: 'Upskill your EHS, legal or procurement team so EPR is managed in-house rather than fully outsourced' },
];

const COURSES = [
  {
    tier: 'Free Workshop',
    accentColor: 'bg-emerald-400',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    title: 'EPR Awareness Bootcamp — 2-Day Crash Course',
    desc: 'PWM Rules, CPCB portal navigation, EPR targets and credit trading explained in one weekend. Free entry point for all PIBOs.',
    duration: '2 Days',
    price: '₹999',
    href: '/courses/epr-awareness-bootcamp',
    note: 'Best starting point',
  },
  {
    tier: 'Workshop',
    accentColor: 'bg-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700',
    title: 'Plastic Packaging EPR — Obligations Workshop',
    desc: 'PWM Rules 2022 deep dive for producers and brand owners. Covers packaging weight calculations, SUP norms and PRO selection.',
    duration: '3 Hours',
    price: '₹499',
    href: '/trainings/epr-compliance/plastic-workshop',
  },
  {
    tier: 'Certification',
    accentColor: 'bg-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Plastic Packaging EPR — Certification Programme',
    desc: 'End-to-end producer compliance: target setting, PRO engagement, CPCB portal filing and annual return submission.',
    duration: '2 Weeks',
    price: '₹2,499',
    href: '/trainings/epr-compliance/plastic-certification',
    highlight: true,
  },
  {
    tier: 'Certification',
    accentColor: 'bg-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'E-Waste EPR — Certification Programme',
    desc: 'E-Waste Rules 2022: ITEW/CEEW category mapping, EPR credit procurement, CPCB portal filing and audit readiness.',
    duration: '2 Weeks',
    price: '₹2,499',
    href: '/trainings/epr-compliance/ewaste-certification',
  },
  {
    tier: 'Certification',
    accentColor: 'bg-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Battery Waste EPR — Certification Programme',
    desc: 'Battery Waste Management Rules 2022: producer targets, credit categories, annual return format and penalty exposure.',
    duration: '2 Weeks',
    price: '₹2,499',
    href: '/trainings/epr-compliance/battery-certification',
  },
  {
    tier: 'Mastery',
    accentColor: 'bg-violet-500',
    badgeColor: 'bg-violet-100 text-violet-700',
    title: 'Multi-Stream EPR Mastery for Corporates',
    desc: 'For companies with obligations across multiple waste categories. Integrated compliance calendar, cost modelling and board-level ESG reporting.',
    duration: '4 Weeks',
    price: '₹4,999',
    href: '/trainings/epr-compliance/plastic-mastery',
  },
];

const STATS = [
  { value: '500+', label: 'Corporates Trained' },
  { value: '6', label: 'Waste Stream Regulations' },
  { value: '₹10L+', label: 'Max Annual Penalty Avoided' },
  { value: '24', label: 'EPR Compliance Courses' },
];

const TESTIMONIALS = [
  {
    quote: 'Before the course, our team had no idea we owed EPR targets as an importer. The training helped us register, calculate our liability and file our first annual return — all within 6 weeks.',
    name: 'GM Compliance',
    role: 'Electronics Importer, Delhi NCR',
  },
  {
    quote: 'The multi-stream mastery programme saved us lakhs by switching from an expensive PRO to a combination of in-house fulfilment and credit trading. The ROI was immediate.',
    name: 'Head of Sustainability',
    role: 'FMCG Company, Mumbai',
  },
];

const PATH_STEPS = [
  {
    num: '01',
    title: 'Know Your Obligations',
    desc: 'Start with the Awareness Bootcamp to map your products to the right EPR categories, calculate preliminary targets and understand your liability exposure.',
  },
  {
    num: '02',
    title: 'Get Certified in Your Category',
    desc: 'Enrol in the stream-specific certification (Plastic, E-Waste, Battery) that covers your primary business. Your team leaves with filing-ready skills.',
  },
  {
    num: '03',
    title: 'Build Multi-Stream Capability',
    desc: 'Upgrade to the Mastery programme for integrated EPR cost management, credit optimisation and board-level ESG compliance reporting across all streams.',
  },
];

const PENALTY_RISKS = [
  { stream: 'Plastic Packaging', risk: 'Up to ₹10 lakh per year + credit shortfall liability', rule: 'PWM Rules 2022, Rule 9' },
  { stream: 'E-Waste', risk: 'Penalty proceedings + factory closure orders by SPCBs', rule: 'E-Waste Rules 2022, Rule 16' },
  { stream: 'Battery Waste', risk: '₹1 lakh to ₹5 crore under Environment Protection Act', rule: 'Battery Waste Rules 2022' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForPibsCorporatesPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#040d1c] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-80px] left-[-80px] w-[440px] h-[440px] bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[280px] h-[280px] bg-indigo-500/8 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-6">
                <Factory className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  EPR Academy · For PIBOs & Corporates
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                Know Your EPR Obligations<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                  Before CPCB Does
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                Purpose-built compliance training for Producers, Importers and Brand Owners.
                Understand your plastic, e-waste and battery EPR obligations, calculate targets accurately
                and file CPCB returns without penalties.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Map every product to the right EPR category and calculate annual targets',
                  'Navigate CPCB portal registration and annual return filing step by step',
                  'Trade EPR credits cost-effectively — know fair market pricing before you buy',
                  'Avoid ₹10 lakh+ penalties with compliant filing and audit-ready documentation',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/trainings#epr-compliance-courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition-all"
                >
                  Browse PIBO Courses <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/courses/epr-awareness-bootcamp"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  Start Free — Awareness Bootcamp
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

      {/* ── Penalty Risk Bar ──────────────────────────────────────────────── */}
      <section className="bg-red-50 border-y border-red-100 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="font-bold text-red-700 text-sm">Non-compliance penalties under India EPR rules</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PENALTY_RISKS.map((r) => (
              <div key={r.stream} className="bg-white rounded-xl border border-red-100 px-5 py-4">
                <p className="font-bold text-gray-900 text-sm mb-1">{r.stream}</p>
                <p className="text-red-600 text-[12px] font-medium mb-1">{r.risk}</p>
                <p className="text-gray-400 text-[11px]">{r.rule}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-red-700 font-medium text-center">
            Our courses ensure you never face these penalties.{' '}
            <Link href="/courses/epr-awareness-bootcamp" className="underline hover:text-red-900">
              Start with the Awareness Bootcamp →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Who Is It For ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <Factory className="w-3.5 h-3.5" /> Who Is This For
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Built for Companies with EPR Obligations
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              If your business places regulated products or packaging on the Indian market, you have EPR obligations.
              These courses turn that legal requirement into a manageable, in-house process.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHO_PROFILES.map((profile) => (
              <div
                key={profile.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{profile.icon}</span>
                  {profile.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profile.badgeColor}`}>
                      {profile.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{profile.title}</h3>
                <p className="text-gray-500 text-[12px] mb-2 leading-relaxed">{profile.profile}</p>
                <div className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-[11px] leading-relaxed font-medium">{profile.obligation}</p>
                </div>
                <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-blue-800 text-[12px] leading-relaxed">{profile.benefit}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              Multiple business units with different streams?{' '}
              <Link href="/contact" className="text-blue-600 hover:underline font-semibold">
                Book a corporate training consultation →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── What You Gain ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">What You&apos;ll Walk Away With</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              From understanding your first EPR obligation to running a fully in-house compliance programme.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHAT_YOU_GAIN.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-[12.5px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Course List ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200 mb-3">
                PIBO COURSE CATALOGUE
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900">Courses for PIBOs & Corporates</h2>
              <p className="mt-2 text-gray-500 text-sm">
                Category-specific certifications across plastic, e-waste, battery, tyre, ELV and used-oil EPR streams.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-semibold"
            >
              View full course catalogue <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COURSES.map((course) => (
              <Link
                key={course.title}
                href={course.href}
                className={`group flex flex-col rounded-2xl border transition-all overflow-hidden hover:shadow-md ${
                  course.highlight
                    ? 'border-blue-300 ring-2 ring-blue-300/40 shadow-blue-100'
                    : 'border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className={`h-1.5 w-full ${course.accentColor}`} />
                <div className="p-5 flex flex-col flex-1 gap-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${course.badgeColor}`}>
                      {course.tier}
                    </span>
                    {course.highlight && (
                      <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                        Most Popular
                      </span>
                    )}
                    {course.note && !course.highlight && (
                      <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                        {course.note}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-[12px] leading-relaxed flex-1">{course.desc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-gray-400">{course.duration}</span>
                    <span className="font-bold text-gray-900 text-sm">{course.price}</span>
                  </div>
                </div>
                <div className="px-5 pb-4 bg-white">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover:underline">
                    View course <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/trainings#epr-compliance-courses"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 px-6 py-3 text-sm font-semibold text-blue-700 transition-all"
            >
              Browse All 24 EPR Compliance Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Learning Path ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">Your Compliance Learning Path</h2>
            <p className="text-blue-100/80 text-sm">
              From first-time EPR registrant to a fully self-sufficient compliance programme.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PATH_STEPS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < PATH_STEPS.length - 1 && (
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
          <div className="mt-10 text-center">
            <Link
              href="/courses/epr-awareness-bootcamp"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 hover:bg-gray-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Start with EPR Awareness Bootcamp <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">
            What Corporates Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-gray-50 p-7 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-[13px]">{t.name}</p>
                  <p className="text-gray-400 text-[12px]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Strip ──────────────────────────────────────────────────── */}
      <section className="py-8 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {[
              'Aligned with CPCB Portal 2024',
              'PWM / E-Waste / Battery Rules Covered',
              'Penalty Avoidance Focus',
              'Certificate of Completion',
              'Courses from ₹999',
            ].map((badge) => (
              <span key={badge} className="flex items-center gap-2 text-gray-500 text-[12px] font-medium">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#040d1c] py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-5 leading-tight">
            Stop Reacting to CPCB Notices.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Start Managing EPR Proactively.
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            24 EPR compliance courses for producers, importers and brand owners across every waste category. Enrol your team today.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/trainings#epr-compliance-courses"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition-all"
            >
              Browse All PIBO Courses <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Talk to a Compliance Expert
            </a>
          </div>
          <p className="mt-8 text-slate-500 text-[12px]">
            Contact our team: <ContactEmail className="font-semibold text-sky-300 hover:underline" />
          </p>
        </div>
      </section>
    </div>
  );
}


