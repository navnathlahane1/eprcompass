"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Users, Award, GraduationCap, ChevronRight,
  CheckCircle, Shield, Monitor, Leaf, Scale, BookOpen,
  Smartphone, Landmark, CreditCard, Lock, BadgeCheck, Star,
} from 'lucide-react';
import ConsultationForm from '@/components/ConsultationForm';
import { RECYCLER_CATEGORIES, COURSE_TYPES as RECYCLER_COURSE_TYPES, buildSlug as buildRecyclerSlug } from './recycler/data';
import { EPR_CATEGORIES, EPR_COURSE_TYPES, buildEprSlug } from './epr-compliance/data';
import { STANDALONE_WORKSHOPS } from './workshop/data';
import { CAREER_PROGRAMMES, BADGE_STYLES } from './career/data';

// ── Academy Tiers ─────────────────────────────────────────────────────────────
const ACADEMY_TIERS = [
  {
    tier: 'Tier 1', name: 'EPR Awareness Bootcamp', credential: 'EPR Essentials Certificate',
    price: '₹999', duration: '2-Day Intensive',
    color: 'from-emerald-600 to-emerald-500', border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    pdf: '/downloads/Tier1_EPR_Essentials.pdf',
    desc: 'Master India\'s EPR regulatory framework, CPCB portal, and compliance documentation in 2 focused days.',
    highlights: ['8 structured modules', 'CPCB portal hands-on', 'MCQ assessment', 'Certificate of completion'],
    enrollPath: '/academy/login?program=tier-1',
  },
  {
    tier: 'Tier 2', name: 'Certified EPR Professional Consultant', credential: 'CEPC Certification',
    price: '₹5,000', duration: '3-Month Programme',
    color: 'from-indigo-600 to-indigo-500', border: 'border-indigo-500/30',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    pdf: '/downloads/Tier2_EPR_Consultant_Pro_CEPC.pdf',
    desc: 'Build a professional EPR consulting practice — advanced filings, client acquisition, mock engagements, and CEPC credential.',
    highlights: ['12 weekly sessions', 'Mock filings (Plastic + E-Waste)', '1:1 mentor review', 'CEPC directory listing'],
    enrollPath: '/academy/login?program=tier-2',
  },
  {
    tier: 'Tier 3', name: 'EPR Agency Leadership Programme', credential: 'EALP Certificate',
    price: '₹50,000', duration: '6-Month Programme',
    color: 'from-violet-600 to-violet-500', border: 'border-violet-500/30',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    pdf: '/downloads/Tier3_EPR_Agency_Master_EALP.pdf',
    desc: 'Launch and scale a full EPR compliance agency — team building, enterprise clients, 4 milestone assessments, and mentoring from an EPR Compass expert.',
    highlights: ['Max 10 learners per cohort', '4 milestone assessments', 'Agency launch support', 'Partner network access'],
    enrollPath: '/academy/login?program=tier-3',
  },
];

const WORKSHOP_ICON = { Shield, Monitor, Leaf, Scale };

