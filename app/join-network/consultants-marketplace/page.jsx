'use client';

import Link from 'next/link';
import { motion, useInView, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  CheckCircle, ArrowRight, Users, Star, Search, ShieldCheck,
  FileText, TrendingUp, Building2, UserCheck, Zap, Award,
  ChevronRight, MapPin, Briefcase, Globe,
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────── */
const STATS = [
  { value: '200+', label: 'Verified Consultants', icon: Users,      glow: '#07875f' },
  { value: '6',    label: 'Waste Categories',      icon: Briefcase,  glow: '#78c943' },
  { value: '500+', label: 'PIBOs Seeking Help',    icon: Building2,  glow: '#27ceb8' },
  { value: '28',   label: 'States Covered',        icon: MapPin,     glow: '#a78bfa' },
];

const BULLETS = [
  'Filter by waste category: Plastic, E-Waste, Battery, Tyre, ELV, Used Oil',
  'View consultant credentials, experience and past client work',
  'Request a consultation directly from the platform',
  'Consultants verified by our EPR compliance team',
];

const STEPS = [
  { num: '01', icon: Search,     title: 'Search or List',     desc: 'Seekers enter category and state. Consultants submit their profile for admin review.' },
  { num: '02', icon: Star,       title: 'Browse & Shortlist', desc: 'Filter by specialisation, location, experience. Review credentials and bio in detail.' },
  { num: '03', icon: CheckCircle,title: 'Connect & Engage',   desc: 'Request a consultation directly. Consultants respond within 48 hours — guaranteed.' },
];

const WHY_LIST = [
  { icon: Users,      text: 'Access 500+ companies actively seeking EPR compliance help' },
  { icon: Award,      text: 'CEPC-certified consultants earn 30% more per engagement' },
  { icon: Star,       text: 'Featured placement for top-rated consultants' },
  { icon: ShieldCheck,text: 'Integration with our client portal for seamless engagement' },
];

/* ─── Floating consultant cards data ─────────────────────────────── */
const FLOAT_CARDS = [
  { name: 'Priya Sharma', role: 'Plastic Waste EPR', exp: '8 yrs', rating: 4.9, state: 'Maharashtra', color: '#07875f' },
  { name: 'Rakesh Nair',  role: 'E-Waste & Battery', exp: '11 yrs',rating: 4.8, state: 'Karnataka',   color: '#78c943' },
  { name: 'Anjali Mehta', role: 'Tyre & Used Oil',   exp: '6 yrs', rating: 4.7, state: 'Gujarat',     color: '#27ceb8' },
];

/* ─── Animation helpers ─────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const riseUp  = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } };
const fadeIn  = { hidden: { opacity: 0 },         visible: { opacity: 1, transition: { duration: 0.5 } } };

function InView({ children, className = '', delay = 0, once = true }) {
  const ref  = useRef(null);
  const inV  = useInView(ref, { once, margin: '-72px' });
  return (
    <motion.div ref={ref} initial="hidden"
      animate={inV ? 'visible' : 'hidden'}
      variants={{ hidden:{opacity:0,y:24}, visible:{opacity:1,y:0,transition:{duration:0.65,delay,ease}} }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Dot grid SVG ──────────────────────────────────────────────── */
function DotGrid({ color = '#78c943', opacity = 0.15 }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity }}>
      <defs>
        <pattern id={`dp-${color.replace('#','')}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dp-${color.replace('#','')})`} />
    </svg>
  );
}

/* ─── Grain overlay ─────────────────────────────────────────────── */
function Grain() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]">
      <filter id="grain-cm"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#grain-cm)" />
    </svg>
  );
}

