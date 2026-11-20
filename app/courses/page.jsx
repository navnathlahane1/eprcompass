'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, GraduationCap, BadgeCheck, TrendingUp, Users,
  Shield, Monitor, BookOpen, Briefcase, Star, ChevronRight, Filter,
} from 'lucide-react';
import { STANDALONE_WORKSHOPS }              from '@/app/trainings/workshop/data';
import { CAREER_PROGRAMMES }                 from '@/app/trainings/career/data';
import { EPR_CATEGORIES, EPR_COURSE_TYPES, buildEprSlug } from '@/app/trainings/epr-compliance/data';
import { RECYCLER_CATEGORIES, COURSE_TYPES as RECYCLER_TYPES, buildSlug as buildRecyclerSlug } from '@/app/trainings/recycler/data';

// ── Normalize all courses into one flat list ──────────────────────────────────
function buildAllCourses() {
  const courses = [];

  // 1. Academy Tiers
  courses.push(
    { id: 'tier-1', title: 'EPR Awareness Bootcamp', category: 'Academy', type: 'Tier 1', level: 'Beginner', price: '₹999', duration: '2 Days', href: '/courses/epr-awareness-bootcamp', desc: '2-day live online crash course on PWM Rules, EPR portal & credit trading', badge: 'bg-emerald-100 text-emerald-700', new: false },
    { id: 'tier-2', title: 'Certified EPR Professional (CEPC)', category: 'Academy', type: 'Tier 2', level: 'Intermediate', price: '₹5,000', duration: '12 Weeks', href: '/courses/cepc', desc: '12-week programme — consulting skills, client acquisition & CEPC credential', badge: 'bg-indigo-100 text-indigo-700', new: false },
    { id: 'tier-3', title: 'EPR Agency Leadership Programme (EALP)', category: 'Academy', type: 'Tier 3', level: 'Advanced', price: '₹50,000', duration: '6 Months', href: '/courses/ealp', desc: 'Build & scale your own EPR consulting agency — mentorship & live clients', badge: 'bg-amber-100 text-amber-700', new: false },
  );

  // 2. Free Standalone Workshops
  STANDALONE_WORKSHOPS.forEach(w => courses.push({
    id: 'ws-' + w.id,
    title: w.title,
    category: 'Workshop',
    type: 'Workshop',
    level: 'Beginner',
    price: 'Free',
    duration: w.duration,
    href: '/trainings/workshop/' + w.id,
    desc: w.subtitle,
    badge: 'bg-emerald-100 text-emerald-700',
    new: false,
  }));

  // 3. Career Programmes
  CAREER_PROGRAMMES.forEach(p => courses.push({
    id: 'career-' + p.id,
    title: p.title,
    category: 'Career',
    type: 'Career Programme',
    level: p.level,
    price: p.price,
    duration: p.duration,
    href: '/trainings/career/' + p.id,
    desc: p.tagline,
    badge: 'bg-teal-100 text-teal-700',
    new: false,
  }));

  // 4. EPR Compliance Courses (8 categories × 3 types = 24)
  EPR_CATEGORIES.forEach(cat => EPR_COURSE_TYPES.forEach(ct => {
    const slug = buildEprSlug(cat.id, ct.type);
    courses.push({
      id: 'epr-' + slug,
      title: cat.label + ' — ' + ct.type,
      category: 'EPR Compliance',
      type: ct.type,
      level: ct.level,
      price: ct.price,
      duration: ct.duration,
      href: '/trainings/epr-compliance/' + slug,
      desc: cat.shortDesc || cat.description || ('EPR compliance ' + ct.type.toLowerCase() + ' for ' + cat.label),
      badge: ct.type === 'Workshop' ? 'bg-emerald-100 text-emerald-700' : ct.type === 'Certification' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700',
      new: cat.isNew || false,
    });
  }));

  // 5. Recycler Courses (8 categories × 3 types = 24)
  RECYCLER_CATEGORIES.forEach(cat => RECYCLER_TYPES.forEach(ct => {
    const slug = buildRecyclerSlug(cat.id, ct.type.toLowerCase());
    courses.push({
      id: 'rec-' + slug,
      title: cat.label + ' — ' + ct.type,
      category: 'Recycler',
      type: ct.type,
      level: ct.level || ct.type,
      price: ct.price,
      duration: ct.duration,
      href: '/trainings/recycler/' + slug,
      desc: cat.shortDesc || ('Recycling business ' + ct.type.toLowerCase() + ' for ' + cat.label),
      badge: ct.type === 'Workshop' ? 'bg-emerald-100 text-emerald-700' : ct.type === 'Certification' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700',
      new: cat.isNew || false,
    });
  }));

  return courses;
}

const ALL_COURSES = buildAllCourses();

const CATEGORY_OPTIONS = ['All', 'Academy', 'Workshop', 'Career', 'EPR Compliance', 'Recycler'];
const LEVEL_OPTIONS    = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const TYPE_OPTIONS     = ['All', 'Tier 1', 'Tier 2', 'Tier 3', 'Workshop', 'Certification', 'Mastery', 'Career Programme'];

const CATEGORY_META = {
  Academy:        { color: 'text-indigo-600',  bg: 'bg-indigo-50',   icon: GraduationCap, label: 'Academy Tiers' },
  Workshop:       { color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: BookOpen,       label: 'Free Workshops' },
  Career:         { color: 'text-teal-600',    bg: 'bg-teal-50',     icon: Briefcase,      label: 'Career Programmes' },
  'EPR Compliance':{ color: 'text-amber-700',  bg: 'bg-amber-50',    icon: Shield,         label: 'EPR Compliance' },
  Recycler:       { color: 'text-violet-700',  bg: 'bg-violet-50',   icon: Monitor,        label: 'Recycler Courses' },
};

