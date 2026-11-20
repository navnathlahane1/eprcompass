'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Clock, Users, Award, ChevronRight, ChevronDown,
  Shield, Lock, BadgeCheck, Smartphone, Landmark, CreditCard,
  Star, TrendingUp, Target, Zap, BookOpen, GraduationCap,
} from 'lucide-react';
import { BADGE_STYLES } from '../data';

const GST_RATE = 18;

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function Accordion({ title, number, topics, isOpen, onToggle, accentBg, accentText }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition">
        <div className="flex items-center gap-3">
          <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white ${accentBg} shrink-0`}>{number}</span>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{topics.length} topics</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
          <ul className="space-y-1.5">
            {topics.map((t, j) => (
              <li key={j} className={`flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300`}>
                <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${accentText}`} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition">
        {q}
        <ChevronDown className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{a}</div>}
    </div>
  );
}

export default function CareerProgrammeLanding({ programme }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [openIdx, setOpenIdx] = useState(0);

  const s = BADGE_STYLES[programme.badgeColor];
  const gst = Math.round((programme.price * GST_RATE) / 100);
  const total = programme.price + gst;

  // Use moduleDetail if present (agency launch), else curriculum
  const modules = programme.moduleDetail || programme.curriculum;

  async function handleEnroll() {
    setPaying(true);
    setPayError('');
    try {
      if (typeof window === 'undefined' || typeof window.Razorpay !== 'function')
        throw new Error('Razorpay SDK failed to load. Please refresh and try again.');

      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: `career-${programme.id}`, couponCode: '' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to initialise payment');

      new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'EPR Compass',
        description: programme.shortTitle,
        order_id: data.orderId,
        image: '/imgs/epr-compass/epr-compass-platform.png',
        handler(response) {
          const p = new URLSearchParams({
            payment_id: response.razorpay_payment_id || '',
            order_id:   response.razorpay_order_id   || '',
            signature:  response.razorpay_signature  || '',
            course: `career-${programme.id}`,
          });
          router.push(`/thank-you?${p}`);
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#07875f' },
      }).open();
    } catch (err) {
      setPayError(err.message || 'Payment initialisation failed');
      setPaying(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="min-h-screen bg-white dark:bg-gray-900">

        {/* Breadcrumb */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-eco-green-4 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/trainings" className="hover:text-eco-green-4 transition">Trainings</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/trainings#career-programmes" className="hover:text-eco-green-4 transition">Career Programmes</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 dark:text-white font-medium">{programme.shortTitle}</span>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-eco-green-1/10 via-white to-eco-green-2/10 dark:from-eco-green-1/5 dark:via-gray-900 dark:to-eco-green-2/5 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Left */}
              <div>
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.badge} ${s.border}`}>
                    <span className="text-base">{programme.icon}</span>
                    {programme.badge}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{programme.level}</span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                  {programme.title}
                </h1>
                <p className={`text-lg font-semibold mb-3 ${s.text}`}>{programme.tagline}</p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{programme.description}</p>

                {/* Target audience */}
                <div className={`rounded-xl border ${s.border} ${s.light} p-4 mb-6`}>
                  <p className={`text-xs font-semibold ${s.text} uppercase tracking-wide mb-2`}>Designed for</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{programme.targetAudience}</p>
                  <ul className="space-y-1">
                    {programme.audienceProfiles.map((ap, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${s.bg} shrink-0`} />{ap}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { icon: <Clock className="w-4 h-4" />,    label: 'Duration',  value: programme.duration },
                    { icon: <BookOpen className="w-4 h-4" />, label: 'Sessions',  value: `${programme.sessions} live` },
                    { icon: <Users className="w-4 h-4" />,    label: 'Format',    value: programme.format },
                    { icon: <Award className="w-4 h-4" />,    label: 'Level',     value: programme.level },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col items-center text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                      <span className={`mb-1 ${s.text}`}>{m.icon}</span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{m.label}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Why now */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${s.text}`} /> Why Now?
                  </p>
                  <ul className="space-y-2">
                    {programme.whyNow.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className={`h-1.5 w-1.5 rounded-full ${s.bg} mt-1.5 shrink-0`} />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right — pricing card */}
              <div className={`rounded-2xl border-2 ${s.ring} bg-white dark:bg-gray-800 shadow-xl p-6 sticky top-24`}>
                <div className={`${s.bg} rounded-xl p-4 mb-5 text-white`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{programme.icon}</span>
                    <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">{programme.badge}</span>
                  </div>
                  <p className="text-xl font-bold leading-snug">{programme.shortTitle}</p>
                  <p className="text-white/80 text-sm mt-1">{programme.duration} · {programme.sessions} sessions</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{programme.priceLabel}</span>
                    <span className="text-sm text-gray-500">+ 18% GST</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-2">
                    <div className="flex justify-between"><span>Programme fee</span><span>{programme.priceLabel}</span></div>
                    <div className="flex justify-between"><span>GST (18%)</span><span>{formatINR(gst)}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                      <span>Total payable</span><span>{formatINR(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Outcomes as includes */}
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">What you'll achieve:</p>
                  <ul className="space-y-2">
                    {programme.outcomes.map((o, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300`}>
                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${s.text}`} />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>

                {payError && (
                  <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 text-sm text-red-700 dark:text-red-300">{payError}</div>
                )}

                <button onClick={handleEnroll} disabled={paying}
                  className={`w-full ${s.bg} disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition min-h-[52px] flex items-center justify-center gap-2`}>
                  {paying ? 'Opening Razorpay…' : `Enroll Now — ${formatINR(total)}`}
                </button>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-eco-green-4" /> UPI</span>
                  <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-eco-green-4" /> Cards</span>
                  <span className="flex items-center gap-1"><Landmark className="w-3 h-3 text-eco-green-4" /> EMI</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-eco-green-4" /> Secure Razorpay payment</p>
                  <p className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-eco-green-4" /> SSL encrypted checkout</p>
                  <p className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-eco-green-4" /> 7-day refund guarantee</p>
                </div>

                {/* Upsell paths */}
                {programme.upsells && programme.upsells.length > 0 && (
                  <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-400" /> Continue your journey
                    </p>
                    {programme.upsells.map((u, i) => (
                      <Link key={i} href={u.path}
                        className="block text-xs font-medium text-indigo-400 hover:text-indigo-300 transition py-0.5">
                        → {u.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Programme Curriculum</h2>
              <p className="text-gray-600 dark:text-gray-300">{modules.length} modules · {programme.sessions} live sessions · {programme.duration}</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
              {modules.map((mod, i) => (
                <Accordion
                  key={i}
                  number={i + 1}
                  title={mod.title}
                  topics={mod.topics}
                  isOpen={openIdx === i}
                  onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
                  accentBg={s.bg}
                  accentText={s.text}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {programme.testimonials && programme.testimonials.length > 0 && (
          <section className="py-16 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Success Stories</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {programme.testimonials.map((t, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-sm">"{t.text}"</p>
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${s.badge} border ${s.border}`}>
                      {t.name}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {programme.faqs && programme.faqs.length > 0 && (
          <section className="py-16 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {programme.faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
              </div>
            </div>
          </section>
        )}

        {/* Instructor */}
        <section className="py-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-20 h-20 rounded-full bg-eco-green-4 flex items-center justify-center shrink-0 text-2xl font-bold text-white shadow-lg">EC</div>
            <div>
              <p className="text-xs font-semibold text-eco-green-4 uppercase tracking-wide mb-1">Your Instructor</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">EPR Compass training team</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Founder of EPR Compass · India's leading EPR compliance educator · 5,000+ professionals trained across 50+ programmes.
                The EPR Compass team guides professionals through EPR career transitions and agency launches.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`py-16 ${s.bg}`}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">{programme.title}</h2>
            <p className="text-white/80 mb-8 text-lg">{programme.tagline}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleEnroll} disabled={paying}
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-100 transition flex items-center justify-center gap-2">
                Enroll Now — {formatINR(total)} <ChevronRight className="w-5 h-5" />
              </button>
              <Link href="/trainings#career-programmes"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition flex items-center justify-center">
                View All Career Programmes
              </Link>
            </div>
            <p className="mt-4 text-white/60 text-sm">5,000+ professionals trained · Powered by EPR Compass</p>
          </div>
        </section>
      </div>
    </>
  );
}

