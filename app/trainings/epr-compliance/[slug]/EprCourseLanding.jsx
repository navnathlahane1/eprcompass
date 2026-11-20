'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Clock, Users, Award, ChevronRight, ChevronDown,
  Shield, Lock, BadgeCheck, Smartphone, Landmark, CreditCard,
  BookOpen, Star, GraduationCap, FileText, Zap,
} from 'lucide-react';
import { EPR_TESTIMONIALS, EPR_FAQS, EPR_COURSE_TYPES, buildEprSlug } from '../data';

const GST_RATE = 18;

const TYPE_STYLE = {
  Workshop:      { headerBg: 'bg-eco-green-4',   ring: 'ring-eco-green-4',  light: 'bg-eco-green-4/10', text: 'text-eco-green-4',  dot: 'bg-eco-green-4',   badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  Certification: { headerBg: 'bg-amber-500',      ring: 'ring-amber-500',    light: 'bg-amber-50',       text: 'text-amber-600',    dot: 'bg-amber-500',     badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  Mastery:       { headerBg: 'bg-violet-600',     ring: 'ring-violet-500',   light: 'bg-violet-50',      text: 'text-violet-600',   dot: 'bg-violet-600',    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
};

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
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

export default function EprCourseLanding({ slug, category, courseType, curriculum }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [openIdx, setOpenIdx] = useState(0);

  const s = TYPE_STYLE[courseType.type];
  const gst = Math.round((courseType.price * GST_RATE) / 100);
  const total = courseType.price + gst;
  const otherTypes = EPR_COURSE_TYPES.filter(t => t.type !== courseType.type);

  async function handleEnroll() {
    if (courseType.price === 0) {
      router.push(`/academy/enrollment?program=${slug}`);
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      if (typeof window === 'undefined' || typeof window.Razorpay !== 'function')
        throw new Error('Razorpay SDK failed to load. Please refresh and try again.');

      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: slug, couponCode: '' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to initialise payment');

      new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'EPR Compass',
        description: `${category.label} — ${courseType.type}`,
        order_id: data.orderId,
        image: '/imgs/epr-compass/epr-compass-platform.png',
        handler(response) {
          const p = new URLSearchParams({
            payment_id: response.razorpay_payment_id || '',
            order_id:   response.razorpay_order_id   || '',
            signature:  response.razorpay_signature  || '',
            course: slug,
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
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <Link href="/" className="hover:text-eco-green-4 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/trainings" className="hover:text-eco-green-4 transition">Trainings</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/trainings#epr-compliance-courses" className="hover:text-eco-green-4 transition">EPR Compliance Courses</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 dark:text-white font-medium">{category.label} — {courseType.type}</span>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-eco-green-1/10 via-white to-eco-green-2/10 dark:from-eco-green-1/5 dark:via-gray-900 dark:to-eco-green-2/5 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Left */}
              <div>
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {courseType.badge}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{courseType.level}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{category.icon} {category.wasteType}</span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                  {category.label}
                  <span className={`block ${s.text}`}>{courseType.type} Course</span>
                </h1>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">{courseType.tagline}</p>
                <p className="text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">{courseType.description}</p>

                {/* Who it's for */}
                <div className="rounded-xl border border-eco-green-4/30 bg-eco-green-4/5 p-4 mb-6">
                  <p className="text-xs font-semibold text-eco-green-4 uppercase tracking-wide mb-1">Who this is for</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{category.who}</p>
                </div>

                {/* Applicable regulation */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-6 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Applicable Regulation</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{category.regulation}</p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <Clock className="w-4 h-4" />, label: 'Duration',  value: courseType.duration },
                    { icon: <BookOpen className="w-4 h-4" />, label: 'Sessions', value: `${courseType.sessions} live` },
                    { icon: <Users className="w-4 h-4" />, label: 'Format',    value: courseType.format },
                    { icon: <Award className="w-4 h-4" />, label: 'Level',     value: courseType.level },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col items-center text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                      <span className={`mb-1 ${s.text}`}>{m.icon}</span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{m.label}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — pricing card */}
              <div className={`rounded-2xl border-2 ${s.ring} bg-white dark:bg-gray-800 shadow-xl p-6 sticky top-24`}>
                <div className={`${s.headerBg} rounded-xl p-4 mb-5 text-white`}>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-1">{category.label}</p>
                  <p className="text-2xl font-bold">{courseType.type} Course</p>
                  <p className="text-white/80 text-sm mt-1">{courseType.tagline}</p>
                </div>

                {/* Pricing */}
                {courseType.price > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{courseType.priceLabel}</span>
                      <span className="text-sm text-gray-500">+ 18% GST</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-2">
                      <div className="flex justify-between"><span>Course fee</span><span>{courseType.priceLabel}</span></div>
                      <div className="flex justify-between"><span>GST (18%)</span><span>{formatINR(gst)}</span></div>
                      <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                        <span>Total payable</span><span>{formatINR(total)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-eco-green-4">Free</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No payment — register & attend live</p>
                  </div>
                )}

                {/* Includes */}
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">What's included:</p>
                  <ul className="space-y-2">
                    {courseType.includes.map((item, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300`}>
                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${s.text}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {payError && (
                  <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 text-sm text-red-700 dark:text-red-300">{payError}</div>
                )}

                <button onClick={handleEnroll} disabled={paying}
                  className={`w-full ${s.headerBg} disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition min-h-[52px] flex items-center justify-center gap-2`}>
                  {paying ? 'Opening Razorpay…' : courseType.price === 0 ? 'Register Free →' : `Enroll Now — ${formatINR(total)}`}
                </button>

                {courseType.price > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-eco-green-4" /> UPI</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-eco-green-4" /> Cards</span>
                    <span className="flex items-center gap-1"><Landmark className="w-3 h-3 text-eco-green-4" /> EMI</span>
                  </div>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-eco-green-4" /> Secure Razorpay payment</p>
                  <p className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-eco-green-4" /> SSL encrypted checkout</p>
                  <p className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-eco-green-4" /> Verified business account</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum */}
        {curriculum && (
          <section className="py-16 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Course Curriculum</h2>
                <p className="text-gray-600 dark:text-gray-300">{curriculum.modules.length} modules · {courseType.sessions} live sessions · {courseType.duration}</p>
              </div>
              <div className="max-w-3xl mx-auto space-y-3">
                {curriculum.modules.map((mod, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white ${s.headerBg} shrink-0`}>{i + 1}</span>
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{mod.topics.length} topics</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {openIdx === i && (
                      <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                        <ul className="space-y-1.5">
                          {mod.topics.map((t, j) => (
                            <li key={j} className={`flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300`}>
                              <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${s.text}`} />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Audience */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Who Is This Course For?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {courseType.audience.map((item, i) => {
                const icons = [<Zap className="w-6 h-6" />, <FileText className="w-6 h-6" />, <GraduationCap className="w-6 h-6" />];
                return (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-3">
                    <div className={`${s.light} ${s.text} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>{icons[i % 3]}</div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">What Our Learners Say</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {EPR_TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">"{t.text}"</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {EPR_FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
            </div>
          </div>
        </section>

        {/* Cross-sell: other levels for same category */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Your {category.shortLabel} EPR Journey</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">All three levels for {category.label}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {EPR_COURSE_TYPES.map(ct => {
                const isCurrent = ct.type === courseType.type;
                const cs = TYPE_STYLE[ct.type];
                return (
                  <div key={ct.type} className={`rounded-xl border-2 p-4 text-center bg-white dark:bg-gray-900 ${isCurrent ? `${cs.ring} shadow-lg` : 'border-gray-200 dark:border-gray-700'}`}>
                    {isCurrent && <span className="inline-block mb-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-eco-green-4 text-white">Current</span>}
                    <div className={`text-sm font-bold mb-1 ${cs.text}`}>{ct.type}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{ct.level} · {ct.duration}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{ct.priceLabel}</div>
                    {isCurrent
                      ? <span className="block text-xs text-gray-400 py-2">You're here</span>
                      : <Link href={`/trainings/epr-compliance/${buildEprSlug(category.id, ct.type)}`}
                          className={`block w-full text-xs font-semibold py-2 px-3 rounded-lg border-2 ${cs.ring} ${cs.text} hover:${cs.headerBg} hover:text-white transition`}>
                          View {ct.type} →
                        </Link>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`py-16 ${s.headerBg}`}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">
              {courseType.price === 0 ? 'Join the Free Workshop Today' : `Enroll in the ${courseType.type} Course`}
            </h2>
            <p className="text-white/80 mb-8 text-lg">EPR compliance training from the EPR Compass team</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleEnroll} disabled={paying}
                className="bg-white text-eco-green-4 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition flex items-center justify-center gap-2">
                {courseType.price === 0 ? 'Register Free' : `Enroll — ${formatINR(total)}`}
                <ChevronRight className="w-5 h-5" />
              </button>
              <Link href="/trainings#epr-compliance-courses"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition flex items-center justify-center">
                Browse All EPR Courses
              </Link>
            </div>
            <p className="mt-4 text-white/60 text-sm">5,000+ professionals trained · EPR Compass</p>
          </div>
        </section>

      </div>
    </>
  );
}

