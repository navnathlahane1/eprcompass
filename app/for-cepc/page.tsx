import Link from 'next/link';
import ContactEmail from '@/components/public-site/ContactEmail';
import type { Metadata } from 'next';
import {
  CheckCircle, ArrowRight, Award, BookOpen, IndianRupee,
  Globe, TrendingUp, ShieldCheck, Users, BarChart3,
  ClipboardList, BadgeCheck, Star, Briefcase, FileText, Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Become a Certified EPR Professional Consultant (CEPC) | Earn ₹50K–₹2L+/month',
  description:
    'Get CEPC certified and build a lucrative EPR compliance consulting practice. 60-hour online training covering all waste categories. Government-recognised credential. Earn ₹50K–₹2L+ per month.',
  keywords: 'CEPC certification, EPR consultant certification, EPR professional training, EPR consultant India, plastic waste consultant, environmental compliance career',
  alternates: { canonical: '/for-cepc' },
  openGraph: {
    title: 'Become a CEPC — Certified EPR Professional Consultant | EPR Compass',
    description: 'Get certified. Build your practice. Earn ₹50K–₹2L+/month as an EPR compliance consultant. 60-hour training, all waste categories.',
    url: '/for-cepc',
    type: 'website',
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const WHY_CEPC = [
  { icon: Award, title: 'Government-Recognised Credential', desc: 'CEPC certification makes you eligible to sign EPR compliance reports and audit submissions for CPCB and SPCB portals.' },
  { icon: IndianRupee, title: 'High Earning Potential', desc: 'Certified consultants earn ₹50K–₹2L+ per month managing multiple clients across waste categories. Scale with no geographic limits.' },
  { icon: TrendingUp, title: 'Surging Market Demand', desc: 'Over 100,000 businesses in India need EPR compliance. Less than 2% have certified support — the gap is enormous.' },
  { icon: Globe, title: 'Work Remotely, Serve Nationally', desc: 'Most EPR compliance work is digital — portal filings, audits and consulting can be done from anywhere in India.' },
  { icon: BookOpen, title: 'All 6 Waste Categories', desc: 'Our programme covers Plastic, E-Waste, Battery, Tyre, Used Oil and ELV — making you a full-spectrum EPR consultant.' },
  { icon: ShieldCheck, title: 'SaaS Platform Included', desc: 'Manage all your clients — filings, documents, certificates, dashboards — from the CEPC portal without extra tools.' },
];

const CERTIFICATION_PATH = [
  { num: '01', title: 'Apply & Get Accepted', desc: 'Submit your application. We evaluate qualifications and experience within 3 business days and send your acceptance letter.' },
  { num: '02', title: 'Complete 60-Hour Training', desc: 'Online, self-paced programme covering PWM Rules 2022, all waste categories, CPCB portal operations, and compliance reporting.' },
  { num: '03', title: 'Pass the Assessment', desc: 'Complete the proctored assessment covering all waste categories. Minimum 70% required. Three attempts included.' },
  { num: '04', title: 'Get Certified & Start Practising', desc: 'Receive your CEPC credential, get listed on our consultant marketplace, and start accepting client engagements immediately.' },
];

const PLATFORM_FEATURES = [
  { icon: Users, title: 'Client Portfolio Dashboard', desc: 'Track all clients, their compliance status, filing deadlines, and certificate progress — in one unified view.', color: 'bg-violet-50 text-violet-600' },
  { icon: ClipboardList, title: 'CPCB Filing Support', desc: 'Pre-filled form templates, filing checklists and deadline alerts for all PWM Rules categories.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: BadgeCheck, title: 'Certificate Management', desc: 'Issue, track and renew EPR credit certificates for clients. Full traceability on every certificate.', color: 'bg-blue-50 text-blue-600' },
  { icon: BarChart3, title: 'Commission Tracking', desc: 'Real-time view of referral commissions, client renewals, and payout history.', color: 'bg-green-50 text-green-600' },
  { icon: FileText, title: 'Document Vault', desc: 'Secure per-client document storage for CPCB certificates, authorisations, and compliance records.', color: 'bg-amber-50 text-amber-600' },
  { icon: Zap, title: 'Regulatory Alert Feed', desc: 'CPCB, MoEFCC and SPCB notifications filtered to your client categories — stay ahead of every update.', color: 'bg-red-50 text-red-600' },
  { icon: Briefcase, title: 'Leads & Referral Pipeline', desc: 'Log prospective clients, track your pipeline, and earn commissions on every closed engagement.', color: 'bg-purple-50 text-purple-600' },
  { icon: TrendingUp, title: 'Leaderboard & Recognition', desc: 'Compete with peers, earn badges, and get featured on the CEPC consultant marketplace for inbound leads.', color: 'bg-teal-50 text-teal-600' },
];

const TIERS = [
  {
    name: 'CEPC Associate',
    fee: '₹15,000',
    clients: 'Up to 10 clients',
    highlight: false,
    badge: null,
    items: ['Plastic Waste category', 'Basic dashboard', 'Filing templates', 'Email support'],
  },
  {
    name: 'CEPC Professional',
    fee: '₹35,000',
    clients: 'Up to 50 clients',
    highlight: true,
    badge: 'Most Popular',
    items: ['All 6 waste categories', 'Full dashboard', 'Co-branding', 'Priority support', 'Commission earning', 'Marketplace listing'],
  },
  {
    name: 'CEPC Expert',
    fee: '₹60,000',
    clients: 'Unlimited clients',
    highlight: false,
    badge: null,
    items: ['All 6 waste categories', 'White-label portal', 'Dedicated manager', 'Revenue sharing', 'Custom SLA', 'Training cohort access'],
  },
];

const TESTIMONIALS = [
  {
    quote: 'I was an environmental consultant with no EPR specialisation. After CEPC certification, I now manage 18 EPR clients and earn more than my previous full-time salary — remotely.',
    name: 'CEPC Professional',
    role: 'Environmental Consultant, Pune',
  },
  {
    quote: 'The 60-hour training is the most practical EPR content I\'ve found anywhere. Waste categories, CPCB portal, annual returns — everything covered. Started getting client leads within a week of certification.',
    name: 'CEPC Expert',
    role: 'CA & Compliance Consultant, Delhi',
  },
];

const STATS = [
  { value: '1,000+', label: 'CEPCs Certified' },
  { value: '₹50K–₹2L', label: 'Monthly Earning Range' },
  { value: '60 hrs', label: 'Online Training' },
  { value: '6', label: 'Waste Categories' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForCEPCPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#160b30] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[320px] h-[320px] bg-indigo-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-6">
                <Award className="w-4 h-4 text-violet-400" />
                <span className="text-violet-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  CEPC Certification Programme
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                Get Certified. Build a<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
                  ₹50K–₹2L/Month Practice.
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                Become a Certified EPR Professional Consultant (CEPC). The only government-recognised EPR credential in India covering all 6 waste categories — earn more, work remotely.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  'Government-recognised credential — sign CPCB compliance reports',
                  '60-hour online training: all 6 waste categories covered',
                  'Listed on our consultant marketplace for inbound client leads',
                  'Full SaaS platform to manage clients, filings and commissions',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/become-a-cepc"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition-all"
                >
                  Apply for Certification <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cepc/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  CEPC Sign In
                </Link>
              </div>
            </div>

            <div>
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
              <p className="mt-4 text-center text-slate-500 text-[11px] tracking-wide">
                Online & self-paced · 3 attempts included · Lifetime credential
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why CEPC ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">Why Become a CEPC?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Six reasons certified EPR consultants are among the fastest-growing compliance professionals in India.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CEPC.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-[12.5px] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Certification Path ────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-700">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">Your Certification Path</h2>
            <p className="text-violet-100/80 text-sm">From application to first client engagement — typically 3–4 weeks.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CERTIFICATION_PATH.map((step) => (
              <div key={step.num} className="bg-white/[0.1] backdrop-blur-sm border border-white/[0.15] rounded-2xl p-7 flex gap-5">
                <div className="text-4xl font-black text-white/20 leading-none shrink-0">{step.num}</div>
                <div>
                  <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
                  <p className="text-violet-100/80 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/become-a-cepc"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-violet-700 hover:bg-gray-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Start Your Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platform Features ─────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <Award className="w-3.5 h-3.5" /> CEPC Consultant Portal
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Your Consulting Practice, Fully Equipped
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Certified consultants get access to an 8-module SaaS platform — no extra tools, no setup cost.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLATFORM_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-[12.5px] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing / Tiers ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Choose Your CEPC Tier</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Start as an Associate and upgrade as your practice grows. All tiers include the certification credential.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 flex flex-col shadow-sm ${
                  tier.highlight
                    ? 'bg-violet-600 text-white ring-2 ring-violet-600 md:scale-[1.03] shadow-violet-200/60'
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
                <div className={`text-2xl font-extrabold mt-2 mb-1 ${tier.highlight ? 'text-white' : 'text-violet-600'}`}>
                  {tier.fee}
                </div>
                <p className={`text-[12px] mb-5 ${tier.highlight ? 'text-violet-100' : 'text-gray-400'}`}>
                  {tier.clients}
                </p>
                <ul className="space-y-2.5 flex-1">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px]">
                      <CheckCircle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? 'text-violet-200' : 'text-violet-500'}`}
                      />
                      <span className={tier.highlight ? 'text-white/90' : 'text-gray-600'}>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/become-a-cepc"
                  className={`mt-8 block text-center rounded-xl py-3 text-sm font-bold transition-all ${
                    tier.highlight
                      ? 'bg-white text-violet-700 hover:bg-gray-50'
                      : 'bg-violet-500 hover:bg-violet-600 text-white'
                  }`}
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-gray-400 text-[12px]">
            Contact our team at <ContactEmail className="font-semibold text-violet-600 hover:underline" /> or use our contact form: 
            <a href="/contact" className="text-violet-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">
            What CEPCs Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
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

      {/* ── Trust Strip ───────────────────────────────────────────────────── */}
      <section className="py-8 bg-white border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {[
              'Government-recognised credential',
              '60-hour online training',
              '3 exam attempts included',
              'Marketplace listing included',
              'Lifetime certification',
            ].map((badge) => (
              <span key={badge} className="flex items-center gap-2 text-gray-500 text-[12px] font-medium">
                <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#160b30] py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-400 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-violet-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-6">
            <Award className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
              Join 1,000+ Certified Consultants
            </span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-5 leading-tight">
            India&apos;s EPR Compliance Market<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
              Needs You. Get Certified.
            </span>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            100,000+ businesses need EPR compliance. Become the expert they hire. 60-hour training, all waste categories, government-recognised credential.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/become-a-cepc"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition-all"
            >
              Apply for CEPC Certification <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cepc/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Existing CEPC Sign In
            </Link>
          </div>

          <p className="mt-8 text-slate-500 text-[12px]">
            Contact our team: <ContactEmail className="font-semibold text-violet-300 hover:underline" />
          </p>
        </div>
      </section>
    </div>
  );
}



