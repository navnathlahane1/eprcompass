'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

const ENROLLMENT_DEADLINE = new Date('2026-07-15T23:59:59').getTime();
const pad = (n) => String(n).padStart(2, '0');

function useCountdown() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return { d: 0, h: 0, m: 0, s: 0 };
  const diff = Math.max(0, ENROLLMENT_DEADLINE - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}
import {
  ArrowRight, BadgeCheck, ChevronDown, Star, Clock, Users, TrendingUp, IndianRupee, Shield,
  Award, BookOpen, Briefcase, Building2, ClipboardList, Globe, Leaf, ShieldCheck,
} from 'lucide-react';

const ICON_MAP = {
  Award, BookOpen, Briefcase, Building2, ClipboardList, Globe, IndianRupee, Leaf,
  ShieldCheck, TrendingUp, Users, Shield, Star, Clock, BadgeCheck,
};
import CEPCApplicationForm from '@/components/forms/CEPCApplicationForm';
import useScrollReveal from '@/components/useScrollReveal';
import { moduleKeyToSlug } from '@/lib/whatsappCommunities';

// ─── Static shared data ──────────────────────────────────────────────────────

const STEPS = [
  { num: '01', title: 'Apply & Get Accepted', desc: 'Submit your application. We evaluate qualifications and experience within 3 business days.' },
  { num: '02', title: 'Complete 60-Hour Training', desc: 'Online program covering PWM rules, EPR portal operations, compliance reporting, and auditing across all waste categories.' },
  { num: '03', title: 'Pass the Assessment', desc: 'Complete the proctored assessment covering all waste categories and compliance procedures.' },
  { num: '04', title: 'Get Certified & Start Earning', desc: 'Receive your CEPC credential, get listed on our platform, and start accepting client engagements.' },
];

const TIERS = [
  {
    name: 'CEPC Associate',
    clients: 'Up to 10 clients',
    fee: '₹15,000',
    productId: 'cepc-associate',
    features: ['Plastic Waste category', 'Basic dashboard', 'Email support', 'CEPC certificate'],
  },
  {
    name: 'CEPC Professional',
    clients: 'Up to 50 clients',
    fee: '₹35,000',
    productId: 'cepc-professional',
    highlight: true,
    features: ['All 6 waste categories', 'Full dashboard', 'Priority support', 'Co-branding', 'CEPC certificate'],
  },
  {
    name: 'CEPC Expert',
    clients: 'Unlimited clients',
    fee: '₹60,000',
    productId: 'cepc-expert',
    features: ['All 6 waste categories', 'White-label portal', 'Dedicated manager', 'Revenue sharing', 'CEPC certificate'],
  },
];

const TRUST_STATS = [
  { val: '200+', label: 'Certified Consultants' },
  { val: '5,000+', label: 'Clients Managed' },
  { val: '95%', label: 'Pass Rate' },
  { val: '₹50K–₹2L+', label: 'Monthly Earnings' },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Mehta',
    role: 'EHS Consultant, Mumbai',
    text: 'Getting CEPC certified was the best decision I made. My existing factory clients were already waiting for this service — I closed 3 new EPR compliance engagements in the first month.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'CA Firm Partner, Delhi',
    text: 'Our firm added EPR advisory to our service portfolio after CEPC certification. The training was comprehensive and the platform makes client management seamless.',
    rating: 5,
  },
  {
    name: 'Arun Nair',
    role: 'Environmental Consultant, Pune',
    text: 'The 60-hour training covered everything I needed to confidently serve clients across all waste categories. The CEPC credential has opened doors I didn\'t expect.',
    rating: 5,
  },
];

const WASTE_CATEGORIES = ['Plastic Waste', 'E-Waste', 'Battery Waste', 'Tyre Waste', 'Used Oil', 'End of Life Vehicles'];

// ─── FAQ Accordion ───────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown size={18} className={`shrink-0 ml-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{a}</p>}
    </div>
  );
}

// ─── Sticky CTA bar ──────────────────────────────────────────────────────────

