"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion, useInView, useMotionValue, useSpring, useTransform, useScroll, animate,
} from "framer-motion";
import {
  ArrowRight, Globe2, Handshake, HeartHandshake, Leaf, Lightbulb, Recycle,
  ShieldCheck, Target, Users, ChevronRight, Sparkles,
  Briefcase, Truck, Factory, Coins, Landmark,
} from "lucide-react";

/* ─── Content ────────────────────────────────────────────────────── */
const stats = [
  [Users, "25+", "Countries Covered"],
  [Globe2, "50+", "EPR Categories"],
  [ShieldCheck, "Thousands+", "Businesses Served"],
  [Recycle, "1,000+", "Authorized Recyclers & Partners"],
  [Leaf, "Real Impact", "Driving a Sustainable Future"],
];
const values = [
  [ShieldCheck, "Integrity", "We operate with honesty, transparency and accountability."],
  [HeartHandshake, "Customer First", "Our clients’ success is at the core of everything we do."],
  [Leaf, "Sustainability", "We are committed to building solutions that protect our planet."],
  [Lightbulb, "Innovation", "We leverage technology and data to simplify EPR for everyone."],
  [Handshake, "Collaboration", "We grow together with our partners, clients and ecosystem."],
];
const ecosystemPartners = [
  [Briefcase, "Consultants & Advisors"],
  [Recycle, "Recyclers & Aggregators"],
  [Factory, "Waste Processors"],
  [Coins, "Credit Providers"],
  [Landmark, "Regulators & Authorities"],
  [Truck, "Logistics & Collectors"],
];
const ease = [0.22, 1, 0.36, 1];

