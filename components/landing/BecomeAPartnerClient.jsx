"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PartnerApplicationForm from "@/components/forms/PartnerApplicationForm";
import {
  motion, useInView, useMotionValue, useSpring, useTransform,
} from "framer-motion";
import {
  ArrowRight, BadgeCheck, BarChart3, Cpu, Factory, Handshake, Leaf,
  Recycle, ShieldCheck, Truck, UserRoundCheck, Users, ChevronRight,
  Sparkles, CheckCircle2, TrendingUp, Globe2, Building2, ExternalLink,
  Layers, Award, Zap, PhoneCall, HeartHandshake, Check
} from "lucide-react";

/* ─── Partner Categories ─────────────────────────────────────────── */
const partnerTypes = [
  {
    icon: Recycle,
    title: "Recyclers & Aggregators",
    category: "Operations",
    desc: "Join our verified network of CPCB-authorized recyclers. Access direct enterprise buyer demand and trade credit certificates without middleman discounts.",
    metrics: "200+ Verified Units",
    accent: "#07875f",
  },
  {
    icon: UserRoundCheck,
    title: "Consultants & Advisors",
    category: "Advisory",
    desc: "Partner with EPR Compass to offer automated CPCB portal filings, auditing frameworks, and end-to-end multi-stream compliance to your corporate clients.",
    metrics: "Earn 15-30% Commissions",
    accent: "#78c943",
  },
  {
    icon: Factory,
    title: "Waste Processors",
    category: "Processing",
    desc: "Work with top FMCG and electronics brand owners committed to accountable co-processing, energy recovery, and certified end-of-life destruction.",
    metrics: "High-Volume Tie-ups",
    accent: "#27ceb8",
  },
  {
    icon: BadgeCheck,
    title: "Credit Providers",
    category: "Trading",
    desc: "Collaborate on our dark-pool desk to enable transparent, auditable trading of EPR credit certificates across Plastic, Battery, E-Waste and Tyre streams.",
    metrics: "Instant Liquidity",
    accent: "#a78bfa",
  },
  {
    icon: Cpu,
    title: "Technology Partners",
    category: "Ecosystem",
    desc: "Integrate ERPs, barcode tracking, IoT weight sensors, and supply chain solutions directly into our cloud compliance ledger and reporting API.",
    metrics: "API & Webhooks",
    accent: "#38bdf8",
  },
  {
    icon: Truck,
    title: "Logistics Partners",
    category: "Supply Chain",
    desc: "Close the reverse circular loop with nationwide GPS-tracked collection vehicles, transfer hubs, and verifiable dispatch manifests.",
    metrics: "Pan-India Corridors",
    accent: "#fbbf24",
  },
];

/* ─── Verified Network Logos ─────────────────────────────────────── */
const partnerNetworkLogos = [
  { name: "RECYCLIX", sub: "Solutions for Tomorrow", badge: "Recycler Tier-1" },
  { name: "ECOGREEN", sub: "Recycling Pvt. Ltd.", badge: "Plastic Cat-I & II" },
  { name: "EnviroTech", sub: "Environmental Solutions", badge: "Battery Waste" },
  { name: "Recykal", sub: "Sustainability Simplified", badge: "Aggregator Network" },
  { name: "GreenRoute", sub: "Eco Logistics Fleet", badge: "GPS Reverse Fleet" },
  { name: "WasteX", sub: "Authorized Co-Processing", badge: "Waste-to-Energy" },
  { name: "CIRCULUS", sub: "For a Circular Future", badge: "E-Waste Dismantler" },
  { name: "SUSTAINOVA", sub: "EHS Corporate Advisors", badge: "Compliance Audit" },
  { name: "NEO WASTE", sub: "Industrial Waste Solutions", badge: "Tyre Pyrolysis" },
  { name: "credable", sub: "Verified Credit Trading", badge: "EPR FinTech" },
  { name: "TRACECERT", sub: "Certificate Marketplace", badge: "CPCB Audit Ready" },
  { name: "ECOHUB", sub: "National Compliance Grid", badge: "State Pollution Grid" },
];

