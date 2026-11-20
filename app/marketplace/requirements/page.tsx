import Link from 'next/link';
import { type Metadata } from 'next';
import {
  CheckCircle, ArrowRight, TrendingUp, RefreshCw, ClipboardList, Handshake, ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'EPR Requirements Board | Post & Browse EPR Credits, Recycling & Compliance Needs',
  description:
    "Post or browse EPR-related requirements — EPR credits needed, recycling capacity available, compliance services sought, PRO partnerships. India's EPR requirements exchange.",
  alternates: { canonical: '/marketplace/requirements' },
};

const STATS = [
  { value: '500+', label: 'Active Requirements' },
  { value: '4', label: 'Requirement Types' },
  { value: '48hr', label: 'Avg Response Time' },
  { value: '₹0', label: 'To Post' },
];

const REQUIREMENT_TYPES = [
  {
    icon: TrendingUp,
    title: 'EPR Credits Needed',
    desc: 'Companies with EPR targets seeking verified credits (Plastic, E-Waste, Battery, Tyre). Specify quantity, category, deadline and budget.',
    badge: 'For PIBOs',
    badgeColor: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: RefreshCw,
    title: 'Recycling Capacity Available',
    desc: 'Recyclers listing available capacity with MT/month, CPCB category and state. Connect with buyers needing channelization.',
    badge: 'For Recyclers',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: ClipboardList,
    title: 'Compliance Services Needed',
    desc: 'Companies seeking EPR consultants for registration, annual returns, target calculation or audit support.',
    badge: 'For Companies',
    badgeColor: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: Handshake,
    title: 'PRO Partnership Sought',
    desc: 'PIBOs seeking PRO partners. PROs advertising open producer slots. Match on category, geography and fulfilment model.',
    badge: 'For PROs',
    badgeColor: 'bg-violet-100 text-violet-700',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
];

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Create Your Requirement',
    desc: 'Sign up or log in. Post your requirement with category, quantity, state and deadline. Takes 3 minutes.',
  },
  {
    num: '02',
    title: 'Get Matched',
    desc: 'Our system surfaces your requirement to relevant counterparties. Email notifications go out to matching profiles.',
  },
  {
    num: '03',
    title: 'Negotiate & Close',
    desc: 'Chat, negotiate and close the deal — directly between buyer and seller with full message history maintained.',
  },
];

const TRUST_POINTS = [
  'All posters are verified EPR platform users — no spam',
  'Requirements reviewed by our EPR team before going live',
  'Message history and audit trail maintained',
  'Free to post — no listing fees',
];

export default function RequirementsBoardLandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#140a00] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-80px] left-[-80px] w-[440px] h-[440px] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[280px] h-[280px] bg-orange-500/8 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-6">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  EPR Marketplace · Requirements Board
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                Post Your EPR Requirement —{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">
                  Credits, Capacity, Consulting
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                India&apos;s EPR requirements exchange. Post what you need — EPR credits, recycling capacity, compliance
                services or PRO partnerships. Browse what others are offering. Get matched fast.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Post EPR credit requirements — type, quantity, deadline, budget',
                  'Browse available recycling capacity by waste category and state',
                  'Find compliance services for registration, audits and returns',
                  'Advertise PRO partnership capacity and channelization services',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketplace/requirements/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-900/40 transition-all"
                >
                  Post a Requirement <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/marketplace/requirements/browse"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  Browse Requirements
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

      {/* ── Requirement Types ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              What Can You Post on the Requirements Board?
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Four types of requirements — covering every side of the EPR compliance and fulfilment market.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {REQUIREMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.title}
                  className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-amber-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${type.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${type.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${type.badgeColor}`}>
                      {type.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{type.title}</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">{type.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-amber-600 to-orange-600">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">How It Works</h2>
            <p className="text-amber-100/80 text-sm">
              Post, match and close — in three straightforward steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+16px)] w-8 border-t-2 border-dashed border-amber-300/40" />
                )}
                <div className="bg-white/[0.1] backdrop-blur-sm border border-white/[0.15] rounded-2xl p-7 h-full">
                  <div className="text-5xl font-black text-white/20 mb-3 leading-none">{step.num}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-amber-100/80 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">A Board You Can Trust</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Every requirement is posted by a verified EPR platform user. No spam, no unverified vendors.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {TRUST_POINTS.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-amber-600 py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
            Ready to Post Your EPR Requirement?
          </h2>
          <p className="text-amber-100 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            Join 500+ companies and recyclers actively matching on the Requirements Board. Free to post. Verified respondents only.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace/requirements/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-amber-700 hover:bg-amber-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Post a Requirement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/marketplace/requirements/browse"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/[0.1] hover:bg-white/[0.18] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Browse Requirements
            </Link>
          </div>
          <p className="mt-6 text-amber-200 text-[12px]">
            You&apos;ll need to sign in or create a free account to post or browse requirements.
          </p>
        </div>
      </section>

    </div>
  );
}
