'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Clock, Users, Award, ChevronRight, ChevronDown,
  Shield, Lock, BadgeCheck, Smartphone, Landmark, CreditCard,
  BookOpen, Star, GraduationCap, Zap,
} from 'lucide-react';
import { TESTIMONIALS, COMMON_FAQS, COURSE_TYPES, buildSlug } from '../data';

const GST_RATE = 18;

const TYPE_COLOR = {
  Workshop:      { ring: 'ring-eco-green-4',  bg: 'bg-eco-green-4',   light: 'bg-eco-green-4/10', text: 'text-eco-green-4',  dark: 'bg-eco-green-5',   badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  Certification: { ring: 'ring-amber-500',    bg: 'bg-amber-500',     light: 'bg-amber-50',        text: 'text-amber-600',    dark: 'bg-amber-600',      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  Mastery:       { ring: 'ring-violet-500',   bg: 'bg-violet-600',    light: 'bg-violet-50',       text: 'text-violet-600',   dark: 'bg-violet-700',     badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
};

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
        {q}
        <ChevronDown className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{a}</div>}
    </div>
  );
}

export default function RecyclerCourseLanding({ slug, category, courseType, curriculum }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [openModuleIdx, setOpenModuleIdx] = useState(0);

  const colors = TYPE_COLOR[courseType.type];
  const gstAmount = Math.round((courseType.price * GST_RATE) / 100);
  const totalAmount = courseType.price + gstAmount;

  // Other course types for this category (cross-sell)
  const otherTypes = COURSE_TYPES.filter(t => t.type !== courseType.type);

  async function handlePayNow() {
    if (courseType.price === 0) {
      // Free workshop — go directly to registration form / academy
      router.push(`/academy/enrollment?program=${slug}`);
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
        throw new Error('Razorpay SDK failed to load. Please refresh and try again.');
      }
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: slug, couponCode: '' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to initialise payment');
      const rz = new window.Razorpay({
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
            course:     slug,
          });
          router.push(`/thank-you?${p}`);
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#07875f' },
        prefill: {},
      });
      rz.open();
    } catch (err) {
      setPayError(err.message || 'Payment initialisation failed');
      setPaying(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="min-h-screen bg-white dark:bg-gray-900">

        {/* ── Breadcrumb ── */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <Link href="/" className="hover:text-eco-green-4 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/trainings" className="hover:text-eco-green-4 transition">Trainings</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/trainings#recycler-courses" className="hover:text-eco-green-4 transition">Recycler Courses</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 dark:text-white font-medium">{category.label} — {courseType.type}</span>
          </div>
        </div>

        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-eco-green-1/10 via-white to-eco-green-2/10 dark:from-eco-green-1/5 dark:via-gray-900 dark:to-eco-green-2/5 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Left — course info */}
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${colors.bg}`} /> {courseType.badge}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {courseType.level}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {category.wasteType}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {category.label}
                  <span className={`block ${colors.text}`}>{courseType.type} Course</span>
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2 font-medium">{courseType.tagline}</p>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{courseType.description}</p>

                {/* Covers Launch → Run → Scale */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { label: 'Launch', desc: 'Start your business', icon: '🚀' },
                    { label: 'Run',    desc: 'Operate & comply',    icon: '⚙️' },
                    { label: 'Scale',  desc: 'Grow & expand',       icon: '📈' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 bg-eco-green-4/10 dark:bg-eco-green-4/10 rounded-lg px-3 py-2 border border-eco-green-4/30">
                      <span>{s.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-eco-green-4">{s.label}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <Clock className="w-4 h-4" />, label: 'Duration',  value: courseType.duration },
                    { icon: <BookOpen className="w-4 h-4" />, label: 'Sessions', value: `${courseType.sessions} sessions` },
                    { icon: <Users className="w-4 h-4" />, label: 'Format',    value: courseType.format },
                    { icon: <Award className="w-4 h-4" />, label: 'Level',     value: courseType.level },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col items-center text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                      <span className={`mb-1 ${colors.text}`}>{m.icon}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — pricing card */}
              <div className={`rounded-2xl border-2 ${colors.ring} bg-white dark:bg-gray-800 shadow-xl p-6 sticky top-24`}>
                <div className={`${colors.bg} rounded-xl p-4 mb-5 text-white`}>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-1">{category.label}</p>
                  <p className="text-2xl font-bold">{courseType.type} Course</p>
                  <p className="text-white/80 text-sm mt-1">{courseType.tagline}</p>
                </div>

                {courseType.price > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{courseType.priceLabel}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">+ 18% GST</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between"><span>Course fee</span><span>{courseType.priceLabel}</span></div>
                      <div className="flex justify-between"><span>GST (18%)</span><span>{formatINR(gstAmount)}</span></div>
                      <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                        <span>Total payable</span><span>{formatINR(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-eco-green-4">Free</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No payment required — register & attend</p>
                  </div>
                )}

                {/* What's included */}
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">What's included:</p>
                  <ul className="space-y-1.5">
                    {courseType.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${colors.text}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {payError && (
                  <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 text-sm text-red-700 dark:text-red-300">
                    {payError}
                  </div>
                )}

                <button
                  onClick={handlePayNow}
                  disabled={paying}
                  className={`w-full ${colors.bg} hover:${colors.dark} disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition flex items-center justify-center gap-2 min-h-[52px]`}
                >
                  {paying ? 'Opening Razorpay…' : courseType.price === 0 ? 'Register Free →' : `Enroll Now — ${formatINR(totalAmount)}`}
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

                {/* Regulation note */}
                <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Applicable regulation: </span>
                  {category.regulation}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Curriculum ── */}
        {curriculum && (
          <section className="py-16 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Course Curriculum</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {curriculum.modules.length} modules covering <strong>Launch</strong>, <strong>Run</strong> and <strong>Scale</strong> stages
                </p>
              </div>
              <div className="max-w-3xl mx-auto space-y-3">
                {curriculum.modules.map((mod, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => setOpenModuleIdx(openModuleIdx === i ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white ${colors.bg} shrink-0`}>{i + 1}</span>
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{mod.topics.length} topics</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openModuleIdx === i ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {openModuleIdx === i && (
                      <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                        <ul className="space-y-1.5">
                          {mod.topics.map((t, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${colors.text}`} />
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

        {/* ── Who is it for ── */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Who Is This Course For?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Zap className="w-6 h-6" />, title: 'Aspiring Recyclers', desc: 'Entrepreneurs planning to enter the recycling sector from scratch.' },
                { icon: <Users className="w-6 h-6" />, title: 'Existing Recyclers', desc: 'Unit owners looking to formalise, scale or get EPR-compliant.' },
                { icon: <GraduationCap className="w-6 h-6" />, title: 'EPR Consultants', desc: 'Professionals who advise recycler clients on compliance and growth.' },
                { icon: <Award className="w-6 h-6" />, title: 'Sustainability Teams', desc: 'Corporates generating recyclable waste who need recycler partners.' },
              ].map(w => (
                <div key={w.title} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                  <div className={`${colors.light} ${colors.text} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3`}>{w.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{w.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What Our Learners Say</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {COMMON_FAQS.map((faq, i) => <Faq key={i} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </section>

        {/* ── Cross-sell: other course types for same category ── */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Your {category.label} Journey</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Take all three courses to go from awareness to expert</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {COURSE_TYPES.map(ct => {
                const isCurrent = ct.type === courseType.type;
                const c = TYPE_COLOR[ct.type];
                return (
                  <div key={ct.type} className={`rounded-xl border-2 p-4 text-center ${isCurrent ? `${c.ring} bg-white dark:bg-gray-900 shadow-lg` : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                    {isCurrent && <span className="inline-block mb-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-eco-green-4 text-white">Current</span>}
                    <div className={`text-sm font-bold mb-1 ${c.text}`}>{ct.type}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{ct.level} · {ct.duration}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{ct.priceLabel}</div>
                    {isCurrent ? (
                      <span className="w-full block text-xs font-medium text-gray-400 py-2">You're here</span>
                    ) : (
                      <Link href={`/trainings/recycler/${buildSlug(category.id, ct.type)}`}
                        className={`block w-full text-center text-xs font-semibold py-2 px-3 rounded-lg border-2 ${c.ring} ${c.text} hover:${c.bg} hover:text-white transition`}>
                        View {ct.type} →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className={`py-16 ${colors.bg}`}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">
              Ready to {courseType.type === 'Workshop' ? 'Attend the Free Workshop' : `Enroll in the ${courseType.type} Course`}?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Join the EPR Compass recycler training programme
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handlePayNow}
                disabled={paying}
                className="bg-white text-eco-green-4 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                {courseType.price === 0 ? 'Register Free' : `Enroll — ${formatINR(totalAmount)}`}
                <ChevronRight className="w-5 h-5" />
              </button>
              <Link href="/trainings#recycler-courses"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/10 transition flex items-center justify-center gap-2">
                Browse All Courses
              </Link>
            </div>
            <p className="mt-4 text-white/60 text-sm">5,000+ professionals trained · Powered by EPR Compass</p>
          </div>
        </section>

      </div>
    </>
  );
}