function InView({ children, className = "", delay = 0, y = 24 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function TiltCard({ children, className = "", max = 8 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 20 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const match = value.match(/^([\d,]+)(.*)$/);
  const target = match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
  const suffix = match ? match[2] : "";
  const [display, setDisplay] = useState(target !== null ? "0" + suffix : value);

  useEffect(() => {
    if (!inView || target === null) return;
    const controls = animate(0, target, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString("en-IN") + suffix),
    });
    return () => controls.stop();
  }, [inView, target, suffix]);

  return <span ref={ref}>{display}</span>;
}

/* ─── CSS-driven 3D rotating globe (guaranteed smooth, no framer cancel) ── */
function RotatingGlobe3D() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]">
      <style jsx>{`
        @keyframes epr-spin-y {
          from { transform: rotateY(0deg) rotateX(15deg); }
          to   { transform: rotateY(360deg) rotateX(15deg); }
        }
        @keyframes epr-spin-ring-1 {
          from { transform: rotateX(70deg) rotateY(0deg) rotateZ(0deg); }
          to   { transform: rotateX(70deg) rotateY(0deg) rotateZ(360deg); }
        }
        @keyframes epr-spin-ring-2 {
          from { transform: rotateX(60deg) rotateY(55deg) rotateZ(0deg); }
          to   { transform: rotateX(60deg) rotateY(55deg) rotateZ(-360deg); }
        }
        @keyframes epr-spin-ring-3 {
          from { transform: rotateX(65deg) rotateY(-55deg) rotateZ(0deg); }
          to   { transform: rotateX(65deg) rotateY(-55deg) rotateZ(360deg); }
        }
        @keyframes epr-pulse-core {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        @keyframes epr-float-chip {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .globe-scene {
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        .ring-1 {
          animation: epr-spin-ring-1 16s linear infinite;
          transform-style: preserve-3d;
        }
        .ring-2 {
          animation: epr-spin-ring-2 22s linear infinite;
          transform-style: preserve-3d;
        }
        .ring-3 {
          animation: epr-spin-ring-3 28s linear infinite;
          transform-style: preserve-3d;
        }
        .core-pulse {
          animation: epr-pulse-core 4s ease-in-out infinite;
        }
        .chip-float-1 { animation: epr-float-chip 4s ease-in-out infinite; }
        .chip-float-2 { animation: epr-float-chip 4.6s ease-in-out infinite 1.2s; }
        .chip-float-3 { animation: epr-float-chip 5.2s ease-in-out infinite 2.4s; }
      `}</style>

      {/* Atmospheric radial glow behind sphere */}
      <div
        className="pointer-events-none absolute inset-[10%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(86,38,133,0.65) 0%, rgba(181,116,237,0.25) 45%, transparent 70%)" }}
      />

      {/* 3D Ring System */}
      <div className="globe-scene absolute inset-0">
        {/* Ring 1 - Primary equatorial orbit */}
        <div className="ring-1 absolute inset-[4%] rounded-full border-[2px] border-[#e98200]/60 shadow-[0_0_25px_rgba(233,130,0,0.45)]">
          <span
            className="absolute -top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#e98200]"
            style={{ boxShadow: "0 0 14px #e98200, 0 0 28px #e98200" }}
          />
        </div>

        {/* Ring 2 - Tilted cyan orbit */}
        <div className="ring-2 absolute inset-[8%] rounded-full border-[1.5px] border-[#b574ed]/55 shadow-[0_0_20px_rgba(181,116,237,0.35)]">
          <span
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#b574ed]"
            style={{ boxShadow: "0 0 12px #b574ed, 0 0 22px #b574ed" }}
          />
        </div>

        {/* Ring 3 - Counter-tilted emerald orbit */}
        <div className="ring-3 absolute inset-[12%] rounded-full border-[1.5px] border-[#4a2183]/70 shadow-[0_0_20px_rgba(86,38,133,0.45)]">
          <span
            className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#e98200]"
            style={{ boxShadow: "0 0 12px #e98200" }}
          />
        </div>
      </div>

      {/* Solid Shaded 3D Sphere in Center */}
      <div className="absolute inset-[26%] flex items-center justify-center">
        <div
          className="core-pulse flex aspect-square w-full flex-col items-center justify-center rounded-full text-center"
          style={{
            background: "radial-gradient(circle at 30% 25%, #e98200 0%, #4a2183 40%, #28104f 78%, #180832 100%)",
            boxShadow:
              "0 0 70px rgba(86,38,133,0.65), inset -16px -20px 35px rgba(0,0,0,0.55), inset 8px 10px 22px rgba(255,255,255,0.22)",
          }}
        >
          <Image
            src="/imgs/epr-compass/epr-compass-platform.png"
            alt=""
            width={44}
            height={44}
            className="brightness-0 invert drop-shadow-md"
          />
          <span className="mt-1.5 font-sans text-sm font-extrabold tracking-[0.2em] text-white">
            EPR COMPASS
          </span>
          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-[#e9dcf5]">
            Circular Economy
          </span>
        </div>
      </div>

      {/* Floating Glass Badges */}
      <div className="chip-float-1 absolute left-[-2%] top-[24%] z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e98200]/25">
          <ShieldCheck size={12} className="text-[#e98200]" />
        </span>
        <span className="font-sans text-[11px] font-bold text-white">CPCB Compliant</span>
      </div>

      <div className="chip-float-2 absolute right-[-4%] top-[34%] z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#b574ed]/25">
          <Recycle size={12} className="text-[#b574ed]" />
        </span>
        <span className="font-sans text-[11px] font-bold text-white">1,000+ Recyclers</span>
      </div>

      <div className="chip-float-3 absolute bottom-[18%] left-[4%] z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e98200]/25">
          <Globe2 size={12} className="text-[#e98200]" />
        </span>
        <span className="font-sans text-[11px] font-bold text-white">50+ Categories</span>
      </div>
    </div>
  );
}

/* ─── Flip card for values ───────────────────────────────────────── */
function FlipCard({ icon: Icon, title, text, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <InView delay={index * 0.08}>
      <div
        className="group h-[220px] cursor-pointer [perspective:1000px]"
        onClick={() => setFlipped((f) => !f)}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-[#e4d5ee] bg-white p-6 text-center shadow-sm [backface-visibility:hidden]">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#4a2183] to-[#e98200] shadow-md shadow-[#4a2183]/25">
              <Icon size={26} className="text-white" />
            </div>
            <h3 className="mt-4 font-sans text-base font-bold text-[#281d39]">{title}</h3>
            <span className="mt-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a2183]">
              Hover to reveal
            </span>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl p-6 text-center shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ background: "linear-gradient(145deg, #28104f 0%, #4a2183 100%)" }}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#e98200]/20 blur-xl" />
            <Icon size={24} className="relative text-[#e98200]" />
            <h3 className="relative mt-2 font-sans text-base font-bold text-white">{title}</h3>
            <p className="relative mt-2 font-sans text-[12px] leading-5 text-white/80">{text}</p>
          </div>
        </motion.div>
      </div>
    </InView>
  );
}

