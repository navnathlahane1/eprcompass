'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  ArrowRight, ShieldCheck, TrendingUp, AlertTriangle,
  Zap, ChevronRight, MessageCircle, Layers, Target, BarChart3,
} from 'lucide-react';
import { industryPages } from './industryContent';

/* ─── Status config ─────────────────────────────────────────────── */
const statusConfig = {
  active:     { label: 'Active',     dot: '#34d399', pill: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30' },
  emerging:   { label: 'Emerging',   dot: '#fbbf24', pill: 'bg-amber-500/10   text-amber-300   ring-1 ring-amber-500/30'   },
  developing: { label: 'Developing', dot: '#60a5fa', pill: 'bg-blue-500/10    text-blue-300    ring-1 ring-blue-500/30'    },
};

/* ─── Industry emoji map ────────────────────────────────────────── */
const industryIcons = {
  'fmcg-consumer-brands': '🛒', 'ecommerce-retail': '📦', 'electronics-eee': '💻',
  'battery-producers-importers': '🔋', 'tyre-manufacturers-importers': '🔧',
  'used-oil-lubricants': '🛢️', 'automotive-oem-elv': '🚗',
  'construction-non-ferrous': '🏗️', 'pharmaceuticals-healthcare': '💊',
  'cosmetics-personal-care': '✨', 'food-beverage-processing': '🍃',
  'textiles-apparel-footwear': '👕', 'white-goods-home-appliances': '🏠',
  'telecom-it-hardware': '📡', 'solar-renewable-energy-equipment': '☀️',
  'chemicals-industrial-manufacturing': '⚗️', 'packaging-converters-manufacturers': '📋',
  'hospitality-institutional-procurement': '🏨',
};

/* ─── Animation helpers ─────────────────────────────────────────── */
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const riseCard = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] } }),
};