export default function CoursesPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [level,    setLevel]    = useState('All');
  const [type,     setType]     = useState('All');

  const filtered = useMemo(() => ALL_COURSES.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.title.toLowerCase().includes(q) && !c.desc.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q)) return false;
    if (category !== 'All' && c.category !== category) return false;
    if (level    !== 'All' && c.level    !== level)    return false;
    if (type     !== 'All' && c.type     !== type)     return false;
    return true;
  }), [search, category, level, type]);

  // Group by category for display
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(c => {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    });
    return map;
  }, [filtered]);

  const categoryOrder = ['Academy', 'Workshop', 'Career', 'EPR Compliance', 'Recycler'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-200 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <span className="inline-block bg-eco-green-4/10 text-eco-green-4 text-xs font-bold px-3 py-1 rounded-full border border-eco-green-4/20 mb-3">
                EPR ACADEMY — COURSE CATALOG
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">All Courses & Programmes</h1>
              <p className="mt-2 text-gray-500 text-sm max-w-2xl">
                {ALL_COURSES.length} courses across workshops, certifications and mastery programmes — for producers, consultants, recyclers and career-changers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const count = ALL_COURSES.filter(c => c.category === key).length;
                return (
                  <button key={key} onClick={() => setCategory(category === key ? 'All' : key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition ${category === key ? meta.bg + ' border-current ' + meta.color : 'bg-white border-gray-200 text-gray-600 hover:border-eco-green-4/40'}`}>
                    <Icon size={13} /> {meta.label} <span className="font-bold">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses by name, category or description…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eco-green-4/30 focus:border-eco-green-4" />
            </div>
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-eco-green-4/30">
              {LEVEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-eco-green-4/30">
              {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            {(search || category !== 'All' || level !== 'All' || type !== 'All') && (
              <button onClick={() => { setSearch(''); setCategory('All'); setLevel('All'); setType('All'); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition">
                Clear filters
              </button>
            )}
            <p className="self-center text-sm text-gray-500 ml-1">{filtered.length} courses</p>
          </div>
        </div>
      </section>

      {/* Course grid grouped by category */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No courses match your filters.</p>
            <button onClick={() => { setSearch(''); setCategory('All'); setLevel('All'); setType('All'); }}
              className="mt-4 text-sm text-eco-green-4 hover:underline">Clear all filters</button>
          </div>
        )}

        {categoryOrder.filter(cat => grouped[cat]?.length).map(cat => {
          const meta  = CATEGORY_META[cat];
          const Icon  = meta.icon;
          const items = grouped[cat];
          return (
            <section key={cat} id={cat.toLowerCase().replace(/\s+/g, '-')}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg p-2 ${meta.bg}`}>
                    <Icon size={18} className={meta.color} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{meta.label}</h2>
                    <p className="text-xs text-gray-500">{items.length} course{items.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {cat === 'EPR Compliance' && (
                  <Link href="/trainings#epr-compliance-courses" className="text-xs text-eco-green-4 hover:underline inline-flex items-center gap-1">
                    View full section <ChevronRight size={12} />
                  </Link>
                )}
                {cat === 'Recycler' && (
                  <Link href="/trainings#recycler-courses" className="text-xs text-eco-green-4 hover:underline inline-flex items-center gap-1">
                    View full section <ChevronRight size={12} />
                  </Link>
                )}
              </div>

              {/* Course cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(course => (
                  <Link key={course.id} href={course.href}
                    className="group flex flex-col bg-white rounded-xl border border-gray-200 hover:border-eco-green-4/50 hover:shadow-md transition-all duration-200 overflow-hidden">
                    {/* Top accent bar */}
                    <div className={`h-1 w-full ${
                      course.type === 'Workshop'      ? 'bg-emerald-400' :
                      course.type === 'Certification' ? 'bg-amber-400' :
                      course.type === 'Mastery'       ? 'bg-violet-500' :
                      course.type === 'Tier 1'        ? 'bg-emerald-500' :
                      course.type === 'Tier 2'        ? 'bg-indigo-500' :
                      course.type === 'Tier 3'        ? 'bg-amber-500' :
                      course.type === 'Career Programme' ? 'bg-teal-500' : 'bg-eco-green-4'
                    }`} />
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${course.badge}`}>{course.type}</span>
                        {course.new && <span className="rounded-full bg-rose-100 text-rose-600 px-2 py-0.5 text-[9px] font-bold">NEW</span>}
                      </div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-eco-green-4 transition-colors leading-snug line-clamp-2">
                        {course.title}
                      </p>
                      <p className="text-[11px] text-gray-500 leading-snug line-clamp-2 flex-1">{course.desc}</p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mt-1">
                        <span>{course.duration}</span>
                        <span>·</span>
                        <span>{course.level}</span>
                        <span className="ml-auto font-bold text-gray-700">{course.price}</span>
                      </div>
                    </div>
                    <div className="px-4 pb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-eco-green-4 group-hover:underline">
                        View course <ChevronRight size={11} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <section className="bg-eco-green-4 py-12 px-4 text-center text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Not sure where to start?</h2>
          <p className="text-white/80 mb-6 text-sm">Start with the free EPR Awareness Bootcamp or talk to our team to get matched to the right course.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/courses/epr-awareness-bootcamp" className="rounded-xl bg-white text-eco-green-4 font-bold px-6 py-3 text-sm hover:bg-gray-100 transition">
              Start Free — Tier 1 Bootcamp →
            </Link>
            <a href="/contact" target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-white text-white font-semibold px-6 py-3 text-sm hover:bg-eco-green-5 transition">
              Talk to Our Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

