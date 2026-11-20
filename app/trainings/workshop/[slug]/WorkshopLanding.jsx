'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Clock, Users, Award, ChevronRight, ChevronDown,
  Star, GraduationCap, FileText, BookOpen, MapPin, Calendar,
} from 'lucide-react';

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

const FAQS = [
  { q: 'Is this workshop really free?', a: 'Yes, completely free. Register via the button above and you will receive the Zoom / Google Meet link before the session.' },
  { q: 'Will sessions be recorded?', a: 'Yes. Recordings are available for 7 days after the live session.' },
  { q: 'Do I need prior knowledge?', a: 'No prior knowledge needed. These workshops are designed for beginners and compliance teams new to EPR.' },
  { q: 'Who conducts the workshop?', a: 'The workshop is led by the EPR Compass training team.' },
  { q: 'Will I receive a certificate?', a: 'Yes — a Certificate of Participation is issued on completion.' },
  { q: 'How do I access deeper learning after this?', a: 'Each workshop has an upsell path to a Certification or Mastery course with full curriculum, assessments and a recognised certificate.' },
];

export default function WorkshopLanding({ workshop }) {
  const router = useRouter();
  const [openIdx, setOpenIdx] = useState(0);

  function handleRegister() {
    router.push(`/academy/enrollment?program=${workshop.id}`);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-eco-green-4 transition">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/trainings" className="hover:text-eco-green-4 transition">Trainings</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/trainings#standalone-workshops" className="hover:text-eco-green-4 transition">Workshops</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-medium">{workshop.title}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-eco-green-1/10 via-white to-eco-green-2/10 dark:from-eco-green-1/5 dark:via-gray-900 dark:to-eco-green-2/5 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left */}
            <div>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-eco-green-4" /> FREE WORKSHOP
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">Beginner</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{workshop.wasteType}</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                {workshop.title}
              </h1>
              <p className="text-lg font-medium text-eco-green-4 mb-3">{workshop.tagline}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{workshop.description}</p>

              <div className="rounded-xl border border-eco-green-4/30 bg-eco-green-4/5 p-4 mb-6">
                <p className="text-xs font-semibold text-eco-green-4 uppercase tracking-wide mb-1">Applicable Regulation</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{workshop.regulation}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Clock className="w-4 h-4" />, label: 'Duration', value: workshop.duration },
                  { icon: <BookOpen className="w-4 h-4" />, label: 'Sessions', value: `${workshop.sessions} live` },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Format', value: workshop.format },
                  { icon: <Award className="w-4 h-4" />, label: 'Level', value: 'Beginner' },
                ].map(m => (
                  <div key={m.label} className="flex flex-col items-center text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                    <span className="mb-1 text-eco-green-4">{m.icon}</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{m.label}</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — registration card */}
            <div className="rounded-2xl border-2 ring-eco-green-4 border-eco-green-4 bg-white dark:bg-gray-800 shadow-xl p-6 sticky top-24">
              <div className="bg-eco-green-4 rounded-xl p-4 mb-5 text-white">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-1">Free Workshop</p>
                <p className="text-2xl font-bold">{workshop.title}</p>
                <p className="text-white/80 text-sm mt-1">{workshop.wasteType} · {workshop.duration}</p>
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold text-eco-green-4">Free</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No payment — register & attend live online</p>
              </div>

              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">What's included:</p>
                <ul className="space-y-2">
                  {workshop.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-eco-green-4" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={handleRegister}
                className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white font-bold py-4 rounded-xl text-base transition flex items-center justify-center gap-2 min-h-[52px]">
                Register Free →
              </button>

              <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Want a recognised certificate?</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upgrade to our full {workshop.upsell.type} course after this workshop.</p>
                    <Link href={workshop.upsell.path} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
                      {workshop.upsell.label} →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Workshop Curriculum</h2>
            <p className="text-gray-600 dark:text-gray-300">{workshop.curriculum.length} sessions · {workshop.duration}</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {workshop.curriculum.map((mod, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white bg-eco-green-4 shrink-0">{i + 1}</span>
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
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-eco-green-4" />
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

      {/* Who it's for */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Who Should Attend?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {workshop.audience.map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-3">
                <div className="bg-eco-green-4/10 text-eco-green-4 w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">What Attendees Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {workshop.testimonials.map((t, i) => (
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
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-eco-green-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Reserve Your Free Seat</h2>
          <p className="text-white/80 mb-8 text-lg">Live online EPR workshop with practical guidance from the EPR Compass team.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleRegister}
              className="bg-white text-eco-green-4 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-100 transition flex items-center justify-center gap-2">
              Register Free <ChevronRight className="w-5 h-5" />
            </button>
            <Link href="/trainings#standalone-workshops"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition flex items-center justify-center">
              Browse All Workshops
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

