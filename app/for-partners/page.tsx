import Link from 'next/link';
import ContactEmail from '@/components/public-site/ContactEmail';
import type { Metadata } from 'next';
import {
  CheckCircle, ArrowRight, IndianRupee, Users, GraduationCap,
  ShieldCheck, BarChart3, Headphones, Building2, Globe, TrendingUp,
  FileText, Handshake, Star, Briefcase, CalendarClock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Become an EPR Compliance Partner | Earn 15–30% Recurring Commission',
  description:
    'Join EPR Compass\'s partner program. Earn 15–30% recurring commissions referring businesses for EPR registration & compliance. Free training, co-branded collateral, real-time dashboard.',
  keywords: 'EPR partner program India, EPR compliance referral, EPR commission partner, CA firm EPR, environmental consultant EPR partnership',
  alternates: { canonical: '/for-partners' },
  openGraph: {
    title: 'Become an EPR Compliance Partner | EPR Compass',
    description: 'Earn recurring commissions. Free training. Full dashboard. Join 500+ active partners in India\'s largest EPR compliance network.',
    url: '/for-partners',
    type: 'website',
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const WHO_CAN_PARTNER = [
  { icon: Building2, title: 'CA / CS Firms', desc: 'Extend your compliance portfolio. Refer existing corporate clients to EPR registration and earn recurring commissions on every renewal.' },
  { icon: ShieldCheck, title: 'Environmental Consultants', desc: 'Add certified EPR compliance to your sustainability practice. We handle execution — you earn the referral commission.' },
  { icon: Globe, title: 'Industry Associations', desc: 'Offer EPR compliance as a member benefit. Bulk pricing and dedicated onboarding for associations and trade bodies.' },
  { icon: TrendingUp, title: 'Individual Consultants', desc: 'Build an independent EPR consulting income stream. Full platform, training, and marketing support included.' },
];

const PORTAL_FEATURES = [
  { icon: BarChart3, title: 'Real-Time Commission Dashboard', desc: 'Track every referral, pending payment, and historical commission payout — live, from your partner portal.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Users, title: 'Client Management', desc: 'Full visibility into each referred client\'s compliance status, filing deadlines, and certificate progress.', color: 'bg-blue-50 text-blue-600' },
  { icon: FileText, title: 'Leads Pipeline', desc: 'Log and track prospective clients. Set follow-up reminders and watch them move from lead to active client.', color: 'bg-purple-50 text-purple-600' },
  { icon: Headphones, title: 'Dedicated Partner Manager', desc: 'Every partner gets a named manager for support, escalations, and strategic guidance on growing your book.', color: 'bg-violet-50 text-violet-600' },
  { icon: GraduationCap, title: 'Free CEPC-Level Training', desc: 'Access our 60-hour EPR training library at no cost. Become a credible EPR expert for your clients.', color: 'bg-green-50 text-green-600' },
  { icon: Handshake, title: 'Co-Branded Collateral', desc: 'Pitch decks, brochures, proposal templates and email scripts — all branded with your firm\'s identity.', color: 'bg-amber-50 text-amber-600' },
  { icon: CalendarClock, title: 'Compliance Calendar', desc: 'Never miss a client deadline. Your portal surfaces all upcoming filing windows and renewal dates.', color: 'bg-red-50 text-red-600' },
  { icon: Briefcase, title: 'Referral Link & Tracking', desc: 'Share your unique referral link. Every click, signup and conversion is tracked and attributed automatically.', color: 'bg-teal-50 text-teal-600' },
];

const COMMISSION_TIERS = [
  { tier: 'Silver', range: '1 – 10 clients', pct: '15%', highlight: false },
  { tier: 'Gold',   range: '11 – 50 clients', pct: '22%', highlight: true },
  { tier: 'Platinum', range: '50+ clients',  pct: '30%', highlight: false },
];

const STEPS = [
  { num: '01', title: 'Apply in 5 Minutes', desc: 'Fill a short application form. We review within 2 business days and email your welcome kit.' },
  { num: '02', title: 'Complete Onboarding', desc: 'One 2-hour online orientation — platform walkthrough, commission mechanics, and your first referral tools.' },
  { num: '03', title: 'Refer & Earn Monthly', desc: 'Share your link, track referrals on your dashboard, and receive commissions every month — automatically.' },
];

const TESTIMONIALS = [
  {
    quote: 'We added EPR compliance as a service line in 3 days. The commission dashboard is transparent — every client, every rupee. Best partner programme we\'ve joined.',
    name: 'CA Firm Principal',
    role: 'Chartered Accountant, Mumbai',
  },
  {
    quote: 'I refer 4–6 EPR clients a month alongside my sustainability consulting work. The co-branded collateral and training library made me credible from day one.',
    name: 'Environmental Consultant',
    role: 'Independent Consultant, Bengaluru',
  },
];

const STATS = [
  { value: '500+', label: 'Active Partners' },
  { value: '₹2Cr+', label: 'Commissions Paid' },
  { value: '30%', label: 'Max Commission Rate' },
  { value: '98%', label: 'Partner Retention' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForPartnersPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0e0a2e] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[320px] h-[320px] bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-400 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-6">
                <Handshake className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  Partner Programme
                </span>
              </div>

              <h1 className="text-4xl lg:text-[3rem] font-extrabold text-white leading-tight tracking-tight mb-5">
                Earn Recurring Income<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">
                  Helping Businesses Comply.
                </span>
              </h1>

              <p className="text-slate-300 text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
                Refer businesses to India&apos;s leading EPR compliance platform and earn 15–30% recurring commissions — on every renewal, every year. No cap. No upfront cost.
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  '15–30% recurring commissions — paid monthly, no cap on earnings',
                  'Free CEPC-level EPR training library (₹35,000 value included)',
                  'Co-branded pitch decks, brochures, and email templates',
                  'Real-time commission dashboard with full client visibility',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-slate-300 text-[13.5px]">
                    <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/become-a-partner"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-all"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/partner/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  Partner Sign In
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
                No upfront cost · Free onboarding · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who Can Partner ───────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">Who Can Partner?</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Any professional or firm that works with businesses that could have EPR obligations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHO_CAN_PARTNER.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{t.title}</h3>
                  <p className="text-gray-500 text-[12.5px] leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Commission Structure ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Your Commission Structure</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Commissions are <strong>recurring</strong> — earned every year the client renews. The more you grow, the more you earn.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tier</th>
                  <th className="px-6 py-4 font-semibold">Clients Referred</th>
                  <th className="px-6 py-4 font-semibold">Your Commission</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMMISSION_TIERS.map((row) => (
                  <tr key={row.tier} className={row.highlight ? 'bg-indigo-50' : 'bg-white'}>
                    <td className={`px-6 py-4 font-bold ${row.highlight ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {row.tier}
                      {row.highlight && <span className="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">Most Common</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{row.range}</td>
                    <td className={`px-6 py-4 text-lg font-extrabold ${row.highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {row.pct}
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">Monthly</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-gray-400 text-[12px]">
            Commissions recur annually for the lifetime of the client relationship. No clawbacks.
          </p>
        </div>
      </section>

      {/* ── Portal Features ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <Handshake className="w-3.5 h-3.5" /> Partner Portal Features
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Everything to Manage Your Partner Business
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              Your partner portal comes with eight built-in modules so you can track, manage, and grow with no external tools needed.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PORTAL_FEATURES.map((f) => {
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

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">How It Works</h2>
            <p className="text-indigo-100/80 text-sm">
              From application to first commission — as fast as one week.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="bg-white/[0.1] backdrop-blur-sm border border-white/[0.15] rounded-2xl p-7">
                <div className="text-5xl font-black text-white/20 mb-3 leading-none">{step.num}</div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-indigo-100/80 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/become-a-partner"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 hover:bg-gray-50 px-8 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">
            What Partners Say
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

      {/* ── Trust Strip ───────────────────────────────────────────────────── */}
      <section className="py-8 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {[
              'No upfront cost to join',
              'Commission paid monthly',
              'Free training included',
              'Co-branded collateral provided',
              'Dedicated partner manager',
            ].map((badge) => (
              <span key={badge} className="flex items-center gap-2 text-gray-500 text-[12px] font-medium">
                <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0e0a2e] py-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-400 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-indigo-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-6">
            <IndianRupee className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-[11px] font-semibold tracking-[0.15em] uppercase">
              Start Earning Today
            </span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-5 leading-tight">
            Join India&apos;s Largest<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">
              EPR Partner Network
            </span>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            500+ partners are already earning monthly commissions. Free training, co-branded collateral, and a full dashboard — apply in 5 minutes.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/become-a-partner"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-all"
            >
              Apply for Partnership <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/partner/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Existing Partner Sign In
            </Link>
          </div>

          <p className="mt-8 text-slate-500 text-[12px]">
            Contact our team: <ContactEmail className="font-semibold text-indigo-400 hover:underline" />
          </p>
        </div>
      </section>
    </div>
  );
}