/* ─── Rotating ecosystem orbit ───────────────────────────────────── */
function EcosystemOrbit() {
  const radius = 42;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]">
      <div className="absolute inset-[8%] rounded-full border border-dashed border-[#4a2183]/30" />
      <div className="absolute inset-[24%] rounded-full border border-[#4a2183]/15" />

      {/* Rotating partner ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
      >
        {ecosystemPartners.map(([Icon, label], i) => {
          const angle = (i / ecosystemPartners.length) * Math.PI * 2 - Math.PI / 2;
          const left = 50 + radius * Math.cos(angle);
          const top = 50 + radius * Math.sin(angle);
          return (
            <div key={label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
                className="flex w-[122px] flex-col items-center gap-1.5 rounded-2xl border border-[#e4d5ee] bg-white/95 px-2.5 py-2.5 text-center shadow-lg shadow-[#4a2183]/10 backdrop-blur"
                whileHover={{ scale: 1.08 }}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#f0e6fa] to-[#e9dcf5]">
                  <Icon size={15} className="text-[#4a2183]" />
                </span>
                <span className="font-sans text-[10px] font-bold leading-tight text-[#281d39]">{label}</span>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Center hub */}
      <motion.div
        className="absolute inset-[33%] z-10 flex flex-col items-center justify-center rounded-full border-[6px] border-white text-center"
        style={{
          background: "radial-gradient(circle at 30% 28%, #ffffff 0%, #f0e6fa 55%, #e4d5ee 100%)",
          boxShadow: "0 20px 60px rgba(86,38,133,0.25), inset 0 -8px 20px rgba(86,38,133,0.1)",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src="/imgs/epr-compass/epr-compass-platform.png" alt="" width={42} height={42} />
        <strong className="mt-1 font-sans text-sm font-extrabold tracking-wider text-[#28104f]">EPR COMPASS</strong>
        <span className="font-sans text-[9px] font-bold tracking-[0.2em] text-[#4a2183]">PLATFORM</span>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function AboutUsClient() {
  const storyRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <main className="epr-public overflow-x-hidden !bg-[#fffcf8] font-sans">

      {/* ══════════════ HERO ══════════════ */}
      <section
        className="relative isolate overflow-hidden"
        style={{ background: "linear-gradient(145deg, #28104f 0%, #28104f 42%, #562685 100%)" }}
      >
        {/* Soft landscape background image */}
        <div className="absolute inset-0 opacity-[0.14] mix-blend-luminosity">
          <Image
            src="/imgs/epr-compass/about-renewable-landscape.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#28104f] via-[#28104f]/85 to-transparent" />

        {/* Ambient background glows */}
        <div
          className="pointer-events-none absolute -left-28 -top-36 h-[560px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(233,130,0,0.24), transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 right-0 h-[480px] w-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(181,116,237,0.22), transparent 65%)" }}
        />

        <div className="epr-container relative grid min-h-[82vh] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="relative z-10">
            {/* Breadcrumb */}
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
              aria-label="Breadcrumb"
            >
              <ol className="flex items-center gap-1.5 text-xs text-white/45">
                <li><Link href="/" className="transition-colors hover:text-white/70">Home</Link></li>
                <li><ChevronRight className="h-3 w-3" /></li>
                <li className="font-medium text-white/75">About Us</li>
              </ol>
            </motion.nav>

            {/* Pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#e98200]/35 bg-[#e98200]/10 px-4 py-1.5 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#e98200]" />
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#e98200]">
                About Us
              </span>
            </motion.div>

            {/* Headline — clean Plus Jakarta Sans */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="mt-5 max-w-xl font-sans text-3xl font-extrabold leading-[1.18] tracking-[-0.02em] text-white sm:text-4xl lg:text-[2.9rem]"
            >
              Empowering Responsible Businesses. Building a{" "}
              <span className="relative whitespace-normal">
                <span className="bg-gradient-to-r from-[#e98200] via-[#b574ed] to-[#4a2183] bg-clip-text text-transparent">
                  Sustainable Tomorrow.
                </span>
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  height="6"
                  viewBox="0 0 320 6"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 4 Q80 0 160 4 Q240 8 320 4"
                    stroke="#e98200"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35, ease }}
              className="mt-6 max-w-[540px] font-sans text-[15px] leading-relaxed text-white/65"
            >
              EPR Compass is India&apos;s leading EPR &amp; Circular Economy platform that simplifies compliance,
              connects ecosystems, and drives real environmental impact. We combine deep regulatory expertise
              with technology to deliver end-to-end EPR solutions for businesses of all sizes.
            </motion.p>

            {/* Mission & Vision cards */}
            <div className="mt-8 grid max-w-lg gap-4 sm:grid-cols-2">
              {[
                [Target, "Mission", "Make EPR simple, accessible and impactful for every business."],
                [Leaf, "Vision", "A world where every product is responsibly managed, always."],
              ].map(([Icon, title, text], i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 + i * 0.1 }}
                  whileHover={{ y: -3 }}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-[#e98200]/30 hover:bg-white/8"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#4a2183] to-[#e98200] shadow-md shadow-[#4a2183]/30">
                    <Icon size={18} className="text-white" />
                  </span>
                  <p className="font-sans text-[12px] leading-5 text-white/65">
                    <strong className="block font-sans text-xs font-bold uppercase tracking-wider text-white">
                      {title}
                    </strong>
                    {text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — 3D Rotating Globe */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
          >
            <RotatingGlobe3D />
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(233,130,0,0.5) 30%, rgba(86,38,133,0.7) 50%, rgba(233,130,0,0.5) 70%, transparent)",
          }}
        />
      </section>

      {/* ══════════════ STATS STRIP ══════════════ */}
      <section className="epr-container relative z-20 -mt-10">
        <InView>
          <div
            className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-[#28104f]/30"
            style={{ background: "linear-gradient(120deg, #28104f 0%, #3f1b66 50%, #562685 100%)" }}
          >
            <div className="relative grid py-3 text-white sm:grid-cols-2 lg:grid-cols-5">
              {stats.map(([Icon, value, label]) => (
                <div
                  key={label}
                  className="group border-white/10 px-4 py-5 text-center lg:border-r last:border-0"
                >
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-[#e98200]/15">
                    <Icon className="text-[#e98200]" size={22} />
                  </div>
                  <p className="mt-3 font-sans text-2xl font-extrabold tracking-tight">
                    <CountUp value={value} />
                  </p>
                  <p className="mt-1 font-sans text-[11px] leading-4 text-white/65">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </InView>
      </section>

      {/* ══════════════ OUR STORY ══════════════ */}
      <section ref={storyRef} className="epr-section">
        <div className="epr-container grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <InView>
            <p className="epr-eyebrow">Our Story</p>
            <h2 className="mt-2 font-sans text-[32px] font-extrabold tracking-[-0.02em] text-[#28104f]">
              How EPR Compass Began
            </h2>
            <span className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-[#4a2183] to-[#e98200]" />
            <p className="mt-5 font-sans text-[15px] leading-relaxed text-[var(--epr-muted)]">
              EPR Compass was founded with a simple belief — EPR compliance shouldn&apos;t be complex. Our founders,
              with deep experience in environmental compliance, sustainability and technology, saw businesses
              struggling with fragmented processes, lack of reliable partners and ever-changing regulations.
            </p>
            <p className="mt-4 font-sans text-[15px] leading-relaxed text-[var(--epr-muted)]">
              We built EPR Compass to solve this — a one-stop platform that manages the entire EPR lifecycle, connects
              stakeholders and ensures transparency at every step.
            </p>
          </InView>

          <InView delay={0.15}>
            <TiltCard max={6} className="relative">
              <div className="relative min-h-[340px] overflow-hidden rounded-3xl shadow-xl shadow-[#28104f]/20">
                <motion.div className="absolute inset-0" style={{ y: imgY }}>
                  <Image
                    src="/imgs/epr-compass/about-compass-story.png"
                    alt="A hand holding a compass above a green mountain valley"
                    fill
                    sizes="(max-width:1024px) 100vw, 54vw"
                    className="object-cover"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#28104f]/60 to-[#28104f]/90" />
                <blockquote className="absolute right-8 top-1/2 max-w-[240px] -translate-y-1/2 font-sans text-xl font-extrabold leading-8 text-white">
                  <span className="block text-4xl leading-5 text-[#e98200]">“</span>
                  One Platform.<br />One Responsibility.<br />
                  <span className="bg-gradient-to-r from-[#e98200] to-[#b574ed] bg-clip-text text-transparent">
                    A Greener Future.
                  </span>
                </blockquote>
              </div>
            </TiltCard>
          </InView>
        </div>
      </section>

      {/* ══════════════ VALUES — 3D FLIP ══════════════ */}
      <section className="pb-20 pt-4">
        <InView className="text-center">
          <p className="epr-eyebrow">Our Values</p>
          <h2 className="mt-2 font-sans text-[28px] font-extrabold tracking-[-0.02em] text-[#28104f]">
            What Drives Us Every Day
          </h2>
          <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-[#4a2183] to-[#e98200]" />
        </InView>
        <div className="epr-container mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {values.map(([Icon, title, text], i) => (
            <FlipCard key={title} icon={Icon} title={title} text={text} index={i} />
          ))}
        </div>
      </section>

      {/* ══════════════ ECOSYSTEM ORBIT ══════════════ */}
      <section className="relative overflow-hidden py-20" style={{ background: "linear-gradient(180deg, #f0e6fa 0%, #fffcf8 100%)" }}>
        <div className="epr-container grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <InView>
            <p className="epr-eyebrow">The EPR Ecosystem We Serve</p>
            <h2 className="mt-3 font-sans text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-[#28104f]">
              One Client. One Platform.<br />
              <span className="bg-gradient-to-r from-[#4a2183] to-[#e98200] bg-clip-text text-transparent">
                Every Stakeholder.
              </span>
            </h2>
            <p className="mt-4 font-sans text-[14px] leading-relaxed text-[var(--epr-muted)]">
              EPR Compass connects the entire value chain — from producers to recyclers, from consultants to regulators —
              to ensure seamless compliance and real environmental outcomes.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e4d5ee] bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#28104f] to-[#4a2183]">
                <Users size={18} className="text-white" />
              </span>
              <div>
                <strong className="block font-sans text-xs font-bold text-[#281d39]">Our Clients</strong>
                <span className="font-sans text-[11px] text-[var(--epr-muted)]">
                  Producers, Importers, Brand Owners
                </span>
              </div>
            </div>
            <Link
              href="/services"
              className="group relative mt-6 inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#4a2183] to-[#35145f] px-6 py-3 font-sans text-sm font-bold text-white shadow-lg shadow-[#4a2183]/30 transition-all hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Explore Our Solutions{" "}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </InView>
          <InView delay={0.15}>
            <EcosystemOrbit />
          </InView>
        </div>
      </section>

      <section className="epr-section">
        <InView className="text-center">
          <p className="epr-eyebrow">Our Team</p>
          <h2 className="mt-2 font-sans text-[28px] font-extrabold tracking-[-0.02em] text-[#28104f]">Team details will be shared soon.</h2>
          <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-[#4a2183] to-[#e98200]" />
        </InView>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="epr-container pb-20">
        <InView>
          <div
            className="relative overflow-hidden rounded-[2rem] px-8 py-16 text-center shadow-2xl"
            style={{ background: "linear-gradient(145deg, #28104f 0%, #28104f 45%, #562685 100%)" }}
          >
            <div className="relative">
              <h2 className="font-sans text-3xl font-extrabold text-white sm:text-4xl">
                Let&apos;s Build a{" "}
                <span className="bg-gradient-to-r from-[#e98200] to-[#b574ed] bg-clip-text text-transparent">
                  Greener Future
                </span>{" "}
                Together
              </h2>
              <p className="mx-auto mt-4 max-w-lg font-sans text-sm leading-relaxed text-white/60">
                Join the team simplifying EPR compliance for businesses across India.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact?intent=careers"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#e98200] px-7 py-3.5 font-sans text-sm font-extrabold text-[#28104f] shadow-lg shadow-[#e98200]/25 transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
                  Join Our Team <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-sans text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Explore Solutions
                </Link>
              </div>
            </div>
          </div>
        </InView>
      </section>
    </main>
  );
}