function StickyCTA({ ctaLabel }) {
  function scrollToForm() {
    document.getElementById('cepc-form')?.scrollIntoView({ behavior: 'smooth' });
  }
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 px-6 py-3 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-950/95 sm:hidden">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Limited seats this quarter</p>
      <button
        onClick={scrollToForm}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        {ctaLabel}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CepcLandingClient({
  moduleKey,
  audienceSegment,
  icpLabel,
  heroHeadline,
  heroSub,
  whySectionTitle,
  whySectionSub,
  whyItems,
  formHeading,
  formSub,
  ctaLabel = 'Apply for Certification',
  faqs,
  heroAccent,
}) {
  useScrollReveal();
  const { d, h, m, s } = useCountdown();
  const router = useRouter();
  const [payingId, setPayingId]       = useState(null);
  const [payError, setPayError]       = useState('');
  const [pendingTier, setPendingTier] = useState(null);
  const [custName, setCustName]       = useState('');
  const [custEmail, setCustEmail]     = useState('');
  const [custPhone, setCustPhone]     = useState('');
  const [modalErr, setModalErr]       = useState('');

  function openTierModal(tier) {
    setPendingTier(tier);
    setModalErr('');
  }

  function closeTierModal() {
    setPendingTier(null);
    setModalErr('');
    setPayingId(null);
  }

  async function handleTierPayment() {
    const tier = pendingTier;
    if (!tier) return;

    const name  = custName.trim();
    const email = custEmail.trim();
    const phone = custPhone.trim();

    if (!name || !email || !phone) { setModalErr('Please fill in all fields.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setModalErr('Please enter a valid email address.'); return; }
    if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ''))) { setModalErr('Please enter a valid phone number.'); return; }

    if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
      setModalErr('Razorpay SDK failed to load. Please refresh and try again.');
      return;
    }

    setPayingId(tier.productId);
    setModalErr('');
    try {
      const res = await fetch('/api/payment/cepc-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: tier.productId, name, email, phone, sourcePage: moduleKey || tier.productId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to initialise payment');

      setPendingTier(null);

      new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'EPR Compass',
        description: data.planName,
        order_id: data.orderId,
        image: '/imgs/epr-compass/epr-compass-platform.png',
        prefill: { name, email, contact: phone },
        async handler(response) {
          try {
            const verify = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            }).then(r => r.json());

            if (!verify.success) throw new Error(verify.message || 'Payment verification failed');

            const p = new URLSearchParams({
              payment_id: response.razorpay_payment_id || '',
              order_id:   response.razorpay_order_id   || '',
              course:     tier.productId,
              page:       moduleKeyToSlug(moduleKey) || '',
            });
            router.push(`/thank-you?${p}`);
          } catch (err) {
            setPayError(err.message || 'Payment verification failed. Please contact support.');
            setPayingId(null);
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
        theme: { color: '#4f46e5' },
      }).open();
    } catch (err) {
      setModalErr(err.message || 'Payment initialisation failed');
      setPayingId(null);
    }
  }

  function scrollToForm() {
    document.getElementById('cepc-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* ── COUNTDOWN BAR ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-indigo-300 font-bold uppercase tracking-wider text-[11px]">Limited Enrollment</span>
            <span className="hidden sm:inline text-white/80">Enrollment closes in</span>
          </div>
          <div className="flex items-center gap-2">
            {[['Days', d], ['Hrs', h], ['Min', m], ['Sec', s]].map(([l, v]) => (
              <div key={l} className="text-center">
                <div className="bg-white/10 rounded-md px-2 py-1 font-mono font-bold text-base min-w-[40px]">{pad(v)}</div>
                <div className="text-[9px] text-white/60 mt-0.5">{l}</div>
              </div>
            ))}
            <button onClick={scrollToForm} className="ml-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-bold transition">Apply Now →</button>
          </div>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 py-24 text-white">
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-5" />
        <div className="relative mx-auto max-w-5xl px-6 pt-8 text-center" data-scroll-reveal>
          <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium backdrop-blur-sm">
            {icpLabel}
          </span>
          <h1 className="font-tricks text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {heroHeadline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 leading-relaxed">
            {heroSub}
          </p>

          {/* Waste category tags */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {WASTE_CATEGORIES.map((cat) => (
              <span key={cat} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {cat}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={scrollToForm}
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-600 shadow-lg transition hover:bg-gray-50"
            >
              {ctaLabel} <ArrowRight size={18} />
            </button>
            <a
              href="#why-join"
              className="flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3.5 font-semibold transition hover:bg-white/10"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50 py-10 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-6 text-center">
          {TRUST_STATS.map((s, i) => (
            <div key={i} className="min-w-[110px]">
              <p className="font-tricks text-3xl font-bold text-indigo-600 dark:text-indigo-400">{s.val}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY JOIN ─────────────────────────────────────────────────────── */}
      <section id="why-join" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              {whySectionTitle}
            </h2>
            {whySectionSub && (
              <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-400">{whySectionSub}</p>
            )}
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item, i) => {
              const Icon = typeof item.icon === 'string' ? ICON_MAP[item.icon] : item.icon;
              return (
              <div
                key={i}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900"
                data-scroll-reveal
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                  {Icon && <Icon size={24} className="text-indigo-600 dark:text-indigo-400" />}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / TESTIMONIALS ──────────────────────────────────── */}
      <section className="bg-indigo-50 py-20 dark:bg-indigo-950/20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              What Certified Consultants Say
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm dark:border-indigo-900 dark:bg-gray-900"
                data-scroll-reveal
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CERTIFICATION PATH ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Your Path to Certification
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-gray-600 dark:text-gray-400">
              From application to earning — most consultants get their first client within 30 days of certification.
            </p>
          </div>
          <div className="mt-14 space-y-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6" data-scroll-reveal>
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {step.num}
                  </span>
                  {i < STEPS.length - 1 && (
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

      {/* ── PRICING TIERS ────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
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
                  onClick={() => openTierModal(tier)}
                  disabled={payingId === tier.productId}
                  className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                    tier.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {payingId === tier.productId ? 'Opening payment…' : `Get Started — ${tier.fee}`}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
            All tiers include CEPC certificate, platform access, and compliance training. No hidden fees.
          </p>
          {payError && (
            <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{payError}</p>
          )}

        </div>
      </section>

      {/* ── VALUE PROPOSITION BANNER ─────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 sm:grid-cols-3 text-center" data-scroll-reveal>
            {[
              { icon: Shield, title: 'Government-Recognized', desc: 'CEPC is recognized for signing EPR compliance reports submitted to CPCB/SPCB.' },
              { icon: IndianRupee, title: '₹50K–₹2L/month', desc: 'Certified consultants earn across multiple clients simultaneously.' },
              { icon: TrendingUp, title: '100,000+ Businesses', desc: 'Need EPR compliance in India. The market is massive and growing every year.' },
            ].map((v, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <v.icon size={28} className="mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
                <p className="font-semibold text-gray-900 dark:text-white">{v.title}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ (AEO) ────────────────────────────────────────────────────── */}
      {faqs?.length > 0 && (
        <section className="bg-gray-50 py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center mb-12" data-scroll-reveal>
              <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>
            <div data-scroll-reveal>
              {faqs.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── APPLICATION FORM ─────────────────────────────────────────────── */}
      <section id="cepc-form" className="py-20">
        <div className="mx-auto max-w-2xl px-6" data-scroll-reveal>
          <h2 className="text-center font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {formHeading || 'Apply for CEPC Certification'}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-gray-600 dark:text-gray-400">
            {formSub || 'Submit your application and our certification team will review your profile within 3 business days.'}
          </p>

          {/* Trust signals near form */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {['3-Day Review Guarantee', 'No commitment required', '95% Pass Rate', 'CPCB-recognized credential'].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <BadgeCheck size={12} className="text-eco-green-4" /> {t}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <CEPCApplicationForm moduleKey={moduleKey} audienceSegment={audienceSegment} />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center" data-scroll-reveal>
          <h2 className="font-tricks text-3xl font-bold sm:text-4xl">
            India's EPR Compliance Market Is Growing Fast.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            Every month you wait is a month another consultant takes the clients in your network. Certify now.
          </p>
          <button
            onClick={scrollToForm}
            className="mt-8 flex items-center gap-2 rounded-xl bg-white px-10 py-4 font-semibold text-indigo-600 shadow-lg transition hover:bg-gray-50 mx-auto"
          >
            {ctaLabel} <ArrowRight size={18} />
          </button>
          <p className="mt-4 text-sm text-white/60">Limited seats available this quarter.</p>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <StickyCTA ctaLabel={ctaLabel} />

      {/* ── CUSTOMER DETAILS MODAL ───────────────────────────────────────── */}
      {pendingTier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeTierModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">CEPC Certification</p>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{pendingTier.name} — {pendingTier.fee}</h2>
              </div>
              <button onClick={closeTierModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition ml-4">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your details to continue to payment.</p>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {modalErr && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{modalErr}</p>
              )}
              <button
                onClick={handleTierPayment}
                disabled={!!payingId}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 text-sm transition"
              >
                {payingId ? 'Opening Razorpay…' : `Pay ${pendingTier.fee}`}
              </button>
              <p className="text-center text-xs text-gray-400">Secured by Razorpay · SSL encrypted</p>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            <a href="/terms-and-conditions" className="hover:text-white transition">Terms &amp; Conditions</a>
            <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
            <a href="/refund-cancellation-policy" className="hover:text-white transition">Refund &amp; Cancellation Policy</a>
            <a href="/shipping-delivery-policy" className="hover:text-white transition">Shipping &amp; Delivery Policy</a>
            <a href="/results-earnings-disclaimer" className="hover:text-white transition">Results / Earnings Disclaimer</a>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div><span className="font-semibold text-white/90">EPR Compass</span> &copy; 2026 Neubrain Solutions Pvt. Ltd. All rights reserved.</div>
            <div className="text-white/50">Transparent policies for payment gateway and learner trust.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}