/* ─── Value Pillars ──────────────────────────────────────────────── */
const reasons = [
  {
    icon: Users,
    title: "Wider Market Access",
    desc: "Direct access to 500+ institutional PIBOs (producers, importers, and brand owners) actively seeking verified compliance fulfillment.",
    stat: "500+ Enterprise PIBOs",
  },
  {
    icon: ShieldCheck,
    title: "Vetted & Trusted Reputation",
    desc: "Gain immediate credibility by listing on India's recognized EPR infrastructure platform, backed by automated compliance scoring.",
    stat: "100% CPCB Aligned",
  },
  {
    icon: BarChart3,
    title: "Compounding Growth",
    desc: "Earn recurring referral revenues, monetize surplus recycling quotas, and access institutional contracts with guaranteed payment cycles.",
    stat: "15% - 30% Margin Boost",
  },
  {
    icon: Leaf,
    title: "Verifiable Green Impact",
    desc: "Every metric ton processed through our ecosystem is digitally tracked, helping divert thousands of tons of plastic and toxic waste from landfills.",
    stat: "Multi-Million MT Diverted",
  },
];

/* ─── Partner Steps ──────────────────────────────────────────────── */
const partnerSteps = [
  { step: "01", title: "Submit Application", desc: "Select your partner category and submit your agency or facility accreditations online in 3 minutes." },
  { step: "02", title: "Credential Verification", desc: "Our technical compliance desk validates SPCB consents, CPCB registrations, and service capabilities." },
  { step: "03", title: "Platform Onboarding", desc: "Receive access to partner portal dashboard, dedicated partner manager, and real-time client deal feeds." },
  { step: "04", title: "Grow & Transact", desc: "Fulfill brand contracts, trade certified credits, or earn recurring client management commissions." },
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

/* ─── 3D Partner Ecosystem Dynamic Globe / Network Graphic ──────── */
function PartnerEcosystemGraphic3D() {
  const satellites = [
    { label: "Recyclers", icon: Recycle, angle: 0, color: "#07875f" },
    { label: "Consultants", icon: UserRoundCheck, angle: 60, color: "#78c943" },
    { label: "Processors", icon: Factory, angle: 120, color: "#27ceb8" },
    { label: "Credits", icon: BadgeCheck, angle: 180, color: "#a78bfa" },
    { label: "Logistics", icon: Truck, angle: 240, color: "#fbbf24" },
    { label: "Tech", icon: Cpu, angle: 300, color: "#38bdf8" },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]">
      <style jsx>{`
        @keyframes orbit-ring-spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbit-ring-spin-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes pulse-core-glow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.05); opacity: 1; }
        }
        .orbit-spin-cw {
          animation: orbit-ring-spin-cw 38s linear infinite;
        }
        .orbit-spin-ccw {
          animation: orbit-ring-spin-ccw 30s linear infinite;
        }
        .core-glow {
          animation: pulse-core-glow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Radiant atmospheric background aura */}
      <div
        className="pointer-events-none absolute inset-[12%] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(7,135,95,0.55) 0%, rgba(120,201,67,0.25) 45%, transparent 70%)",
        }}
      />

      {/* Orbit Rings with Dynamic Nodes */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer Ring */}
        <div className="orbit-spin-cw absolute h-[88%] w-[88%] rounded-full border border-dashed border-[#78c943]/35">
          <span
            className="absolute -top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#78c943]"
            style={{ boxShadow: "0 0 16px #78c943" }}
          />
          <span
            className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#27ceb8]"
            style={{ boxShadow: "0 0 12px #27ceb8" }}
          />
        </div>

        {/* Middle Ring */}
        <div className="orbit-spin-ccw absolute h-[68%] w-[68%] rounded-full border border-[#27ceb8]/25">
          <span
            className="absolute top-1/2 -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full bg-[#07875f]"
            style={{ boxShadow: "0 0 14px #07875f" }}
          />
        </div>
      </div>

      {/* Rotating Nodes Array */}
      <div className="absolute inset-0">
        <div className="orbit-spin-cw absolute inset-0">
          {satellites.map((sat, i) => {
            const rad = (sat.angle * Math.PI) / 180;
            const radiusPercent = 44; // orbit radius
            const left = 50 + radiusPercent * Math.cos(rad);
            const top = 50 + radiusPercent * Math.sin(rad);

            return (
              <div
                key={sat.label}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                {/* Counter-rotation to keep badges upright */}
                <div className="orbit-spin-ccw">
                  <div
                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-[#021d24]/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110"
                    style={{ boxShadow: `0 0 20px ${sat.color}40` }}
                  >
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full"
                      style={{ background: `${sat.color}30` }}
                    >
                      <sat.icon size={12} style={{ color: sat.color }} />
                    </span>
                    <span>{sat.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Central 3D Platform Sphere */}
      <div className="absolute inset-[27%] flex items-center justify-center">
        <div
          className="core-glow relative flex aspect-square w-full flex-col items-center justify-center rounded-full text-center"
          style={{
            background: "radial-gradient(circle at 30% 25%, #2fd195 0%, #07875f 42%, #032f3a 80%, #01181e 100%)",
            boxShadow:
              "0 0 75px rgba(7,135,95,0.7), inset -16px -20px 35px rgba(0,0,0,0.55), inset 8px 10px 22px rgba(255,255,255,0.25)",
          }}
        >
          <Image
            src="/imgs/epr-compass/epr-compass-platform.png"
            alt=""
            width={48}
            height={48}
            className="brightness-0 invert drop-shadow-md"
          />
          <span className="mt-2 text-sm font-extrabold tracking-[0.2em] text-white">
            EPR COMPASS
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#bbf7d0]">
            Partner Hub
          </span>
        </div>
      </div>

      {/* Floating Badges */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-3 right-6 z-10 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#78c943]/25">
          <Handshake size={12} className="text-[#78c943]" />
        </span>
        1,000+ Active Partners
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-3 left-4 z-10 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#27ceb8]/25">
          <TrendingUp size={12} className="text-[#27ceb8]" />
        </span>
        15-30% Commission
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function BecomeAPartnerClient() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5faf7] font-sans text-[#102c32]">

      {/* ════════════════════════════════════════════════════════
          HERO — Dark-Tech Ecosystem Orbit
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative isolate overflow-hidden"
        style={{ background: "linear-gradient(145deg, #020f15 0%, #032f3a 42%, #041c10 100%)" }}
      >
        {/* Subtle dot matrix */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]" aria-hidden="true">
          <defs>
            <pattern id="partner-hero-dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#78c943" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#partner-hero-dots)" />
        </svg>

        {/* Ambient Lights */}
        <div
          className="pointer-events-none absolute -left-28 -top-36 h-[560px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(7,135,95,0.45), transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(120,201,67,0.22), transparent 65%)" }}
        />

        {/* Horizontal Laser Sweep */}
        <motion.div
          className="pointer-events-none absolute left-0 right-0 h-px opacity-20"
          style={{ background: "linear-gradient(90deg, transparent, #78c943 40%, #07875f 60%, transparent)" }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
            aria-label="Breadcrumb"
          >
            <ol className="flex items-center gap-1.5 text-xs text-white/45">
              <li><Link href="/" className="transition-colors hover:text-white/70">Home</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li><Link href="/join-network" className="transition-colors hover:text-white/70">Network</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="font-medium text-white/75">Become a Partner</li>
            </ol>
          </motion.nav>

          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#78c943]/35 bg-[#78c943]/10 px-4 py-1.5 backdrop-blur-sm"
              >
                <Handshake className="h-3.5 w-3.5 text-[#78c943]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78c943]">
                  EPR Compass Alliance Network
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease }}
                className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.14] tracking-tight text-white sm:text-5xl lg:text-[3.2rem]"
              >
                Stronger Together.{" "}
                <span className="relative whitespace-normal">
                  <span className="bg-gradient-to-r from-[#78c943] via-[#27ceb8] to-[#07875f] bg-clip-text text-transparent">
                    Sustainable Forever.
                  </span>
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full"
                    height="6"
                    viewBox="0 0 340 6"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 4 Q85 0 170 4 Q255 8 340 4"
                      stroke="#78c943"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.35, ease }}
                className="mt-6 max-w-xl text-base leading-relaxed text-white/65"
              >
                Join India&apos;s fastest-growing environmental compliance ecosystem. Partner with EPR Compass to monetize recycling capacity, provide end-to-end client compliance, and unlock recurring referral revenues.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="#partner-application"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#78c943] to-[#27ceb8] px-7 py-3.5 text-sm font-extrabold text-[#032f3a] shadow-lg shadow-[#78c943]/25 transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
                  Apply for Partnership
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/join-network"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5"
                >
                  Explore Network Directories
                </Link>
              </motion.div>

              {/* Value Pills */}
              <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-2 border-t border-white/10 pt-6">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#07875f] text-white">
                    <Handshake size={18} />
                  </span>
                  <div>
                    <strong className="block text-xs font-bold text-white uppercase tracking-wider">Collaborate</strong>
                    <p className="text-[11px] text-white/60">Work with 500+ institutional PIBOs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#78c943] text-[#032f3a]">
                    <TrendingUp size={18} />
                  </span>
                  <div>
                    <strong className="block text-xs font-bold text-white uppercase tracking-wider">Grow Together</strong>
                    <p className="text-[11px] text-white/60">Earn 15-30% recurring margin.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 3D Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="relative z-10"
            >
              <PartnerEcosystemGraphic3D />
            </motion.div>
          </div>
        </div>

        {/* Bottom Shimmer Line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(120,201,67,0.5) 30%, rgba(7,135,95,0.7) 50%, rgba(120,201,67,0.5) 70%, transparent)",
          }}
        />
      </section>

      {/* ════════════════════════════════════════════════════════
          PARTNER CATEGORIES (6 Interactive 3D Tilt Cards)
      ════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <InView className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#07875f]">Partnership Tracks</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#032f3a] sm:text-4xl">
            Partner With Purpose Across Every Stream
          </h2>
          <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-gradient-to-r from-[#07875f] to-[#78c943]" />
        </InView>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {partnerTypes.map((pt, idx) => (
            <InView key={pt.title} delay={idx * 0.06}>
              <TiltCard max={7} className="h-full">
                <div className="group relative flex h-full flex-col justify-between rounded-3xl border border-[#dfe9e4] bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-[#07875f]/10 hover:border-[#07875f]/30">
                  <div className="h-1 w-full bg-gradient-to-r from-[#07875f] via-[#78c943] to-[#07875f] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-0 left-0 rounded-t-3xl" />
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#eef7f2] to-[#dff0e6] text-[#07875f] shadow-sm group-hover:from-[#07875f] group-hover:to-[#056c4c] group-hover:text-white transition-colors duration-300">
                        <pt.icon size={22} />
                      </span>
                      <span className="rounded-full bg-[#07875f]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#07875f]">
                        {pt.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#102c32] mb-2">{pt.title}</h3>
                    <p className="text-xs leading-relaxed text-[#607279]">{pt.desc}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#dfe9e4] pt-4">
                    <span className="text-xs font-bold text-[#07875f]">{pt.metrics}</span>
                    <Link
                      href="#partner-application"
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#032f3a] hover:text-[#07875f] transition-colors"
                    >
                      Apply Now <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </InView>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PARTNER ONBOARDING PROCESS (4 Steps 3D Flow)
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24" style={{ background: "linear-gradient(135deg, #021d24 0%, #032f3a 55%, #042a1f 100%)" }}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" aria-hidden="true">
          <defs>
            <pattern id="partner-steps-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#78c943" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#partner-steps-dots)" />
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <InView className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#78c943]">Simple Onboarding</p>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              How the Partnership Works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/55">
              From application review to enterprise transaction fulfillment in 4 swift milestones.
            </p>
          </InView>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partnerSteps.map((st, i) => (
              <InView key={st.step} delay={i * 0.08}>
                <TiltCard max={6} className="h-full">
                  <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#07875f] to-[#78c943] text-white shadow-md font-mono text-sm font-extrabold">
                          {st.step}
                        </span>
                        <CheckCircle2 size={16} className="text-[#78c943]/40 group-hover:text-[#78c943] transition-colors" />
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">{st.title}</h4>
                      <p className="text-xs leading-relaxed text-white/60">{st.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-[#78c943]">
                      Stage {i + 1} of 4
                    </div>
                  </div>
                </TiltCard>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PARTNER NETWORK ACCREDITATION GRID
      ════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <InView className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#07875f]">Alliances</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#032f3a] sm:text-4xl">
            Our Growing Ecosystem Network
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#607279]">
            Over 1,000+ accredited recycling facilities, logistics providers, and compliance consultancies active across 28 states.
          </p>
        </InView>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {partnerNetworkLogos.map((logo, idx) => (
            <InView key={logo.name} delay={idx * 0.04}>
              <div className="group relative flex flex-col justify-between rounded-2xl border border-[#dfe9e4] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#07875f]/30 hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eef7f2] text-xs font-black text-[#07875f]">
                      {logo.name[0]}
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                      {logo.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#14785e]">{logo.name}</h4>
                  <p className="text-[11px] text-[#607279] mt-0.5">{logo.sub}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#f0f4f2] flex items-center justify-between text-[10px] text-[#07875f] font-semibold">
                  <span>Verified Network</span>
                  <Check size={11} />
                </div>
              </div>
            </InView>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/join-network"
            className="inline-flex items-center gap-2 rounded-xl border border-[#dfe9e4] bg-white px-6 py-3 text-xs font-bold text-[#07875f] shadow-sm hover:bg-[#eef7f2] transition-colors"
          >
            Explore Complete Partner Directory <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY PARTNER WITH EPR COMPASS? (4 Pillar Showcase)
      ════════════════════════════════════════════════════════ */}
      <section className="bg-[#eef7f2]/60 py-20 border-y border-[#dfe9e4]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.8fr]">
            <InView>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#07875f]">The Value Proposition</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#032f3a] sm:text-4xl leading-tight">
                More Reach.<br />
                More Impact.<br />
                <span className="bg-gradient-to-r from-[#07875f] to-[#78c943] bg-clip-text text-transparent">
                  Unmatched Value.
                </span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#607279]">
                Our cloud infrastructure empowers alliance partners with automated tools, liquidity matching, and institutional trust to scale their compliance operations effortlessly.
              </p>
              <div className="mt-6">
                <Link
                  href="#partner-application"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#07875f] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#056c4c] transition-colors"
                >
                  Join the Network Today <ArrowRight size={14} />
                </Link>
              </div>
            </InView>

            <div className="grid gap-5 sm:grid-cols-2">
              {reasons.map((r, i) => (
                <InView key={r.title} delay={i * 0.08}>
                  <TiltCard max={6} className="h-full">
                    <div className="flex h-full flex-col justify-between rounded-3xl border border-[#dfe9e4] bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                      <div>
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#032f3a] to-[#07875f] text-white shadow-md mb-4">
                          <r.icon size={22} />
                        </span>
                        <h4 className="text-base font-extrabold text-[#102c32] mb-1">{r.title}</h4>
                        <p className="text-xs leading-relaxed text-[#607279] mb-4">{r.desc}</p>
                      </div>
                      <div className="rounded-xl bg-[#eef7f2] px-3 py-2 text-xs font-bold text-[#07875f]">
                        {r.stat}
                      </div>
                    </div>
                  </TiltCard>
                </InView>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BOTTOM CTA BANNER — Dark Galactic Frame
      ════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <InView>
          <div
            className="relative overflow-hidden rounded-[2.5rem] p-10 sm:p-14 text-center shadow-2xl"
            style={{ background: "linear-gradient(145deg, #020f15 0%, #032f3a 45%, #041c10 100%)" }}
          >
            {/* Ambient Rings */}
            {[340, 240, 150].map((size, i) => (
              <motion.div
                key={size}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{ width: size, height: size, borderColor: `rgba(120,201,67,${0.08 + i * 0.05})` }}
                animate={{ rotate: i % 2 ? -360 : 360 }}
                transition={{ duration: 32 + i * 10, repeat: Infinity, ease: "linear" }}
              >
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#78c943]" style={{ boxShadow: "0 0 10px #78c943" }} />
              </motion.div>
            ))}

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block rounded-full bg-[#78c943]/20 border border-[#78c943]/40 px-3.5 py-1 text-xs font-bold text-[#78c943] mb-4">
                Now Onboarding 2026 Partners
              </span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                Ready to Join India&apos;s Foremost{" "}
                <span className="bg-gradient-to-r from-[#78c943] to-[#27ceb8] bg-clip-text text-transparent">
                  EPR Network?
                </span>
              </h2>
              <p className="mt-4 text-sm text-white/60 leading-relaxed">
                Connect with our partnership desk. We will review your certifications and integrate your services directly into our brand fulfillment platform.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="#partner-application"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#78c943] px-8 py-3.5 text-sm font-extrabold text-[#032f3a] shadow-lg shadow-[#78c943]/25 transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
                  Partner With Us
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/join-network/register/service-provider"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5"
                >
                  Register as Service Provider
                </Link>
              </div>
            </div>
          </div>
        </InView>
      </section>

      <section id="partner-application" className="mx-auto max-w-3xl scroll-mt-28 px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-[#dfe9e4] bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold">Apply for Partnership</h2>
          <p className="mb-6 mt-3 text-sm text-[#607279]">Tell us about your business and the partnership you are interested in. Our team will review your application.</p>
          <PartnerApplicationForm />
        </div>
      </section>
    </main>
  );
}

