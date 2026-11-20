'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CourseType = 'Workshop' | 'Certification' | 'Mastery';
type Course = { id: string; title: string; modules: number; videos: number; pdfs: number; quizzes: number; enrolled: number; completion: number; level: string; category: string; type: CourseType; description: string };

const RECYCLING_CATEGORIES = [
  { id: 'plastic',    label: 'Plastic Recycling',                   color: 'text-blue-400',   accent: 'bg-blue-500',   badge: 'Certified Plastic Recycler',       duration: '18 hrs', enrolled: 312 },
  { id: 'ewaste',     label: 'E-Waste Recycling',                   color: 'text-cyan-400',   accent: 'bg-cyan-500',   badge: 'Certified E-Waste Recycler',        duration: '22 hrs', enrolled: 278 },
  { id: 'battery',    label: 'Battery Waste Recycling',             color: 'text-yellow-400', accent: 'bg-yellow-500', badge: 'Certified Battery Waste Recycler',  duration: '16 hrs', enrolled: 194 },
  { id: 'tyre',       label: 'Tyre Waste Recycling',                color: 'text-orange-400', accent: 'bg-orange-500', badge: 'Certified Tyre Waste Recycler',     duration: '14 hrs', enrolled: 167 },
  { id: 'elv',        label: 'ELV Recycling',                       color: 'text-rose-400',   accent: 'bg-rose-500',   badge: 'Certified ELV Recycler',            duration: '20 hrs', enrolled: 143 },
  { id: 'usedoil',    label: 'Used Oil Recycling',                  color: 'text-amber-400',  accent: 'bg-amber-500',  badge: 'Certified Used Oil Recycler',       duration: '12 hrs', enrolled: 128 },
  { id: 'cdwaste',    label: 'Construction & Demolition Recycling', color: 'text-lime-400',   accent: 'bg-lime-500',   badge: 'Certified C&D Waste Recycler',      duration: '16 hrs', enrolled: 109 },
  { id: 'nonferrous', label: 'Non-Ferrous Materials Recycling',     color: 'text-violet-400', accent: 'bg-violet-500', badge: 'Certified Non-Ferrous Recycler',    duration: '15 hrs', enrolled: 96  },
] as const;

// Each course type covers all three business stages: Launch → Run → Scale
const COURSE_TYPE_META: { type: CourseType; level: string; modulesBase: number; videosBase: number; pdfsBase: number; quizzesBase: number; enrolledMult: number; completionBase: number }[] = [
  { type: 'Workshop',      level: 'Beginner',     modulesBase: 3,  videosBase: 6,  pdfsBase: 4,  quizzesBase: 2, enrolledMult: 1.00, completionBase: 74 },
  { type: 'Certification', level: 'Intermediate', modulesBase: 8,  videosBase: 16, pdfsBase: 10, quizzesBase: 6, enrolledMult: 0.65, completionBase: 63 },
  { type: 'Mastery',       level: 'Advanced',     modulesBase: 12, videosBase: 24, pdfsBase: 14, quizzesBase: 9, enrolledMult: 0.40, completionBase: 54 },
];

