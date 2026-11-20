import Link from 'next/link';
import ContactEmail from '@/components/public-site/ContactEmail';
import {
  CheckCircle, ArrowRight, RefreshCw, Award, BarChart3, ShieldCheck,
  FileText, TrendingUp, IndianRupee, Users, Gavel, Bell, BookOpen,
  Zap, ChevronRight, Star,
} from 'lucide-react';

export const metadata = {
  title: 'EPR Academy for Recyclers & PROs | Courses, Certification & Business Growth',
  description:
    'Courses designed exclusively for plastic recyclers, e-waste dismantlers, battery recyclers, PROs and waste management companies. Learn EPR credit generation, CPCB compliance, tender winning and business expansion.',
  keywords:
    'EPR courses for recyclers India, PRO certification, recycler EPR compliance training, CPCB portal recycler, EPR credit generation course, waste management certification India',
  alternates: { canonical: '/courses/for-recyclers-pros' },
  openGraph: {
    title: 'EPR Academy for Recyclers & PROs',
    description:
      'Upskill your recycling business — EPR credit generation, CPCB compliance, tender winning and multi-stream expansion. Courses from ₹0 to ₹5,000.',
    url: '/courses/for-recyclers-pros',
    type: 'website',
  },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const WHO_PROFILES = [
  {
    icon: '♻️',
    title: 'Plastic Recyclers',
    profile: 'CPCB-registered plastic waste processors (granulators, shredders, pellet manufacturers)',
    benefit: 'Learn to generate high-value EPR credits, file PWM returns correctly and win corporate offtake contracts',
    badge: 'Most enrolled',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: '💻',
    title: 'E-Waste Dismantlers & Recyclers',
    profile: 'Authorised e-waste recyclers handling ITEW, CEEW and solar panels',
    benefit: 'Master extended producer responsibility credit settlement, CPCB audit prep and IT asset dismantling compliance',
    badge: 'High demand',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    icon: '🔋',
    title: 'Battery Waste Recyclers',
    profile: 'Lithium-ion, lead-acid and industrial battery collection & processing units',
    benefit: 'Understand Battery Waste Management Rules 2022, EPR credit types and multi-chemistry compliance reporting',
    badge: '',
    badgeColor: '',
  },
  {
    icon: '🏭',
    title: 'Producer Responsibility Organisations (PROs)',
    profile: 'PROs operating plastic, e-waste or battery take-back programmes on behalf of producers',
    benefit: 'Strengthen target fulfilment strategy, client onboarding & CPCB return accuracy for your entire producer portfolio',
    badge: 'PRO-specific',
    badgeColor: 'bg-teal-100 text-teal-700',
  },
  {
    icon: '🚛',
    title: 'Collection Aggregators & Waste Management Companies',
    profile: 'Informal sector aggregators, urban collection agencies and municipal partners',
    benefit: 'Formalise your business, get CPCB-listed and connect with corporate EPR buyers for recurring contracts',
    badge: '',
    badgeColor: '',
  },
  {
    icon: '🔄',
    title: 'Tyre, ELV & Used Oil Recyclers',
    profile: 'Pyrolysis units, AVSFs, used-oil re-refiners and non-ferrous scrap processors',
    benefit: 'Navigate multi-stream EPR obligations, unlock credit revenue and build compliant supply chains',
    badge: 'New streams',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
];

const WHAT_YOU_GAIN = [
  { icon: IndianRupee, title: 'Maximise EPR Credit Revenue', desc: 'Understand pricing, settlement timelines and how to negotiate better rates with corporate buyers' },
  { icon: ShieldCheck, title: 'Zero CPCB Non-Compliance Risk', desc: 'File annual returns correctly, avoid rejection reasons and pass CPCB audits confidently' },
  { icon: Gavel, title: 'Win More Tenders & Contracts', desc: 'Learn tender screening, bid preparation and negotiation strategies used by top recyclers' },
  { icon: TrendingUp, title: 'Expand to New Waste Streams', desc: 'Map your existing infrastructure to adjacent EPR categories — plastic, e-waste, battery and beyond' },
  { icon: Users, title: 'Build Your Buyer Network', desc: 'Connect with 500+ corporate EPR buyers and build long-term offtake agreements' },
  { icon: Award, title: 'Get Industry-Recognised Credentials', desc: 'Earn EPR Academy certificates that validate your compliance capabilities to corporate clients' },
];

const COURSES = [
  {
    tier: 'Free Workshop',
    accentColor: 'bg-emerald-400',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    title: 'EPR Credit Generation for Recyclers',
    desc: 'A 90-minute live session on how EPR credits are generated, valued and settled. Covers plastic, e-waste and battery streams.',
    duration: '90 min',
    price: 'Free',
    href: '/trainings#recycler-courses',
  },
  {
    tier: 'Workshop',
    accentColor: 'bg-teal-400',
    badgeColor: 'bg-teal-100 text-teal-700',
    title: 'CPCB Portal for Recyclers — Live Walkthrough',
    desc: 'Step-by-step portal navigation: registration, annual returns, credit submission and audit documentation.',
    duration: '3 Hours',
    price: '₹499',
    href: '/trainings/recycler/plastic-workshop',
  },
  {
    tier: 'Certification',
    accentColor: 'bg-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Plastic Recycling — EPR Certification Programme',
    desc: 'The most comprehensive course for plastic recyclers. PWM Rules deep-dive, credit generation, return filing and corporate contract playbook.',
    duration: '2 Weeks',
    price: '₹2,499',
    href: '/trainings/recycler/plastic-certification',
    highlight: true,
  },
  {
    tier: 'Certification',
    accentColor: 'bg-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'E-Waste Recycling — EPR Certification Programme',
    desc: 'E-Waste Rules 2022, authorised recycler requirements, ITEW/CEEW credit categories and CPCB audit prep.',
    duration: '2 Weeks',
    price: '₹2,499',
    href: '/trainings/recycler/ewaste-certification',
  },
  {
    tier: 'Certification',
    accentColor: 'bg-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Battery Recycling — EPR Certification Programme',
    desc: 'Battery Waste Management Rules 2022, multi-chemistry compliance, credit types and market opportunities.',
    duration: '2 Weeks',
    price: '₹2,499',
    href: '/trainings/recycler/battery-certification',
  },
  {
    tier: 'Mastery',
    accentColor: 'bg-violet-500',
    badgeColor: 'bg-violet-100 text-violet-700',
    title: 'Recycler Business Mastery — Scale & Diversify',
    desc: 'Multi-stream EPR strategy, tender winning system, corporate negotiation and business development for recycling units.',
    duration: '4 Weeks',
    price: '₹4,999',
    href: '/trainings/recycler/plastic-mastery',
  },
];

const STATS = [
  { value: '200+', label: 'Verified Recyclers Trained' },
  { value: '8', label: 'Waste Stream Specialisations' },
  { value: '₹30K/T', label: 'Max EPR Credit Value' },
  { value: '500+', label: 'Corporate Buyer Connections' },
];

const TESTIMONIALS = [
  {
    quote: 'The EPR credit generation workshop helped us understand why our credit submissions kept getting rejected. After the course, we passed our annual return without a single query.',
    name: 'Operations Director',
    role: 'Plastic Recycling Unit, Pune',
  },
  {
    quote: 'The certification gave us the credibility to approach large corporate buyers directly. We signed two long-term offtake agreements within a month of completing the course.',
    name: 'Founder',
    role: 'E-Waste Recycling Co., Bangalore',
  },
];

const PATH_STEPS = [
  { num: '01', title: 'Start with a Free Workshop', desc: 'Choose your waste stream and attend the 90-min free session to see what\'s covered and how it applies to your business.' },
  { num: '02', title: 'Get Certified in Your Stream', desc: 'Enrol in the 2-week certification for your primary waste category. Practice on real CPCB portal scenarios with live coaching.' },
  { num: '03', title: 'Scale with Mastery & Portal Access', desc: 'Unlock multi-stream expansion, corporate buyer network and AI tender matching inside the Recycler Intelligence Portal.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForRecyclersProsPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#06151a] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-80px] left-[-80px] w-[440px] h-[440px] bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[280px] h-[280px] bg-emerald-500/8 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6">
                <RefreshCw className="w-4 h-4 text-teal-400" />
                <span className="text-teal-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  EPR Academy · For Recyclers & PROs
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                Turn Compliance into<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                  Competitive Advantage
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                Courses built exclusively for recycling businesses — plastic, e-waste, battery, tyre, ELV and beyond.
                Master EPR credit generation, CPCB compliance and corporate contract winning from India&apos;s only recycler-focused EPR academy.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Generate more EPR credits — understand valuation, submission & settlement',
                  'File CPCB annual returns without rejections or penalties',
                  'Win corporate offtake contracts with a proven negotiation playbook',
                  'Expand to adjacent waste streams with multi-stream EPR strategy',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/trainings#recycler-courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/40 transition-all"
                >
                  Browse Recycler Courses <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/for-recyclers"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  Recycler Intelligence Portal
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

      {/* ── Who Is It For ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <RefreshCw className="w-3.5 h-3.5" /> Who Is This For
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Built for Recycling Businesses
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Every course is designed around the real operational challenges of verified recyclers, PROs and waste processors — not generic compliance theory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHO_PROFILES.map((profile) => (
              <div
                key={profile.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
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
                <p className="text-gray-500 text-[12px] mb-3 leading-relaxed">{profile.profile}</p>
                <div className="flex items-start gap-2 bg-teal-50 rounded-lg px-3 py-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <p className="text-teal-800 text-[12px] leading-relaxed">{profile.benefit}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              Not sure which track fits your business?{' '}
              <a href="/contact" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline font-semibold">
                Talk to a course advisor →
              </a>
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
              Practical skills and business outcomes — not just theory.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHAT_YOU_GAIN.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-teal-600" />
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
              <span className="inline-block bg-teal-50 text-teal-700 text-[11px] font-bold px-3 py-1 rounded-full border border-teal-200 mb-3">
                RECYCLER COURSE CATALOGUE
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900">Courses for Recyclers & PROs</h2>
              <p className="mt-2 text-gray-500 text-sm">
                Workshops, certifications and mastery programmes across 8 waste stream categories.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:underline font-semibold"
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
                    ? 'border-teal-300 ring-2 ring-teal-300/40 shadow-teal-100'
                    : 'border-gray-100 hover:border-teal-200'
                }`}
              >
                <div className={`h-1.5 w-full ${course.accentColor}`} />
                <div className="p-5 flex flex-col flex-1 gap-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${course.badgeColor}`}>
                      {course.tier}
                    </span>
                    {course.highlight && (
                      <span className="rounded-full bg-teal-100 text-teal-700 px-2 py-0.5 text-[10px] font-bold">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-teal-600 transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-[12px] leading-relaxed flex-1">{course.desc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-3 text-[11px] text-gray-400">
                      <span>{course.duration}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{course.price}</span>
                  </div>
                </div>
                <div className="px-5 pb-4 bg-white">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 group-hover:underline">
                    View course <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/trainings#recycler-courses"
              className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 px-6 py-3 text-sm font-semibold text-teal-700 transition-all"
            >
              Browse All 24 Recycler Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Learning Path ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#07875f] to-[#056c4c]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">Your Learning Path</h2>
            <p className="text-teal-100/80 text-sm">
              Go from CPCB compliance uncertainty to a scalable, credit-generating recycling business.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PATH_STEPS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < PATH_STEPS.length - 1 && (
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
          <div className="mt-10 text-center">
            <Link
              href="/courses/epr-awareness-bootcamp"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-teal-700 hover:bg-gray-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Start with Free Workshop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">
            What Recyclers Are Saying
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
              'CPCB EPR Portal Certified Instructors',
              'Courses from ₹0',
              '8 Waste Stream Specialisations',
              'Live Sessions with Q&A',
              'Certificate Included',
            ].map((badge) => (
              <span key={badge} className="flex items-center gap-2 text-gray-500 text-[12px] font-medium">
                <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#06151a] py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-5 leading-tight">
            Grow Your Recycling Business<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              with the Right Knowledge
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            India&apos;s only EPR academy designed for recyclers. Start free, certify your team and access the recycler intelligence portal.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/trainings#recycler-courses"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/40 transition-all"
            >
              Browse Recycler Courses <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-recyclers"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Access Recycler Portal
            </Link>
          </div>
          <p className="mt-8 text-slate-500 text-[12px]">
            Contact our team: <ContactEmail className="font-semibold text-teal-300 hover:underline" />
          </p>
        </div>
      </section>
    </div>
  );
}