/* ─── Floating consultant preview card ───────────────────────────── */
function FloatCard({ card, delay, floatY, floatDur, x, y }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease }}
      style={{ position: 'absolute', left: x, top: y }}
    >
      <motion.div
        animate={{ y: floatY }}
        transition={{ duration: floatDur, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-md shadow-2xl min-w-[190px]"
        style={{ boxShadow: `0 8px 40px ${card.color}22` }}
      >
        {/* Avatar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, ${card.color}, #032f3a)` }}>
            {card.name[0]}
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">{card.name}</p>
            <p className="text-[10px] text-white/50">{card.state}</p>
          </div>
        </div>
        {/* Role tag */}
        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mb-2"
          style={{ background: `${card.color}22`, color: card.color }}>
          {card.role}
        </span>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-white/40">{card.exp} exp</span>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
            <Star className="h-2.5 w-2.5 fill-amber-400" />{card.rating}
          </span>
        </div>
        {/* Verified dot */}
        <div className="mt-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-semibold">Verified</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Tilt card wrapper ──────────────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const x   = useMotionValue(0);
  const y   = useMotionValue(0);
  const rx  = useTransform(y, [-40, 40], [6, -6]);
  const ry  = useTransform(x, [-40, 40], [-6, 6]);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top  - rect.height / 2);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={reset}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function ConsultantsMarketplacePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5faf7]">

      {/* ════════════════════════════════════════════════════════
          HERO — ultra-premium dark
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center"
        style={{ background: 'linear-gradient(145deg, #020f15 0%, #032f3a 40%, #041c10 100%)' }}>

        <DotGrid />
        <Grain />

        {/* Geometric ring art */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {[520, 380, 260, 160].map((size, i) => (
            <motion.div key={size}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 40 + i * 15, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full border"
              style={{ width: size, height: size, borderColor: `rgba(120,201,67,${0.04 + i * 0.03})` }}>
              {/* dot on ring */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                style={{ background: i % 2 === 0 ? '#78c943' : '#07875f', boxShadow: `0 0 8px ${i % 2 === 0 ? '#78c943' : '#07875f'}` }} />
            </motion.div>
          ))}
        </div>

        {/* Radial glow spotlights */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div animate={{ scale:[1,1.2,1], opacity:[0.5,0.8,0.5] }}
            transition={{ duration:9, repeat:Infinity, ease:'easeInOut' }}
            className="absolute -top-48 -left-24 h-[600px] w-[600px] rounded-full"
            style={{ background:'radial-gradient(circle, rgba(7,135,95,0.35) 0%, transparent 65%)' }} />
          <motion.div animate={{ scale:[1,1.15,1], opacity:[0.3,0.6,0.3] }}
            transition={{ duration:13, repeat:Infinity, ease:'easeInOut', delay:4 }}
            className="absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full"
            style={{ background:'radial-gradient(circle, rgba(120,201,67,0.2) 0%, transparent 65%)' }} />
          <motion.div animate={{ scale:[1,1.1,1], x:[0,30,0], y:[0,-20,0] }}
            transition={{ duration:16, repeat:Infinity, ease:'easeInOut', delay:7 }}
            className="absolute top-1/2 right-1/4 h-72 w-72 rounded-full"
            style={{ background:'radial-gradient(circle, rgba(39,206,184,0.1) 0%, transparent 65%)' }} />
        </div>

        {/* Scan line */}
        <motion.div animate={{ y:['-100%','120%'] }}
          transition={{ duration:6, repeat:Infinity, ease:'linear', repeatDelay:5 }}
          className="pointer-events-none absolute left-0 right-0 h-px opacity-15"
          style={{ background:'linear-gradient(90deg, transparent, #78c943 40%, #07875f 60%, transparent)' }} />

        {/* ── Hero Content ── */}
        <div className="relative w-full max-w-7xl mx-auto px-6 py-24 lg:py-32">
          {/* Breadcrumb */}
          <motion.nav initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
            className="mb-10">
            <ol className="flex items-center gap-1.5 text-xs text-white/35">
              <li><Link href="/" className="hover:text-white/60 transition-colors">Home</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li><Link href="/join-network" className="hover:text-white/60 transition-colors">Join Network</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="text-white/60 font-medium">Consultants Marketplace</li>
            </ol>
          </motion.nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-16 items-center">

            {/* Left */}
            <div>
              <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#78c943]/30 bg-[#78c943]/10 px-4 py-1.5 backdrop-blur-sm mb-6">
                <Search className="h-3.5 w-3.5 text-[#78c943]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78c943]">EPR Marketplace · Consultants</span>
              </motion.div>

              <motion.h1 initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.7, delay:0.2 }}
                className="text-4xl lg:text-[3.2rem] font-extrabold text-white leading-[1.08] tracking-tight">
                Find the Right EPR Expert —{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-[#78c943] via-[#27ceb8] to-[#07875f] bg-clip-text text-transparent">
                    Matched to Your Category
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="5" viewBox="0 0 400 5" preserveAspectRatio="none">
                    <path d="M0 3 Q100 0 200 3 Q300 6 400 3" stroke="#78c943" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.6, delay:0.34 }}
                className="mt-5 max-w-lg text-base leading-relaxed text-white/55">
                India's largest directory of vetted EPR compliance consultants. Find specialists for
                CPCB registration, annual returns, target management and credit trading — by
                category and state.
              </motion.p>

              {/* Bullet list */}
              <motion.ul initial="hidden" animate="visible"
                variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.1, delayChildren:0.5 }} }}
                className="mt-6 space-y-2.5">
                {BULLETS.map(pt => (
                  <motion.li key={pt} variants={riseUp}
                    className="flex items-start gap-3 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#78c943] shrink-0 mt-0.5" />
                    {pt}
                  </motion.li>
                ))}
              </motion.ul>

              {/* CTAs */}
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.7 }}
                className="mt-8 flex flex-wrap gap-3">
                <Link href="/join-network/consultants-marketplace/listing"
                  className="group relative overflow-hidden inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#07875f] to-[#056c4c] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#07875f]/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#07875f]/40">
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Browse Consultants
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/join-network/register/consultant"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/6 px-7 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/12 hover:-translate-y-0.5">
                  List Your Consultancy
                </Link>
              </motion.div>
            </div>

            {/* Right — floating cards + stat grid */}
            <div className="hidden lg:block">
              {/* Floating cards */}
              <div className="relative h-[480px]">
                {/* Center glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full"
                  style={{ background:'radial-gradient(circle, rgba(7,135,95,0.3), transparent 70%)' }} />

                {/* Central badge */}
                <motion.div animate={{ y:[-6,6,-6] }} transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                    flex flex-col items-center justify-center h-36 w-36 rounded-full border border-[#78c943]/40
                    bg-[#07875f]/20 backdrop-blur-sm text-center shadow-2xl"
                  style={{ boxShadow:'0 0 60px rgba(7,135,95,0.4)' }}>
                  <Globe className="h-7 w-7 text-[#78c943] mb-1" />
                  <p className="text-white font-extrabold text-lg leading-tight">200+</p>
                  <p className="text-white/50 text-[10px] leading-tight">Experts<br/>Nationwide</p>
                </motion.div>

                {/* Floating consultant cards */}
                <FloatCard card={FLOAT_CARDS[0]} delay={0.5} floatY={[-8,8]} floatDur={4.5} x="0%"    y="6%" />
                <FloatCard card={FLOAT_CARDS[1]} delay={0.7} floatY={[6,-6]} floatDur={5.5} x="45%"   y="62%" />
                <FloatCard card={FLOAT_CARDS[2]} delay={0.9} floatY={[-5,9]} floatDur={5}   x="52%"   y="5%" />

                {/* Connecting lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <line x1="25%" y1="20%" x2="50%" y2="50%" stroke="#78c943" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="75%" y1="18%" x2="50%" y2="50%" stroke="#07875f" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="58%" y1="75%" x2="50%" y2="50%" stroke="#27ceb8" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
              </div>

              {/* Stat pills below */}
              <motion.div initial="hidden" animate="visible"
                variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.1, delayChildren:0.6 }} }}
                className="grid grid-cols-4 gap-2 mt-2">
                {STATS.map(({ value, label, icon: Icon, glow }) => (
                  <motion.div key={label} variants={riseUp}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
                    <div className="absolute -top-3 -right-3 h-10 w-10 rounded-full blur-lg opacity-40"
                      style={{ background: glow }} />
                    <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: glow }} />
                    <div className="text-lg font-extrabold text-white">{value}</div>
                    <div className="text-[9px] text-white/40 leading-tight">{label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom border shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background:'linear-gradient(90deg, transparent, rgba(120,201,67,0.5) 30%, rgba(7,135,95,0.7) 50%, rgba(120,201,67,0.5) 70%, transparent)' }} />
      </section>

      {/* ════════════════════════════════════════════════════════
          TWO WAYS — tilt cards
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#f5faf7]">
        <div className="max-w-7xl mx-auto px-6">
          <InView className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#07875f] mb-2">Marketplace</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#032f3a]">Two Ways to Use This Platform</h2>
            <p className="mt-3 text-[#607279] max-w-xl mx-auto text-sm leading-relaxed">
              Whether you need EPR expertise or offer it — this is where India's compliance work gets matched.
            </p>
          </InView>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Card 1 — Companies */}
            <InView delay={0.05}>
              <TiltCard className="h-full">
                <div className="group relative overflow-hidden rounded-3xl border border-[#dfe9e4] bg-white p-8 h-full shadow-sm hover:shadow-xl hover:shadow-[#032f3a]/8 transition-all duration-400">
                  {/* BG gradient on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background:'linear-gradient(135deg, rgba(3,47,58,0.03) 0%, transparent 60%)' }} />
                  {/* Top bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-[#032f3a] to-[#07875f] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#032f3a] to-[#07875f] flex items-center justify-center shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <span className="rounded-full bg-[#032f3a]/8 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#032f3a]">
                        For Companies
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#102c32] mb-3">You Need EPR Help</h3>
                    <p className="text-[#607279] text-sm leading-relaxed mb-5">
                      Search by waste category, state and budget. Review consultant credentials, years
                      of experience and past client work. Shortlist and request a consultation directly
                      — no cold calls, no middleman.
                    </p>
                    <Link href="/join-network/consultants-marketplace/listing"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#07875f] group/lnk transition-colors hover:text-[#056c4c]">
                      Browse Consultants <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/lnk:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </InView>

            {/* Card 2 — Consultants */}
            <InView delay={0.15}>
              <TiltCard className="h-full">
                <div className="group relative overflow-hidden rounded-3xl border border-[#dfe9e4] bg-white p-8 h-full shadow-sm hover:shadow-xl hover:shadow-[#07875f]/10 transition-all duration-400">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background:'linear-gradient(135deg, rgba(7,135,95,0.04) 0%, transparent 60%)' }} />
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-[#07875f] to-[#78c943] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#07875f] to-[#78c943] flex items-center justify-center shadow-lg">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                      <span className="rounded-full bg-[#07875f]/8 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#07875f]">
                        For Consultants
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#102c32] mb-3">List & Get Discovered</h3>
                    <p className="text-[#607279] text-sm leading-relaxed mb-5">
                      List your profile and get discovered by companies searching your categories.
                      Build a continuous pipeline of inbound enquiries — without cold calling or
                      expensive ads.
                    </p>
                    <Link href="/join-network/register/consultant"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#07875f] group/lnk transition-colors hover:text-[#056c4c]">
                      List Your Consultancy <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/lnk:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </InView>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS — dark with steps
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24"
        style={{ background:'linear-gradient(135deg, #021d24 0%, #032f3a 55%, #042a1f 100%)' }}>
        <DotGrid opacity={0.1} />
        <Grain />

        {/* Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-72 w-[600px] rounded-full opacity-25"
          style={{ background:'radial-gradient(ellipse, rgba(7,135,95,0.5), transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <InView className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#78c943] mb-2">Process</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">How It Works</h2>
            <p className="mt-3 text-white/45 text-sm max-w-md mx-auto leading-relaxed">
              From first search to signed engagement in three straightforward steps.
            </p>
          </InView>

          <motion.div ref={useRef(null)}
            initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={step.num} variants={riseUp} className="relative">
                {/* Connector arrow */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute top-10 left-[calc(100%+4px)] w-8 items-center justify-center z-10">
                    <div className="w-full border-t-2 border-dashed border-[#78c943]/25" />
                    <ChevronRight className="h-3 w-3 text-[#78c943]/30 -ml-1 shrink-0" />
                  </div>
                )}

                <TiltCard>
                  <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-7 h-full backdrop-blur-sm hover:bg-white/8 hover:border-white/15 transition-all duration-300">
                    {/* Glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{ background:'radial-gradient(circle at 30% 30%, rgba(120,201,67,0.07), transparent 70%)' }} />

                    <div className="relative">
                      {/* Step num + icon */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#07875f] to-[#78c943] shadow-lg shadow-[#07875f]/30">
                          <step.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-4xl font-black text-white/10 leading-none">{step.num}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-white mb-2">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-white/45">{step.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background:'linear-gradient(90deg, transparent, rgba(120,201,67,0.4) 50%, transparent)' }} />
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY LIST — light
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#f5faf7]">
        <div className="max-w-5xl mx-auto px-6">
          <InView className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#07875f] mb-2">For Consultants</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#032f3a]">Why List Your Consultancy Here</h2>
            <p className="mt-3 text-[#607279] text-sm max-w-xl mx-auto leading-relaxed">
              India's EPR compliance market is growing fast. Get in front of the right clients before your competition does.
            </p>
          </InView>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true, margin:'-60px' }}
            variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {WHY_LIST.map(({ icon: Icon, text }, i) => (
              <motion.div key={text} variants={riseUp}
                className="group flex items-start gap-4 rounded-2xl border border-[#dfe9e4] bg-white p-5 shadow-sm hover:shadow-lg hover:shadow-[#07875f]/8 hover:-translate-y-1 hover:border-[#07875f]/25 transition-all duration-300">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#eef7f2] to-[#dff0e6] shadow-sm group-hover:from-[#07875f] group-hover:to-[#056c4c] transition-all duration-300">
                  <Icon className="h-5 w-5 text-[#07875f] group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="text-sm leading-relaxed text-[#607279] pt-1">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BOTTOM CTA — ultra-premium dark
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24"
        style={{ background:'linear-gradient(145deg, #020f15 0%, #032f3a 45%, #041c10 100%)' }}>
        <DotGrid opacity={0.12} />
        <Grain />

        {/* Rings */}
        {[300, 220, 140].map((size, i) => (
          <motion.div key={size}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration:35 + i*10, repeat:Infinity, ease:'linear' }}
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ width:size, height:size, borderColor:`rgba(120,201,67,${0.06 + i*0.04})` }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
              style={{ background:'#78c943', boxShadow:'0 0 8px #78c943' }} />
          </motion.div>
        ))}

        {/* Glow */}
        <motion.div animate={{ scale:[1,1.1,1], opacity:[0.4,0.7,0.4] }}
          transition={{ duration:8, repeat:Infinity, ease:'easeInOut' }}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full"
          style={{ background:'radial-gradient(circle, rgba(7,135,95,0.3), transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto text-center px-6">
          <InView>
            <motion.div animate={{ y:[-4,4,-4] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl border border-[#78c943]/30 bg-[#78c943]/10 mx-auto mb-6 backdrop-blur-sm">
              <Users className="h-7 w-7 text-[#78c943]" />
            </motion.div>

            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
              Find Your EPR Consultant{' '}
              <span className="bg-gradient-to-r from-[#78c943] to-[#27ceb8] bg-clip-text text-transparent">Today</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              200+ verified consultants across 6 waste categories and 28 states. Search free, connect directly.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/join-network/consultants-marketplace/listing"
                className="group relative overflow-hidden inline-flex items-center gap-2 rounded-xl bg-[#78c943] px-8 py-3.5 text-sm font-extrabold text-[#032f3a] shadow-lg shadow-[#78c943]/20 transition-all hover:brightness-110 hover:-translate-y-0.5">
                <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />
                Browse All Consultants
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/join-network/register/consultant"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/6 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/12 hover:-translate-y-0.5">
                Register as Consultant
              </Link>
            </div>
          </InView>
        </div>
      </section>

    </div>
  );
}