// Each course title follows the programs pattern and internally covers Launch, Run & Scale stages
const COURSE_SUBTITLES: Record<string, Record<CourseType, string>> = {
  plastic:    {
    Workshop:      'Awareness workshop — covers how to launch, run & scale a plastic recycling business; licensing basics, machinery overview & EPR compliance',
    Certification: 'Certification course — deep-dives into launching your unit, running daily operations with quality control & scaling to multi-polymer recovery',
    Mastery:       'Consulting mastery — advanced playbook for launching EPR-linked ventures, running complex supply chains & scaling to export-grade polymer markets',
  },
  ewaste:     {
    Workshop:      'Awareness workshop — overview of how to launch, run & scale an e-waste dismantling & recycling facility under CPCB norms',
    Certification: 'Certification course — step-by-step launch guide, operational compliance & channel partner strategies to scale your e-waste business',
    Mastery:       'Consulting mastery — PRO tie-ups, bulk OEM contracts, precious-metal refining & multi-site e-waste operations at scale',
  },
  battery:    {
    Workshop:      'Awareness workshop — how to launch, run & scale a lead-acid or Li-ion battery recycling unit with full CPCB authorisation',
    Certification: 'Certification course — facility setup, safe hydrometallurgical processing, compliance reporting & growing your battery recycling throughput',
    Mastery:       'Consulting mastery — OEM battery-return programs, BESS refurbishment services & global battery-material market entry',
  },
  tyre:       {
    Workshop:      'Awareness workshop — intro to launching, running & scaling a pyrolysis or crumb-rubber plant with all regulatory clearances',
    Certification: 'Certification course — plant commissioning, feedstock aggregation, process optimisation & end-product sales strategy',
    Mastery:       'Consulting mastery — large-scale pyrolysis park development, carbon-black upgrading & long-term fuel offtake agreements',
  },
  elv:        {
    Workshop:      'Awareness workshop — how to launch, run & scale an Authorised Vehicle Scrapping Facility (AVSF) under MoRTH norms',
    Certification: 'Certification course — AVSF setup, vehicle depollution workflow, parts cataloguing & VAHAN integration for compliance',
    Mastery:       'Consulting mastery — building a chain of AVSFs, securing OEM scrapping contracts & launching a component resale marketplace',
  },
  usedoil:    {
    Workshop:      'Awareness workshop — overview of launching, running & scaling a used-oil collection & re-refining unit under CPCB consent',
    Certification: 'Certification course — collection logistics, pre-treatment processes, base-oil quality certification & compliance reporting',
    Mastery:       'Consulting mastery — bulk industrial supply contracts, blending plant operations & used-oil export channel development',
  },
  cdwaste:    {
    Workshop:      'Awareness workshop — how to launch, run & scale a C&D waste processing plant — permits, site selection & equipment overview',
    Certification: 'Certification course — plant setup, crushing & segregation lines, RCA production standards & green building supply chain integration',
    Mastery:       'Consulting mastery — winning city-level contracts, securing RCA specification approvals & building urban circular material hubs',
  },
  nonferrous: {
    Workshop:      'Awareness workshop — intro to launching, running & scaling an aluminium, copper or zinc scrap processing unit end-to-end',
    Certification: 'Certification course — smelting operations, alloy grading systems, LME price tracking & regulatory compliance',
    Mastery:       'Consulting mastery — secondary smelter cluster development, export documentation, commodity hedging & global trading',
  },
};

const COURSES: Course[] = RECYCLING_CATEGORIES.flatMap((cat, ci) =>
  COURSE_TYPE_META.map((ct, ti) => ({
    id:          `${cat.id}-${ct.type.toLowerCase()}`,
    title:       `${cat.label} — ${ct.type}`,
    description: COURSE_SUBTITLES[cat.id][ct.type],
    modules:     ct.modulesBase  + ci,
    videos:      ct.videosBase   + ci * 2,
    pdfs:        ct.pdfsBase     + ci,
    quizzes:     ct.quizzesBase  + Math.floor(ci / 3),
    enrolled:    Math.round(cat.enrolled * ct.enrolledMult),
    completion:  ct.completionBase - ti * 2,
    level:       ct.level,
    category:    cat.label,
    type:        ct.type,
  }))
);

const LEARNING_PATHS: { id: string; title: string; courses: number; duration: string; enrolled: number; badge: string; color: string; accent: string }[] = RECYCLING_CATEGORIES.map(cat => ({
  id:       cat.id,
  title:    `${cat.label} — Complete Business Path`,
  courses:  3,
  duration: cat.duration,
  enrolled: cat.enrolled,
  badge:    cat.badge,
  color:    cat.color,
  accent:   cat.accent,
}));