function InView({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, margin: '-72px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={visible ? 'visible' : 'hidden'}
      custom={delay} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Classy SVG dot-grid background ─────────────────────────────── */
function DotGrid() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="#78c943" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

/* ─── Grain texture overlay ─────────────────────────────────────── */
function Grain() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}

/* ─── Pillar card (on light section) ────────────────────────────── */
function PillarCard({ icon: Icon, gradient, title, body, delay }) {
  return (
    <InView delay={delay}>
      <div className="group relative flex flex-col gap-3 rounded-2xl border border-[#dfe9e4]/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#07875f]/8 overflow-hidden">
        {/* subtle inner glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(7,135,95,0.04), transparent 70%)' }} />
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-bold text-[#102c32]">{title}</p>
        <p className="text-xs leading-relaxed text-[#607279]">{body}</p>
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#07875f] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      </div>
    </InView>
  );
}

/* ─── Industry card (on light section) ─────────────────────────── */
function IndustryCard({ industry }) {
  const st = statusConfig[industry.status] ?? statusConfig.emerging;
  const icon = industryIcons[industry.slug] ?? '🏭';
  return (
    <motion.article variants={riseCard} whileHover={{ y: -5, transition: { duration: 0.25 } }}
      className="group relative flex flex-col rounded-2xl border border-[#dfe9e4] bg-white shadow-sm hover:shadow-xl hover:shadow-[#07875f]/10 hover:border-[#07875f]/30 transition-all duration-300 overflow-hidden">
      {/* top gradient bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#07875f] via-[#78c943] to-[#07875f] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#eef7f2] to-[#dff0e6] text-xl shadow-sm">
              {icon}
            </div>
            <h2 className="text-sm font-bold leading-snug text-[#102c32]">{industry.title}</h2>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${st.pill.replace('text-emerald-300','text-emerald-700').replace('text-amber-300','text-amber-700').replace('text-blue-300','text-blue-700').replace('bg-emerald-500/10','bg-emerald-50').replace('bg-amber-500/10','bg-amber-50').replace('bg-blue-500/10','bg-blue-50').replace('ring-emerald-500/30','ring-emerald-200').replace('ring-amber-500/30','ring-amber-200').replace('ring-blue-500/30','ring-blue-200')}`}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: st.dot }} />
            {st.label}
          </span>
        </div>

        {/* Summary */}
        <p className="mt-3 text-xs leading-relaxed text-[#607279] line-clamp-3">{industry.summary}</p>

        {/* Streams */}
        <ul className="mt-4 space-y-1.5">
          {industry.streams.slice(0, 3).map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-xs text-[#102c32]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#07875f]" />
              {s.name}
            </li>
          ))}
        </ul>

        <div className="flex-1" />
        <div className="mt-4 border-t border-[#dfe9e4]" />

        <Link href={`/industries/${industry.slug}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#032f3a] transition-colors hover:text-[#07875f] group/lnk">
          See applicability &amp; action plan
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/lnk:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function IndustriesHubPage() {
  const gridRef = useRef(null);
  const gridInView = useInView(gridRef, { once: true, margin: '-60px' });
  const activeCount   = industryPages.filter(i => i.status === 'active').length;
  const emergingCount = industryPages.filter(i => i.status === 'emerging').length;

  return (
    <main className="bg-[#f5faf7] text-[#102c32]">

      {/* ═══════════════════════════════════════════════════════
          HERO — deep navy, premium dark background
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #021d24 0%, #032f3a 45%, #042a1f 100%)' }}>

        {/* Dot grid */}
        <DotGrid />

        {/* Grain */}
        <Grain />

        {/* Geometric lines — top-left corner */}
        <svg className="pointer-events-none absolute top-0 left-0 w-96 h-96 opacity-10" viewBox="0 0 400 400" fill="none">
          <line x1="0" y1="200" x2="400" y2="200" stroke="#78c943" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="200" y2="400" stroke="#78c943" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="120" stroke="#07875f" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="80"  stroke="#07875f" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="40"  stroke="#78c943" strokeWidth="1" />
        </svg>

        {/* Geometric lines — bottom-right */}
        <svg className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 opacity-10" viewBox="0 0 320 320" fill="none">
          <polygon points="160,20 300,300 20,300" stroke="#78c943" strokeWidth="0.5" fill="none" />
          <polygon points="160,60 260,280 60,280"  stroke="#07875f" strokeWidth="0.5" fill="none" />
          <polygon points="160,100 220,260 100,260" stroke="#78c943" strokeWidth="1" fill="none" />
        </svg>

        {/* Radial glow spotlights */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div animate={{ scale: [1,1.15,1], opacity:[0.6,0.9,0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-20 h-[520px] w-[520px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(7,135,95,0.35) 0%, transparent 70%)' }} />
          <motion.div animate={{ scale: [1,1.1,1], opacity:[0.4,0.7,0.4] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute -bottom-48 -right-24 h-[480px] w-[480px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(120,201,67,0.2) 0%, transparent 70%)' }} />
          <motion.div animate={{ scale: [1,1.08,1], x:[0,20,0], y:[0,-12,0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
            className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(39,206,184,0.12) 0%, transparent 70%)' }} />
        </div>

        {/* Horizontal scan line */}
        <motion.div
          animate={{ y: ['-100%', '120%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
          className="pointer-events-none absolute left-0 right-0 h-px opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent, #78c943 40%, #07875f 60%, transparent)' }}
        />

        {/* ── Hero Content ── */}
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">

          {/* Breadcrumb */}
          <motion.nav initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4 }} aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 text-xs text-white/40">
              <li><Link href="/" className="hover:text-white/70 transition-colors">Home</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="text-white/70 font-medium">Industries</li>
            </ol>
          </motion.nav>

          <div className="grid gap-14 lg:grid-cols-[1fr_420px] lg:items-center">

            {/* Left: headline */}
            <div>
              {/* Eyebrow chip */}
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#78c943]/30 bg-[#78c943]/10 px-4 py-1.5 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5 text-[#78c943]" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#78c943]">Industry Hub</span>
              </motion.div>

              {/* H1 */}
              <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.65, delay:0.22 }}
                className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                Know Where Your Industry Faces{' '}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10 bg-gradient-to-r from-[#78c943] via-[#27ceb8] to-[#07875f] bg-clip-text text-transparent">
                    EPR Risk
                  </span>
                  {/* underline squiggle */}
                  <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 300 6" preserveAspectRatio="none">
                    <path d="M0 4 Q75 0 150 4 Q225 8 300 4" stroke="#78c943" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.6, delay:0.36 }}
                className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
                Each page translates current EPR applicability into practical execution priorities —
                so your team can act fast, avoid filing surprises, and move from uncertainty to a
                documented compliance plan.
              </motion.p>

              {/* Pill tags */}
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.46 }}
                className="mt-5 flex flex-wrap gap-2">
                {['Industry-specific applicability','Priority action plan','Consultation-ready next steps'].map(t => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 backdrop-blur-sm">
                    {t}
                  </span>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.56 }}
                className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact?intent=industry-audit"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#07875f] to-[#056c4c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#07875f]/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#07875f]/40">
                  {/* shine */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Book Free Industry Audit
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/compliance-checklist"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5">
                  Run 2-Min Checklist
                </Link>
              </motion.div>
            </div>

            {/* Right: stat cards grid */}
            <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }}
              transition={{ duration:0.7, delay:0.3 }}
              className="grid grid-cols-2 gap-3">
              {[
                { val: industryPages.length, label: 'Industries Covered', sub: 'mapped & analysed', icon: Layers, glow: '#07875f' },
                { val: activeCount,          label: 'Active EPR Streams', sub: 'currently applicable', icon: Target, glow: '#34d399' },
                { val: emergingCount,        label: 'Emerging Sectors',   sub: 'prepare now',          icon: BarChart3, glow: '#fbbf24' },
                { val: '100%',               label: 'Filing Confidence',  sub: 'with our audit',       icon: ShieldCheck, glow: '#27ceb8' },
              ].map(({ val, label, sub, icon: Icon, glow }, i) => (
                <motion.div key={label}
                  initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
                  transition={{ duration:0.5, delay:0.4 + i*0.1 }}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:bg-white/8 hover:border-white/20">
                  <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full blur-xl opacity-40"
                    style={{ background: glow }} />
                  <Icon className="h-5 w-5 mb-3" style={{ color: glow }} />
                  <div className="text-2xl font-extrabold text-white">{val}</div>
                  <div className="mt-0.5 text-xs font-semibold text-white/70">{label}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom border shimmer */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(120,201,67,0.4) 30%, rgba(7,135,95,0.6) 50%, rgba(120,201,67,0.4) 70%, transparent)' }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PILLARS
      ═══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PillarCard icon={ShieldCheck} gradient="from-[#07875f] to-[#056c4c]"
            title="Role-Based Clarity"
            body="Understand exactly what changes when you operate as producer, importer, brand owner, or channel operator."
            delay={0} />
          <PillarCard icon={TrendingUp}  gradient="from-[#032f3a] to-[#073541]"
            title="Priority Sequencing"
            body="Focus first on streams where delay creates the highest penalty and operational exposure."
            delay={0.1} />
          <PillarCard icon={AlertTriangle} gradient="from-amber-500 to-orange-500"
            title="Decision Confidence"
            body="Reduce internal confusion by aligning legal scope, data ownership, and execution cadence."
            delay={0.2} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          INDUSTRIES GRID
      ═══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Section header */}
        <InView className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#07875f]">Browse by Sector</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#032f3a]">
              {industryPages.length} Industries Covered
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#607279]">
            {[['#34d399','Active'],['#fbbf24','Emerging'],['#60a5fa','Developing']].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background:c }} />{l}
              </span>
            ))}
          </div>
        </InView>

        {/* Cards */}
        <motion.div ref={gridRef}
          initial="hidden" animate={gridInView ? 'visible' : 'hidden'} variants={stagger}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {industryPages.map(ind => <IndustryCard key={ind.slug} industry={ind} />)}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA BAND — dark premium
      ═══════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <InView>
          <div className="relative overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #021d24 0%, #032f3a 50%, #042a1f 100%)' }}>

            {/* BG patterns */}
            <DotGrid />
            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(120,201,67,0.3), transparent 70%)' }} />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(7,135,95,0.4), transparent 70%)' }} />

            <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm">
                  <MessageCircle className="h-6 w-6 text-[#78c943]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Need A Clear Yes/No On Applicability?</h2>
                  <p className="mt-1 max-w-md text-sm text-white/55">
                    Share your product mix and business role. We'll map applicable streams and
                    recommend a practical execution sequence.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <a href="/contact"
                  target="_blank" rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#78c943] px-5 py-2.5 text-sm font-extrabold text-[#032f3a] shadow-lg shadow-[#78c943]/20 transition-all hover:brightness-110 hover:-translate-y-0.5">
                  <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                  Talk To A Specialist
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <Link href="/get-matched"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:-translate-y-0.5">
                  Get Matched To A Plan
                </Link>
              </div>
            </div>
          </div>
        </InView>

        {/* Regulatory note */}
        <InView delay={0.1} className="mt-4">
          <div className="rounded-2xl border border-[#dfe9e4] bg-white/80 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs leading-relaxed text-[#607279]">
              <span className="font-semibold text-[#102c32]">Regulatory note: </span>
              Applicability can vary by product type, business role, annual quantities and
              state-level enforcement updates. Validate final scope with your legal or compliance
              advisor before filing decisions.
            </p>
          </div>
        </InView>
      </section>
    </main>
  );
}

