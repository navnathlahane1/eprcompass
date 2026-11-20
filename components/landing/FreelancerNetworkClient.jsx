'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

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
  IndianRupee, Globe, Briefcase, Users, Clock, TrendingUp,
  CheckCircle, ArrowRight, Upload, Award, BookOpen, Shield, Star, BadgeCheck,
} from 'lucide-react';
import { fileToBase64, submitToGoogleScript } from '@/lib/googleScript';
import useScrollReveal from '@/components/useScrollReveal';
import { trackEvent, trackRevenue } from '@/lib/analytics';
import WhatsAppJoinCTA from '@/components/WhatsAppJoinCTA';
import { getWhatsAppCommunity } from '@/lib/whatsappCommunities';

const WA_COMMUNITY = getWhatsAppCommunity('freelancer-network');

// ─── Data ────────────────────────────────────────────────────────────────────

const HIGHLIGHTS = [
  { icon: IndianRupee, label: 'Earn on Hourly Basis' },
  { icon: Globe,       label: 'Work From Anywhere' },
  { icon: Briefcase,   label: 'Live Client Opportunities' },
  { icon: Users,       label: 'Industry Expert Network' },
  { icon: Clock,       label: 'Flexible Working Hours' },
  { icon: TrendingUp,  label: 'Professional Growth' },
];

const TARGET_AUDIENCE = [
  'Existing EPR Consultants',
  'Environmental Consultants',
  'Sustainability Professionals',
  'ESG Consultants',
  'Waste Management Professionals',
  'Former Pollution Control Board Officials',
  'Compliance Experts',
  'Independent Consultants',
];

const BENEFITS = [
  { icon: IndianRupee, title: 'Earn on Hourly Basis',               desc: 'Get paid for every hour you consult. Transparent billing with timely payouts.' },
  { icon: Briefcase,   title: 'Access to Live Consulting Opportunities', desc: 'Receive curated consulting assignments matched to your expertise and availability.' },
  { icon: Shield,      title: 'Work with Verified Clients',          desc: 'All clients are verified businesses with genuine EPR compliance requirements.' },
  { icon: Clock,       title: 'Flexible Work Schedule',              desc: 'Choose assignments that fit your schedule — full-time, part-time, or project-based.' },
  { icon: BookOpen,    title: 'Continuous Learning & Training',      desc: 'Access the latest regulatory updates, training modules, and expert webinars.' },
  { icon: Users,       title: 'National Professional Network',       desc: 'Connect with environmental compliance professionals across India.' },
  { icon: Award,       title: 'Expert Support for Complex Projects', desc: 'Get peer support and expert guidance on challenging client engagements.' },
];

const EARNINGS = [
  'Hourly Consulting Assignments',
  'Project-Based Engagements',
  'Client Support Activities',
  'Compliance Documentation',
  'Environmental Audits',
  'EPR Consulting Projects',
];

const FEE_COVERS = [
  'Profile Verification',
  'Network Access',
  'Training Resources',
  'Opportunity Matching',
  'Freelancer Onboarding',
];

const STEPS = [
  { num: '01', title: 'Submit Application',            desc: 'Fill out the freelancer application form with your profile and expertise details.' },
  { num: '02', title: 'Pay ₹999 Onboarding Fee',       desc: 'One-time fee covering profile verification, network access, and training resources.' },
  { num: '03', title: 'Profile Verification',           desc: 'Our team verifies your credentials and expertise within 3 business days.' },
  { num: '04', title: 'Attend Orientation',             desc: 'Brief online orientation covering platform, processes, and client expectations.' },
  { num: '05', title: 'Start Receiving Opportunities',  desc: 'Get matched with client assignments and start earning through your expertise.' },
];

const TESTIMONIALS = [
  {
    name: 'Sanjay Kumar',
    role: 'Former PCB Official, now CEPC Freelancer',
    text: 'Joining the freelancer network was the best move after my retirement. I get consistent consulting work and earn well — all from home.',
    rating: 5,
  },
  {
    name: 'Meera Pillai',
    role: 'Independent ESG Consultant, Bangalore',
    text: 'The platform connects me directly with clients who need real EPR expertise. No cold calling, no prospecting — just real work.',
    rating: 5,
  },
];

const EXPERTISE_OPTIONS = [
  'EPR Compliance', 'Plastic Waste Management', 'E-Waste Management',
  'Battery Waste Management', 'Environmental Auditing', 'ESG / Sustainability',
  'ISO 14001 / 45001', 'Pollution Control', 'Other',
];