const TYPE_LABEL = {
  Workshop:      { dot: 'bg-emerald-400', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  Certification: { dot: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-50 dark:bg-amber-900/20',     border: 'border-amber-200 dark:border-amber-800' },
  Mastery:       { dot: 'bg-violet-500',  text: 'text-violet-700 dark:text-violet-300',   bg: 'bg-violet-50 dark:bg-violet-900/20',   border: 'border-violet-200 dark:border-violet-800' },
};

// Section anchor nav items
const SECTIONS = [
  { id: 'standalone-workshops',    label: 'Free Workshops' },
  { id: 'career-programmes',       label: 'Career Programmes' },
  { id: 'academy-tiers',           label: 'Academy Tiers' },
  { id: 'epr-compliance-courses',  label: 'EPR Compliance Courses' },
  { id: 'recycler-courses',        label: 'Recycler Courses' },
];

export default function TrainingsPage() {
  const [activeSection, setActiveSection] = useState('');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-eco-green-1/10 via-white to-eco-green-2/10 dark:from-eco-green-1/5 dark:via-gray-900 dark:to-eco-green-2/5 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block bg-eco-green-4/10 border border-eco-green-4/30 text-eco-green-4 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
            EPR Compass · EPR Compass
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-5">
            <span className="text-gray-900 dark:text-white">EPR</span>{' '}
            <span className="text-eco-green-4">Trainings</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            India's most comprehensive EPR training suite — workshops, certification courses and mastery programmes for producers, consultants and recyclers.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {[
              { label: 'Professionals Trained', value: '5,000+' },
              { label: 'Total Courses',          value: '58' },
              { label: 'Waste Categories',       value: '8' },
              { label: 'Instructor',             value: 'EPR Compass training team' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-6 py-4 text-center shadow-sm min-w-[140px]">
                <p className="text-2xl font-bold text-eco-green-4">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick-nav to sections */}
          <div className="flex flex-wrap justify-center gap-3">
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-eco-green-4 hover:text-eco-green-4 rounded-full px-4 py-2 text-sm font-medium transition">
                {s.label} <ChevronRight className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 1: Standalone Free Workshops ── */}
      <section id="standalone-workshops" className="py-20 bg-white dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700 mb-3">FREE WORKSHOPS</span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">EPR Awareness Workshops</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">Short-format, free, live online workshops covering EPR fundamentals — PWM Rules, CPCB portal, plastic targets and compliance reporting.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-eco-green-4">4</p>
              <p className="text-xs text-gray-500">free workshops</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STANDALONE_WORKSHOPS.map(w => {
              const Icon = WORKSHOP_ICON[w.icon] || Shield;
              return (
                <div key={w.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-eco-green-4/40 transition flex flex-col">
                  <div className="bg-gradient-to-br from-eco-green-4/10 to-eco-green-2/10 dark:from-eco-green-4/10 dark:to-gray-800 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="bg-eco-green-4/10 p-2 rounded-lg shrink-0">
                        <Icon className="w-6 h-6 text-eco-green-4" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{w.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">FREE</span>
                      <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{w.duration}</span>
                      <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{w.sessions} sessions</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mb-4 flex-1">{w.subtitle}</p>
                    <Link href={`/trainings/workshop/${w.id}`}
                      className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-1.5">
                      View Workshop <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 2: Career Transition & Professional Development ── */}
      <section id="career-programmes" className="py-20 bg-gray-50 dark:bg-gray-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="inline-block bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-200 dark:border-teal-700 mb-3">CAREER PROGRAMMES</span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">EPR Career & Professional Development</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">Structured programmes for career changers, EHS professionals, legal practitioners and entrepreneurs building an EPR career or consulting business.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{CAREER_PROGRAMMES.length}</p>
              <p className="text-xs text-gray-500">programmes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAREER_PROGRAMMES.map(prog => {
              const cs = BADGE_STYLES[prog.badgeColor];
              return (
                <div key={prog.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition flex flex-col group">
                  {/* Card header */}
                  <div className={`${cs.bg} px-5 py-4`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{prog.icon}</span>
                      <span className="text-white/80 text-xs font-bold uppercase tracking-wide">{prog.badge}</span>
                    </div>
                    <h3 className="text-white font-bold text-base leading-snug">{prog.shortTitle}</h3>
                    <p className="text-white/70 text-xs mt-1">{prog.duration} · {prog.sessions} sessions · {prog.level}</p>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mb-3 flex-1">{prog.tagline}</p>

                    {/* Audience */}
                    <div className={`rounded-lg border ${cs.border} ${cs.light} px-3 py-2 mb-4`}>
                      <p className={`text-[10px] font-semibold ${cs.text} uppercase tracking-wide mb-1`}>For</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{prog.targetAudience}</p>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{prog.priceLabel}</span>
                        <span className="text-xs text-gray-400 ml-1">+ GST</span>
                      </div>
                      <Link href={`/trainings/career/${prog.id}`}
                        className={`shrink-0 ${cs.bg} text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 hover:opacity-90 transition`}>
                        View Programme <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="mt-10 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Programme', 'Best for', 'Duration', 'Price', 'Link'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {CAREER_PROGRAMMES.map(prog => {
                  const cs = BADGE_STYLES[prog.badgeColor];
                  return (
                    <tr key={prog.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{prog.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{prog.shortTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">{prog.targetAudience.split(',')[0]}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{prog.duration}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${cs.text}`}>{prog.priceLabel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/trainings/career/${prog.id}`} className="text-xs text-indigo-500 hover:underline whitespace-nowrap">View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 3: Academy Certification Tiers ── */}
      <section id="academy-tiers" className="py-20 bg-gray-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">EPR Academy</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Academy Certification Programmes</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Three professional certification tiers designed to take you from EPR awareness to running a full compliance agency, supported by the EPR Compass training team.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ACADEMY_TIERS.map(t => (
              <div key={t.tier} className={`bg-gray-800 rounded-2xl border ${t.border} overflow-hidden flex flex-col`}>
                <div className={`bg-gradient-to-r ${t.color} px-6 py-4`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-xs font-semibold uppercase tracking-widest">{t.tier}</span>
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{t.duration}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight">{t.name}</h3>
                  <p className="text-white/80 text-xs mt-0.5">{t.credential}</p>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-gray-400 text-sm mb-4">{t.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {t.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-eco-green-4 shrink-0 mt-0.5" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-2">
                    <div className="text-2xl font-bold text-white mb-3">{t.price}</div>
                    <Link href={t.enrollPath}
                      className="w-full flex items-center justify-center gap-2 bg-eco-green-4 hover:bg-eco-green-5 text-white py-3 px-4 rounded-lg font-semibold text-sm transition">
                      Enrol in Academy <ChevronRight className="w-4 h-4" />
                    </Link>
                    <a href={t.pdf} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white py-2.5 px-4 rounded-lg text-sm transition">
                      Download Curriculum PDF
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Powered by <Link href="/academy/login" className="text-indigo-400 hover:underline">EPR Compass Academy</Link>
            {' '}· <Link href="/academy/login" className="text-indigo-400 hover:underline">Log in to your learner portal →</Link>
          </p>
        </div>
      </section>

      {/* ── Section 3: EPR Compliance Courses ── */}
      <section id="epr-compliance-courses" className="py-20 bg-gray-50 dark:bg-gray-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 dark:border-amber-700 mb-3">FOR PRODUCERS & CONSULTANTS</span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">EPR Compliance Courses</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">For producers, importers, brand owners and EPR consultants. 8 waste categories × 3 levels = 24 courses covering every aspect of EPR compliance under Indian law.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">24</p>
              <p className="text-xs text-gray-500">courses</p>
            </div>
          </div>

          {/* Course type key */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { type: 'Workshop',      priceLabel: 'Free',     desc: 'Beginner awareness' },
              { type: 'Certification', priceLabel: '₹2,999',   desc: 'Intermediate · 4 weeks' },
              { type: 'Mastery',       priceLabel: '₹15,000',  desc: 'Advanced · 8 weeks + mentoring' },
            ].map(t => {
              const cs = TYPE_LABEL[t.type];
              return (
                <div key={t.type} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 ${cs.bg} ${cs.border}`}>
                  <span className={`h-2 w-2 rounded-full ${cs.dot}`} />
                  <span className={`text-xs font-bold ${cs.text}`}>{t.type}</span>
                  <span className="text-xs text-gray-500">— {t.priceLabel} · {t.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {EPR_CATEGORIES.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-amber-400/40 transition">
                <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-900 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-start gap-3 mb-1">
                    <span className="text-2xl">{cat.icon}</span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{cat.label}</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-1">{cat.tagline}</p>
                </div>
                <div className="p-4 space-y-2">
                  {EPR_COURSE_TYPES.map(ct => {
                    const cs = TYPE_LABEL[ct.type];
                    return (
                      <Link key={ct.type} href={`/trainings/epr-compliance/${buildEprSlug(cat.id, ct.type)}`}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition ${cs.bg} ${cs.border} hover:opacity-80`}>
                        <div>
                          <span className={`text-xs font-bold block ${cs.text}`}>{ct.type}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{ct.level} · {ct.priceLabel}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${cs.text} opacity-60`} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Recycler Business Courses ── */}
      <section id="recycler-courses" className="py-20 bg-white dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <span className="inline-block bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold px-3 py-1 rounded-full border border-violet-200 dark:border-violet-700 mb-3">EXCLUSIVE FOR RECYCLERS</span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Recycler Business Courses</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">For recycling entrepreneurs, existing recyclers and EPR consultants advising them. 8 categories × 3 levels — covering how to <strong>Launch</strong>, <strong>Run</strong> and <strong>Scale</strong> a recycling business.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">24</p>
              <p className="text-xs text-gray-500">courses</p>
            </div>
          </div>

          {/* Stage chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['Launch', 'Run', 'Scale'].map(s => (
              <span key={s} className="text-xs font-bold bg-eco-green-4 text-white px-3 py-1 rounded-full">{s}</span>
            ))}
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center">covered inside every course</span>
          </div>

          {/* Course type key */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { type: 'Workshop',      priceLabel: 'Free',     desc: 'Beginner awareness' },
              { type: 'Certification', priceLabel: '₹4,999',   desc: 'Intermediate · 4 weeks' },
              { type: 'Mastery',       priceLabel: '₹14,999',  desc: 'Advanced · 8 weeks + mentoring' },
            ].map(t => {
              const cs = TYPE_LABEL[t.type];
              return (
                <div key={t.type} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 ${cs.bg} ${cs.border}`}>
                  <span className={`h-2 w-2 rounded-full ${cs.dot}`} />
                  <span className={`text-xs font-bold ${cs.text}`}>{t.type}</span>
                  <span className="text-xs text-gray-500">— {t.priceLabel} · {t.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {RECYCLER_CATEGORIES.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-violet-400/40 transition">
                <div className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/10 dark:to-gray-800 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-1">
                    <span className="text-2xl">{cat.icon}</span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{cat.label}</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-1">{cat.tagline}</p>
                </div>
                <div className="p-4 space-y-2">
                  {RECYCLER_COURSE_TYPES.map(ct => {
                    const cs = TYPE_LABEL[ct.type];
                    return (
                      <Link key={ct.type} href={`/trainings/recycler/${buildRecyclerSlug(cat.id, ct.type)}`}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition ${cs.bg} ${cs.border} hover:opacity-80`}>
                        <div>
                          <span className={`text-xs font-bold block ${cs.text}`}>{ct.type}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{ct.level} · {ct.priceLabel}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${cs.text} opacity-60`} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instructor strip ── */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-eco-green-4 flex items-center justify-center shrink-0 text-3xl font-bold text-white shadow-lg">EC</div>
          <div>
            <p className="text-xs font-semibold text-eco-green-4 uppercase tracking-wide mb-1">Meet the training team</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">EPR Compass Training Team</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Practical training across plastic, e-waste, battery, tyre, ELV, used oil, C&amp;D and non-ferrous EPR categories.
            </p>
          </div>
        </div>
      </section>

      {/* ── Full course directory ── */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Complete Course Directory</h2>
            <p className="text-gray-500 dark:text-gray-400">All 58 courses & programmes at a glance</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Category', 'Type', 'Audience', 'Duration', 'Price', 'Link'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {/* Career Programmes */}
                {CAREER_PROGRAMMES.map(prog => {
                  const cs = BADGE_STYLES[prog.badgeColor];
                  return (
                    <tr key={`career-${prog.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{prog.icon} {prog.shortTitle}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cs.badge} ${cs.border}`}>{prog.badge}</span></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">Career · Professional</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{prog.duration}</td>
                      <td className={`px-4 py-3 font-semibold text-xs ${cs.text}`}>{prog.priceLabel}</td>
                      <td className="px-4 py-3"><Link href={`/trainings/career/${prog.id}`} className="text-xs text-indigo-500 hover:underline whitespace-nowrap">View →</Link></td>
                    </tr>
                  );
                })}
                {/* Free Workshops row group */}
                {STANDALONE_WORKSHOPS.map((w, i) => (
                  <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{w.title}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Workshop</span></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">Producers · Consultants</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{w.duration}</td>
                    <td className="px-4 py-3 font-semibold text-eco-green-4 text-xs">Free</td>
                    <td className="px-4 py-3"><Link href={`/trainings/workshop/${w.id}`} className="text-xs text-indigo-500 hover:underline whitespace-nowrap">View →</Link></td>
                  </tr>
                ))}
                {/* EPR Compliance Courses */}
                {EPR_CATEGORIES.flatMap(cat =>
                  EPR_COURSE_TYPES.map(ct => (
                    <tr key={`${cat.id}-${ct.type}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cat.label}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_LABEL[ct.type].bg} ${TYPE_LABEL[ct.type].text} border ${TYPE_LABEL[ct.type].border}`}>{ct.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">Producers · Consultants</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{ct.duration}</td>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: ct.price === 0 ? '#07875f' : undefined }}>{ct.priceLabel}</td>
                      <td className="px-4 py-3"><Link href={`/trainings/epr-compliance/${buildEprSlug(cat.id, ct.type)}`} className="text-xs text-indigo-500 hover:underline whitespace-nowrap">View →</Link></td>
                    </tr>
                  ))
                )}
                {/* Recycler Business Courses */}
                {RECYCLER_CATEGORIES.flatMap(cat =>
                  RECYCLER_COURSE_TYPES.map(ct => (
                    <tr key={`r-${cat.id}-${ct.type}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cat.label}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_LABEL[ct.type].bg} ${TYPE_LABEL[ct.type].text} border ${TYPE_LABEL[ct.type].border}`}>{ct.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">Recyclers · Entrepreneurs</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{ct.duration}</td>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: ct.price === 0 ? '#07875f' : undefined }}>{ct.priceLabel}</td>
                      <td className="px-4 py-3"><Link href={`/trainings/recycler/${buildRecyclerSlug(cat.id, ct.type)}`} className="text-xs text-indigo-500 hover:underline whitespace-nowrap">View →</Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Consultation ── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <ConsultationForm />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-eco-green-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Build EPR Capability?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            52 courses. 8 waste categories. Free workshops to mastery programmes. Start anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#standalone-workshops" className="inline-flex items-center justify-center gap-2 bg-white text-eco-green-4 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-100 transition">
              Start Free <ChevronRight className="w-5 h-5" />
            </a>
            <Link href="/training_calendar" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/10 transition">
              <Calendar className="w-5 h-5" /> View Training Calendar
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