const TYPE_STYLE: Record<CourseType, { bg: string; text: string; dot: string }> = {
  Workshop:      { bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  Certification: { bg: 'bg-amber-500/15',   text: 'text-amber-300',   dot: 'bg-amber-400'   },
  Mastery:       { bg: 'bg-violet-500/15',  text: 'text-violet-300',  dot: 'bg-violet-400'  },
};

export default function LMSPage() {
  const router = useRouter();
  const [tab,        setTab]        = useState<'courses' | 'paths' | 'content'>('courses');
  const [typeFilter, setTypeFilter] = useState<'All' | CourseType>('All');
  const [catFilter,  setCatFilter]  = useState<string>('All');

  const uniqueCategories = Array.from(new Set(COURSES.map(c => c.category)));
  const filtered = COURSES.filter(c =>
    (typeFilter === 'All' || c.type === typeFilter) &&
    (catFilter  === 'All' || c.category === catFilter)
  );

  const totalEnrolled = COURSES.reduce((s, c) => s + c.enrolled, 0);
  const avgCompletion = Math.round(COURSES.reduce((s, c) => s + c.completion, 0) / COURSES.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Recycler Learning Hub</h1>
          <p className="mt-0.5 text-sm text-slate-500">Exclusive courses for recyclers — Launch, Run & Scale your recycling business</p>
        </div>
        <button onClick={() => router.push('/academy/content')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          + Create Course
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Courses',    value: COURSES.length,     color: 'text-indigo-400',  accent: 'bg-indigo-500'  },
          { label: 'Total Enrolled',   value: totalEnrolled,      color: 'text-emerald-400', accent: 'bg-emerald-500' },
          { label: 'Avg Completion',   value: `${avgCompletion}%`, color: 'text-amber-400',   accent: 'bg-amber-500'   },
          { label: 'Learning Paths',   value: LEARNING_PATHS.length, color: 'text-violet-400', accent: 'bg-violet-500' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
            <div className={`h-8 w-1 shrink-0 rounded-full ${m.accent}`} />
            <div>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Course type legend */}
      <div className="flex flex-wrap gap-3">
        {(['Workshop', 'Certification', 'Mastery'] as const).map(t => {
          const s = TYPE_STYLE[t];
          const desc = t === 'Workshop' ? 'Beginner — awareness & orientation' : t === 'Certification' ? 'Intermediate — in-depth certification' : 'Advanced — consulting-level mastery';
          return (
            <div key={t} className={`flex items-center gap-2 rounded-lg border border-slate-800/60 px-3 py-2 ${s.bg}`}>
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className={`text-xs font-bold ${s.text}`}>{t}</span>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800/60 px-3 py-2 bg-indigo-500/10">
          <span className="text-[10px] text-indigo-300 font-medium">Each course covers</span>
          {(['Launch', 'Run', 'Scale'] as const).map(s => (
            <span key={s} className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300">{s}</span>
          ))}
        </div>
      </div>

      <div className="flex rounded-lg border border-slate-700 overflow-hidden w-fit">
        {([['courses', 'Courses'], ['paths', 'Learning Paths'], ['content', 'Content Library']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-xs font-medium transition ${tab === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'courses' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] text-slate-500 mr-1">Filter:</span>
            {(['All', 'Workshop', 'Certification', 'Mastery'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition border ${typeFilter === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                {t}
              </button>
            ))}
            <span className="mx-1 text-slate-700">|</span>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="rounded-md border border-slate-700 bg-[#0c1022] px-2 py-1 text-[11px] text-slate-400 focus:outline-none">
              <option value="All">All Categories</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <span className="ml-auto text-[11px] text-slate-600">{filtered.length} courses</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c => {
              const ts = TYPE_STYLE[c.type];
              return (
                <div key={c.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-slate-800 text-slate-400 truncate max-w-[130px]">{c.category}</span>
                        <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${ts.bg} ${ts.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${ts.dot}`} />
                          {c.type}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-slate-200 leading-snug">{c.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">{c.description}</p>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold shrink-0 mt-0.5 ${c.level === 'Advanced' ? 'bg-rose-500/15 text-rose-300' : c.level === 'Intermediate' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                      {c.level}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[
                      { label: 'Modules', value: c.modules },
                      { label: 'Videos',  value: c.videos  },
                      { label: 'PDFs',    value: c.pdfs    },
                      { label: 'Quizzes', value: c.quizzes },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg border border-slate-800/60 py-1">
                        <p className="text-sm font-bold text-slate-200">{m.value}</p>
                        <p className="text-[9px] text-slate-600">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">{c.enrolled} enrolled</span>
                      <span className="text-[11px] font-semibold text-indigo-400">{c.completion}% completed</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.completion}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/academy/content/${c.id}`)} className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">Edit</button>
                    <button onClick={() => router.push(`/academy/content/${c.id}`)} className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">View</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'paths' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LEARNING_PATHS.map(lp => (
            <div key={lp.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 hover:border-slate-700 transition">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${lp.accent} bg-opacity-20`}>
                  <svg viewBox="0 0 24 24" className={`h-6 w-6 ${lp.color}`} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 leading-snug">{lp.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lp.courses} courses · {lp.duration} · {lp.enrolled} enrolled</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(['Workshop', 'Certification', 'Mastery'] as const).map(t => {
                      const s = TYPE_STYLE[t];
                      return (
                        <span key={t} className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${s.bg} ${s.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {t}
                        </span>
                      );
                    })}
                    <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-violet-500/15 text-violet-300">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      {lp.badge}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => router.push(`/academy/content/${lp.id}`)} className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">Edit</button>
                <button onClick={() => router.push(`/academy/content/${lp.id}`)} className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">View Path</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'content' && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-8 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <p className="mt-3 text-sm font-semibold text-slate-400">Content Library</p>
          <p className="mt-1 text-xs text-slate-600">Upload videos, PDFs, presentations, and assessments</p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => router.push('/academy/content/resources')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">Upload Content</button>
            <button onClick={() => router.push('/academy/ai/content')} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">AI Generate</button>
          </div>
        </div>
      )}
    </div>
  );
}
