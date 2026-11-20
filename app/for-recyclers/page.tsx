import Link from 'next/link';
import ContactEmail from '@/components/public-site/ContactEmail';
import type { Metadata } from 'next';
import {
  CheckCircle, XCircle, ArrowRight, Leaf, TrendingUp, Bell, MessageSquare,
  Users, BarChart3, ShieldCheck, RefreshCw, FileText, Zap, Award,
  IndianRupee, Gavel, Calendar, Package,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Recyclers & PROs | EPR Compass — Win More Contracts, Earn More',
  description:
    'India\'s dedicated recycler intelligence portal. AI-matched EPR tenders, live auction rooms, corporate sourcing requests, CPCB alerts, and credit trading — all in one place. Join 200+ verified recyclers.',
  keywords:
    'EPR recycler portal India, EPR credit trading, recycler tender matching, CPCB certified recycler, EPR live auctions, PRO registration India',
  alternates: { canonical: '/for-recyclers' },
  openGraph: {
    title: 'For Recyclers & PROs | EPR Compass',
    description:
      'Win more EPR credit contracts. AI-matched tenders, live auction rooms, corporate sourcing, and CPCB compliance — built for India\'s registered recycler network.',
    url: '/for-recyclers',
    type: 'website',
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  'Tender opportunities are scattered — no centralised matching for your categories and states',
  'Auction bidding is opaque — you don\'t know your rank until the round is over',
  'CPCB and SPCB regulatory changes arrive too late, causing compliance deadline misses',
  'Corporate procurement requests come informally — no structured negotiation or audit trail',
  'EPR credit pricing is opaque — you sell without knowing the true market rate',
];

const PORTAL_FEATURES = [
  {
    icon: TrendingUp,
    title: 'AI Tender Matching',
    desc: 'Every tender scored 0–100 against your EPR categories, states, capacity and certifications. See only the tenders you can win.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Gavel,
    title: 'Live Auction Rooms',
    desc: 'Bid in real-time REVERSE and FORWARD auctions with a live countdown, auto-extension alerts, and your current rank — no page refresh needed.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Bell,
    title: 'CPCB Regulatory Alerts',
    desc: 'CPCB, MoEFCC and SPCB circulars urgency-ranked and filtered to your waste categories and states. CRITICAL alerts delivered instantly.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: MessageSquare,
    title: 'Corporate Request Inbox',
    desc: 'Receive direct sourcing requests from corporates. Respond with structured 5-round negotiation threads and an immutable message history.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Users,
    title: 'Buyer Network',
    desc: 'Browse and connect with 500+ verified corporate buyers who need EPR credits in your categories. Build long-term offtake agreements.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: IndianRupee,
    title: 'EPR Credit Trading',
    desc: 'List your EPR credits, set your floor price, and trade with corporate buyers — with full traceability and certificate issuance.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: BarChart3,
    title: 'Price Intelligence',
    desc: 'Real-time EPR credit price feeds by category and state. Know the market rate before you bid, negotiate or list.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: FileText,
    title: 'Traceability Ledger',
    desc: 'End-to-end waste traceability from collection to processing. Immutable records for CPCB audits and annual return filing.',
    color: 'bg-orange-50 text-orange-600',
  },
];

const ADDITIONAL_FEATURES = [
  { icon: Calendar, label: 'Capacity Calendar' },
  { icon: RefreshCw, label: 'Cert Renewal Tracker' },
  { icon: Package, label: 'CPCB Returns' },
  { icon: BarChart3, label: 'Analytics Dashboard' },
  { icon: ShieldCheck, label: 'Authorizations' },
  { icon: FileText, label: 'Document Vault' },
  { icon: Zap, label: 'Govt Tender Feed' },
  { icon: Award, label: 'Reputation Score' },
];

const STEPS = [
  {
    num: '01',
    title: 'Register & Verify',
    desc: 'Submit your CPCB registration code. Our team verifies your categories, states and certifications — done in 24–48 hours.',
  },
  {
    num: '02',
    title: 'Get Matched',
    desc: 'AI tender alerts drop in your inbox, live auction invites arrive in real time, and corporate sourcing requests come directly to your portal.',
  },
  {
    num: '03',
    title: 'Close & Earn',
    desc: 'Negotiate, issue EPR credit certificates, log tonnage and file CPCB returns — all from one dashboard.',
  },
];

const PRICING = [
  {
    name: 'Recycler Registered',
    highlight: false,
    badge: null,
    items: [
      'PRO / PWP registration support',
      'Recycler Portal access',
      'Tender alert feed (basic)',
      'CPCB regulatory alerts',
      'Document vault',
      'Email support',
    ],
    cta: 'Get Registered',
  },
  {
    name: 'Recycler Active',
    highlight: true,
    badge: 'Most Popular',
    items: [
      'Everything in Registered',
      'AI tender match scoring (0–100)',
      'Live auction room access',
      'Corporate request inbox',
      '5-round negotiation threads',
      'Price intelligence feed',
      'Dedicated account manager',
    ],
    cta: 'Contact Us',
  },
  {
    name: 'Recycler Enterprise',
    highlight: false,
    badge: null,
    items: [
      'Everything in Active',
      'Priority tender & auction alerts',
      'Custom traceability system',
      'Pan-India multi-state support',
      'Revenue optimisation dashboard',
      'API access for integration',
      'Dedicated compliance officer',
    ],
    cta: 'Request Partnership',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The tender matching feature alone saved us hours of manual screening. We now respond only to tenders where we score above 70 — and our close rate has tripled.',
    name: 'Operations Head',
    role: 'Plastic Recycling Unit, Maharashtra',
  },
  {
    quote:
      'The live auction room is a game-changer. Real-time rank tracking, no page refresh. We closed three EPR credit contracts in the first week.',
    name: 'PRO Manager',
    role: 'E-Waste Management Company, Karnataka',
  },
];

const STATS = [
  { value: '200+', label: 'Verified Recyclers' },
  { value: '₹30K/T', label: 'Max EPR Credit Value' },
  { value: '500+', label: 'Corporate Buyers' },
  { value: 'Real-Time', label: 'Live Auctions' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForRecyclersPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#080f1e] overflow-hidden">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        {/* Glow orbs */}
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[320px] h-[320px] bg-indigo-500/8 rounded-full blur-[80px] pointer-events-none" />
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-teal-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left: copy */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6">
                <Leaf className="w-4 h-4 text-teal-400" />
                <span className="text-teal-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  Recycler Intelligence Portal
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                Stop Chasing Tenders.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-300">
                  Start Winning Contracts.
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                India&apos;s only EPR platform built exclusively for recyclers and PROs. Earn ₹8,000–₹30,000 per tonne, win AI-matched tenders, and close corporate deals — from one portal.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'AI-matched tender alerts — scored by your EPR category, state & capacity',
                  'Live auction rooms with real-time bidding rank and countdown',
                  'Direct corporate sourcing requests with 5-round negotiation',
                  'CPCB, MoEFCC & SPCB regulatory alerts filtered to your categories',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/recycler-portal/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/40 transition-all"
                >
                  Access Recycler Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  Request a Demo
                </Link>
              </div>
            </div>

            {/* Right: stats */}
            <div className="relative">
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
              {/* Decorative bottom note */}
              <p className="mt-4 text-center text-slate-500 text-[11px] tracking-wide">
                CPCB-registered network · SSL encrypted · 24-hour verification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain Points ───────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              Why Recyclers Lose Revenue Without the Right Intelligence
            </h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              Most recyclers manage EPR credit contracts reactively. The platform levels the playing field.
            </p>
          </div>
          <ul className="space-y-3 max-w-2xl mx-auto">
            {PAIN_POINTS.map((pt) => (
              <li key={pt} className="flex items-start gap-3 bg-white rounded-xl border border-red-100 px-5 py-4 shadow-sm">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-gray-900 font-semibold">
            You need an intelligence portal, not just a registration.
          </p>
        </div>
      </section>

      {/* ── Portal Features ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <Leaf className="w-3.5 h-3.5" /> What&apos;s Inside the Portal
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Every Tool You Need to Win
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Eight core modules designed to get you from discovery to closed contract faster than any other platform in India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PORTAL_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-[12.5px] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Additional features pill list */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {ADDITIONAL_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 bg-gray-50 text-gray-600 text-[12px] font-medium"
                >
                  <Icon className="w-3.5 h-3.5 text-teal-500" />
                  {f.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#07875f] to-[#056c4c]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">How It Works</h2>
            <p className="text-teal-100/80 text-sm">
              From registration to recurring revenue — three steps, 48 hours to your first tender match.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < STEPS.length - 1 && (
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
              href="/recycler-portal/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-teal-700 hover:bg-gray-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Get Started Today <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Choose Your Plan</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Start with a free registration and upgrade as you grow. No long-term lock-in.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 flex flex-col shadow-sm transition-all ${
                  tier.highlight
                    ? 'bg-[#07875f] text-white ring-2 ring-[#07875f] md:scale-[1.03] shadow-teal-200/60'
                    : 'bg-white border border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold text-[15px] ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {tier.name}
                  </h3>
                  {tier.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {tier.badge}
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5 mt-5 flex-1">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px]">
                      <CheckCircle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? 'text-teal-100' : 'text-teal-500'}`}
                      />
                      <span className={tier.highlight ? 'text-white/90' : 'text-gray-600'}>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`mt-8 block text-center rounded-xl py-3 text-sm font-bold transition-all ${
                    tier.highlight
                      ? 'bg-white text-teal-700 hover:bg-gray-50'
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-gray-400 text-[12px]">
            Contact our team at <ContactEmail className="font-semibold text-teal-600 hover:underline" /> or use our contact form: 
            <a href="/contact" className="text-teal-600 hover:underline">
              Contact us
            </a>
          </p>
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
              <div
                key={t.name}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-7 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
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

      {/* ── Trust strip ───────────────────────────────────────────────────── */}
      <section className="py-8 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {[
              'CPCB EPR Portal Certified',
              'PWM Rules 2022 Compliant',
              '200+ Verified Recyclers',
              'SSL Encrypted Platform',
              '24-Hour Onboarding',
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
      <section className="relative bg-[#080f1e] py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-teal-400 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-teal-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6">
            <Leaf className="w-4 h-4 text-teal-400" />
            <span className="text-teal-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
              Join India&apos;s Fastest-Growing Recycler Network
            </span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-5 leading-tight">
            Win More Contracts with the<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-300">
              Recycler Intelligence Portal
            </span>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            Tender matching, live auctions, CPCB alerts and corporate negotiations — all in one place. Join 200+ verified recyclers already earning more.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/recycler-portal/login"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/40 transition-all"
            >
              Access Recycler Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/recycler-connect"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Browse Recycler Network
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



