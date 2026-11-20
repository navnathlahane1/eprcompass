'use client';

import {
  Award,
  BookOpen,
  BadgeCheck,
  IndianRupee,
  ClipboardList,
  Globe,
  ArrowRight,
  ShieldCheck,
  Users,
  TrendingUp,
  Leaf,
  Briefcase,
} from 'lucide-react';
import CEPCApplicationForm from '@/components/forms/CEPCApplicationForm';
import useScrollReveal from '@/components/useScrollReveal';

const WHY_CEPC = [
  { icon: Award, title: 'Government-Recognized Credential', desc: 'CEPC certification makes you eligible to sign EPR compliance reports and audits for CPCB/SPCB submissions.' },
  { icon: IndianRupee, title: 'High Earning Potential', desc: 'Certified consultants earn ₹50K–₹2L+ per month serving multiple clients across waste categories.' },
  { icon: TrendingUp, title: 'Growing Demand', desc: 'With 100,000+ businesses needing EPR compliance, the demand for certified consultants is surging.' },
  { icon: Globe, title: 'Work From Anywhere', desc: 'Most compliance work is digital — portal filings, audits, and consulting can be done remotely.' },
  { icon: BookOpen, title: 'Comprehensive Training', desc: 'Our program covers all six waste categories: Plastic, E-Waste, Battery, Tyre, Used Oil, and ELV.' },
  { icon: ShieldCheck, title: 'Ongoing Platform Access', desc: 'Use our SaaS platform to manage your clients — dashboards, filings, documents, certificates.' },
];

const CERTIFICATION_PATH = [
  { num: '01', title: 'Apply & Get Accepted', desc: 'Submit your application. We evaluate qualifications and experience within 3 business days.' },
  { num: '02', title: 'Complete Training', desc: '60-hour online training program covering PWM rules, EPR portal operations, compliance reporting, and auditing.' },
  { num: '03', title: 'Pass Assessment', desc: 'Complete the proctored assessment covering all waste categories and compliance procedures.' },
  { num: '04', title: 'Get Certified & Start Practicing', desc: 'Receive your CEPC credential, get listed on our platform, and start accepting client engagements.' },
];

const TIERS = [
  { name: 'CEPC Associate', clients: 'Up to 10 clients', fee: '₹15,000', features: ['Plastic Waste category', 'Basic dashboard', 'Email support'] },
  { name: 'CEPC Professional', clients: 'Up to 50 clients', fee: '₹35,000', features: ['All waste categories', 'Full dashboard', 'Priority support', 'Co-branding'], highlight: true },
  { name: 'CEPC Expert', clients: 'Unlimited clients', fee: '₹60,000', features: ['All waste categories', 'White-label portal', 'Dedicated manager', 'Revenue sharing'] },
];

function scrollToForm() {
  document.getElementById('cepc-form')?.scrollIntoView({ behavior: 'smooth' });
}

export default function BecomeACEPCClient() {
  useScrollReveal();

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 py-24 text-white">
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-5" />
        <div className="relative mx-auto max-w-5xl px-6 text-center" data-scroll-reveal>
          <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium backdrop-blur-sm">
            CEPC Certification Program
          </span>
          <h1 className="font-tricks text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Become a Certified EPR Professional Consultant
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
            Get certified. Build your practice. Help India&apos;s businesses achieve EPR compliance 
            while earning a lucrative income as a CEPC-certified consultant.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={scrollToForm}
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-600 shadow-lg transition hover:bg-gray-50"
            >
              Apply for Certification <ArrowRight size={18} />
            </button>
            <a
              href="#why-cepc"
              className="flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3.5 font-semibold transition hover:bg-white/10"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Why CEPC */}
      <section id="why-cepc" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Why Get CEPC Certified?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
              The CEPC credential positions you as a trusted authority in EPR compliance — and opens a growing revenue stream.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CEPC.map((item, i) => (
              <div key={i} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900" data-scroll-reveal>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                  <item.icon size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Path */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Certification Path
            </h2>
          </div>
          <div className="mt-14 space-y-8">
            {CERTIFICATION_PATH.map((step, i) => (
              <div key={i} className="flex gap-6" data-scroll-reveal>
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {step.num}
                  </span>
                  {i < CERTIFICATION_PATH.length - 1 && (
                    <div className="mt-2 h-full w-0.5 bg-indigo-200 dark:bg-indigo-800" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Certification Tiers
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-gray-600 dark:text-gray-400">
              Choose the level that fits your practice. Upgrade anytime as you grow.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TIERS.map((tier, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border p-7 transition ${
                  tier.highlight
                    ? 'border-indigo-500 bg-indigo-50 shadow-xl dark:border-indigo-400 dark:bg-indigo-950'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                }`}
                data-scroll-reveal
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tier.clients}</p>
                <p className="mt-4 font-tricks text-3xl font-bold text-gray-900 dark:text-white">
                  {tier.fee}
                  <span className="text-sm font-normal text-gray-500"> one-time</span>
                </p>
                <ul className="mt-6 space-y-2">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <BadgeCheck size={16} className="mt-0.5 shrink-0 text-eco-green-4" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToForm}
                  className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                    tier.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Numbers */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-6 text-center" data-scroll-reveal>
          {[
            { val: '200+', label: 'Certified Consultants' },
            { val: '5,000+', label: 'Clients Managed' },
            { val: '95%', label: 'Pass Rate' },
            { val: '₹50K–₹2L+', label: 'Monthly Earnings' },
          ].map((s, i) => (
            <div key={i} className="min-w-[120px]">
              <p className="font-tricks text-3xl font-bold text-indigo-600 dark:text-indigo-400">{s.val}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <section id="cepc-form" className="py-20">
        <div className="mx-auto max-w-2xl px-6" data-scroll-reveal>
          <h2 className="text-center font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Apply for CEPC Certification
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-gray-600 dark:text-gray-400">
            Submit your application and our certification team will review your profile within 3 business days.
          </p>
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <CEPCApplicationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