const EMPTY = {
  fullName: '', mobile: '', email: '', city: '',
  experience: '', expertise: '', occupation: '',
  linkedin: '', whyJoin: '', resume: null,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function FreelancerNetworkClient() {
  const { d, h, m, s } = useCountdown();
  useScrollReveal();
  const [form, setForm]     = useState(EMPTY);
  const [busy, setBusy]     = useState(false);
  const [status, setStatus] = useState(null);
  const [msg, setMsg]       = useState('');

  const set     = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const setFile = (e) => setForm(p => ({ ...p, resume: e.target.files[0] }));
  const reset   = () => { setForm(EMPTY); setStatus(null); setMsg(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.mobile.trim()) {
      setStatus('error'); setMsg('Please fill in all required fields.'); return;
    }
    if (!form.resume) {
      setStatus('error'); setMsg('Please upload your resume.'); return;
    }

    setBusy(true); setStatus(null);
    trackEvent('Checkout Started', { product: 'freelancer-network' });
    try {
      if (typeof window === 'undefined' || typeof window.Razorpay !== 'function')
        throw new Error('Razorpay SDK failed to load. Please refresh and try again.');

      const res = await fetch('/api/payment/freelancer-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       form.fullName.trim(),
          email:      form.email.trim(),
          phone:      form.mobile,
          city:       form.city,
          experience: form.experience,
          expertise:  form.expertise,
          occupation: form.occupation,
          linkedin:   form.linkedin,
          sourcePage: 'freelancer-network',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to initialise payment');

      new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'EPR Compass',
        description: 'EPR Freelancer Network — Onboarding Fee',
        order_id: data.orderId,
        image: '/imgs/epr-compass/epr-compass-platform.png',
        prefill: {
          name: form.fullName.trim(),
          email: form.email.trim(),
          contact: form.mobile,
        },
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

            const fileBase64 = await fileToBase64(form.resume);
            await submitToGoogleScript({
              type: 'freelancer_network_application',
              fullName: form.fullName.trim(),
              mobile: form.mobile,
              email: form.email.trim(),
              city: form.city,
              experience: form.experience,
              expertise: form.expertise,
              occupation: form.occupation,
              linkedin: form.linkedin,
              whyJoin: form.whyJoin,
              fileName: form.resume.name,
              fileMimeType: form.resume.type || 'application/octet-stream',
              fileBase64,
              razorpay_payment_id: response.razorpay_payment_id || '',
              razorpay_order_id: response.razorpay_order_id || '',
              submittedAt: Date.now(),
            });
            trackEvent('Purchase Completed', {
              product: 'freelancer-network',
              payment_id: response.razorpay_payment_id || '',
              order_id: response.razorpay_order_id || '',
            });
            trackRevenue({ amount: 999, productId: 'freelancer-network' });
            setStatus('success');
            setMsg('Payment successful! Your application has been submitted. We will review your profile and get back to you within 3 business days.');
            reset();
          } catch (err) {
            setStatus('error');
            const isVerifyFail = err?.message?.toLowerCase().includes('verif');
            setMsg(isVerifyFail
              ? (err.message || 'Payment verification failed. Please contact support.')
              : 'Payment received but application submission failed. Please contact support with your payment ID: ' + (response.razorpay_payment_id || ''));
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: '#07875f' },
      }).open();
    } catch (err) {
      setStatus('error'); setMsg(err.message || 'Network error. Please try again.');
      setBusy(false);
    }
  };

  const field = 'mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-eco-green-4 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50';

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* ── COUNTDOWN BAR ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-300 font-bold uppercase tracking-wider text-[11px]">Limited Spots</span>
            <span className="hidden sm:inline text-white/80">Applications close in</span>
          </div>
          <div className="flex items-center gap-2">
            {[['Days', d], ['Hrs', h], ['Min', m], ['Sec', s]].map(([l, v]) => (
              <div key={l} className="text-center">
                <div className="bg-white/10 rounded-md px-2 py-1 font-mono font-bold text-base min-w-[40px]">{pad(v)}</div>
                <div className="text-[9px] text-white/60 mt-0.5">{l}</div>
              </div>
            ))}
            <a href="#apply" className="ml-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-sm font-bold transition">Apply Now →</a>
          </div>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-eco-green-4 to-emerald-700 py-24 text-white">
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-5" />
        <div className="relative mx-auto max-w-5xl px-6 text-center" data-scroll-reveal>
          <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium backdrop-blur-sm">
            EPR Freelancer Network
          </span>
          <h1 className="font-tricks text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Join India&apos;s Leading Environmental Compliance Freelancer Network
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 leading-relaxed">
            Already experienced in EPR, Plastic Waste, E-Waste, Battery Waste, ESG, or Environmental Consulting? Join our verified freelancer network and start earning from consulting assignments across India.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {HIGHLIGHTS.map((h, i) => (
              <span key={i} className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <h.icon size={14} /> {h.label}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="#apply" className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-eco-green-4 shadow-lg transition hover:bg-gray-50">
              Join Freelancer Network <ArrowRight size={18} />
            </a>
            <a href="#how-it-works" className="flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3.5 font-semibold transition hover:bg-white/10">
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── TRUST STATS ──────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50 py-10 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-6 text-center">
          {[
            { val: '500+', label: 'Active Freelancers' },
            { val: '₹999', label: 'One-time Joining Fee' },
            { val: '3 Days', label: 'Profile Verification' },
            { val: '100%', label: 'Verified Clients' },
          ].map((s, i) => (
            <div key={i} className="min-w-[110px]">
              <p className="font-tricks text-3xl font-bold text-eco-green-4">{s.val}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO SHOULD JOIN ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Who Should Join
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
              This program is designed for professionals who already have environmental compliance experience and want to monetize it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TARGET_AUDIENCE.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <CheckCircle size={18} className="mt-0.5 shrink-0 text-eco-green-4" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Freelancer Benefits
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
              Everything you need to build a thriving environmental compliance consulting practice on your terms.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900" data-scroll-reveal>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-eco-green-4/10">
                  <b.icon size={24} className="text-eco-green-4" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARNING OPPORTUNITIES ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Earning Opportunities
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Freelancers earn through multiple engagement types:</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EARNINGS.map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-eco-green-4 text-xs font-bold text-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONBOARDING FEE ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            One-Time Onboarding Fee
          </h2>
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="font-tricks text-6xl font-bold text-eco-green-4">₹999</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">One-time · Non-refundable</p>
            <ul className="mt-8 space-y-3 text-left">
              {FEE_COVERS.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <BadgeCheck size={16} className="shrink-0 text-eco-green-4" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">What Our Freelancers Say</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900" data-scroll-reveal>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-14" data-scroll-reveal>
            <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">How It Works</h2>
          </div>
          <div className="space-y-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6" data-scroll-reveal>
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-eco-green-4 text-sm font-bold text-white">
                    {step.num}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="mt-2 h-full w-0.5 bg-eco-green-4/20" />
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

      {/* ── APPLICATION FORM ─────────────────────────────────────────────── */}
      <section id="apply" className="py-20">
        <div className="mx-auto max-w-2xl px-6" data-scroll-reveal>
          <h2 className="text-center font-tricks text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Join the Freelancer Network
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-gray-600 dark:text-gray-400">
            Submit your application and our team will review your profile within 3 business days.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {['Profile verified in 3 days', '₹999 one-time joining fee', 'Flexible work schedule', 'Verified client network'].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <BadgeCheck size={12} className="text-eco-green-4" /> {t}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">

            {status === 'success' && (
              <div className="mb-6 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  {msg}
                </div>
                <WhatsAppJoinCTA communityName={WA_COMMUNITY.name} link={WA_COMMUNITY.link} />
              </div>
            )}
            {status === 'error' && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {msg}{' '}
                <button onClick={reset} className="underline">Try Again</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot */}
              <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name *
                  <input name="fullName" value={form.fullName} onChange={set} required disabled={busy} className={field} placeholder="Your full name" />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mobile Number *
                  <input name="mobile" type="tel" value={form.mobile} onChange={set} required disabled={busy} className={field} placeholder="10-digit mobile" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address *
                  <input name="email" type="email" value={form.email} onChange={set} required disabled={busy} className={field} placeholder="your@email.com" />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                  <input name="city" value={form.city} onChange={set} disabled={busy} className={field} placeholder="Your city" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Years of Experience
                  <select name="experience" value={form.experience} onChange={set} disabled={busy} className={field}>
                    <option value="">Select</option>
                    {['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'].map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Area of Expertise
                  <select name="expertise" value={form.expertise} onChange={set} disabled={busy} className={field}>
                    <option value="">Select</option>
                    {EXPERTISE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Occupation
                  <input name="occupation" value={form.occupation} onChange={set} disabled={busy} className={field} placeholder="e.g. Environmental Consultant" />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  LinkedIn Profile
                  <input name="linkedin" type="url" value={form.linkedin} onChange={set} disabled={busy} className={field} placeholder="https://linkedin.com/in/..." />
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Why Do You Want To Join?
                <textarea name="whyJoin" value={form.whyJoin} onChange={set} disabled={busy} rows={3} className={`${field} resize-none`} placeholder="Tell us about your background and goals..." />
              </label>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resume (PDF or Word) *</p>
                <div className="flex items-center gap-4">
                  <input type="file" id="resume" onChange={setFile} accept=".pdf,.doc,.docx" disabled={busy} className="hidden" />
                  <label
                    htmlFor="resume"
                    className={`flex cursor-pointer items-center gap-2 rounded-xl bg-eco-green-4 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-eco-green-3 ${busy ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <Upload size={16} /> Upload Resume
                  </label>
                  {form.resume && <span className="text-sm text-gray-500 truncate max-w-[160px]">{form.resume.name}</span>}
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-eco-green-4 py-3 font-semibold text-white transition hover:bg-eco-green-3 disabled:opacity-50 sm:w-auto sm:px-10"
              >
                {busy
                  ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processing…</>
                  : <>Pay ₹999 &amp; Join Network <ArrowRight size={16} /></>
                }
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-eco-green-4 to-emerald-700 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center" data-scroll-reveal>
          <h2 className="font-tricks text-3xl font-bold sm:text-4xl">
            Turn Your Environmental Compliance Expertise Into Income
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            Join a growing network of verified environmental professionals earning through consulting projects across India.
          </p>
          <a
            href="#apply"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 font-semibold text-eco-green-4 shadow-lg transition hover:bg-gray-50"
          >
            Join Now — ₹999 One-Time Fee <ArrowRight size={18} />
          </a>
        </div>
      </section>

    </main>
  );
}

