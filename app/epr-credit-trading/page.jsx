"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion, useInView, useMotionValue, useSpring, useTransform,
} from "framer-motion";
import {
  Shield, ShieldCheck, Handshake, Eye, EyeOff, Lock, TrendingUp,
  BarChart3, ArrowLeftRight, FileCheck, Scale, Users, Building2,
  Recycle, PhoneCall, Zap, Globe, AlertTriangle, BadgeCheck,
  Layers, CheckCircle, ChevronRight, Sparkles, ArrowRight,
  Sliders, Database, RefreshCw, Landmark, Cpu, Battery, Disc
} from "lucide-react";
import CallbackForm from "@/components/CallbackForm";

/* ─── Tabs Data ─────────────────────────────────────────────────── */
const tabbedInfoTabs = [
  {
    id: "how-it-works",
    label: "How It Works",
    badge: "Matching Engine",
    heading: "Anonymous Dark-Pool Trading for EPR Credits",
    description:
      "Brands post buy intent and recyclers post sell intent. Our matching engine pairs them on price, quantity, geography and compliance grade — all under masked Trader IDs. Discovery and terms happen here; final credit transfers take place on the CPCB portal.",
    features: [
      { icon: EyeOff, text: "Masked Trader IDs (e.g. BRAND-7X4K) prevent front-running and price manipulation" },
      { icon: ArrowLeftRight, text: "Automated matching scores orders across 7 dimensions including compliance grade" },
      { icon: Lock, text: "AES-256-GCM encrypted identity vault — only revealed after both parties opt in" },
      { icon: Scale, text: "Identity reveal costs 1,000 credits per side and is charged only when both approve" },
    ],
    accent: "#78c943",
    metric: "7-Factor Match Algorithm",
  },
  {
    id: "for-brands",
    label: "For Brands",
    badge: "PIBO Obligations",
    heading: "Meet EPR Obligations Faster & at Fair Market Rates",
    description:
      "As a producer, importer or brand owner, your EPR targets under PWM Rules 2022 require verified certificates each year. Our trading desk connects you directly with accredited recyclers without brokers or mark-ups.",
    features: [
      { icon: FileCheck, text: "Browse verified sell offers across Plastic, E-Waste, Battery & Tyre categories" },
      { icon: TrendingUp, text: "Real-time market depth and intelligence shows weekly rates and bid-ask spreads" },
      { icon: Handshake, text: "Negotiate anonymously — no broker mark-ups, no sensitive volume leakage" },
      { icon: ShieldCheck, text: "Compliance grade scoring helps you audit recycler credentials before transacting" },
    ],
    accent: "#27ceb8",
    metric: "Direct Recycler Access",
  },
  {
    id: "for-recyclers",
    label: "For Recyclers",
    badge: "Capacity Monetization",
    heading: "Monetize Surplus Capacity with Qualified Buyers",
    description:
      "Registered recyclers and PROs can list available EPR credit capacity at their chosen ask price. Connect with high-volume buyers nationwide without cold outreach or commercial intermediaries.",
    features: [
      { icon: BarChart3, text: "Set ask prices and let the automated order book route matched buyers to your room" },
      { icon: Globe, text: "Pan-India reach — serve brands across Maharashtra, Gujarat, Tamil Nadu & more" },
      { icon: BadgeCheck, text: "Upload registrations and CPCB accreditations to earn a Tier-1 compliance badge" },
      { icon: ShieldCheck, text: "Reveal counterparties with full mutual consent only after commercial handshake" },
    ],
    accent: "#07875f",
    metric: "Zero Middleman Margins",
  },
  {
    id: "security",
    label: "Security & Vault",
    badge: "Enterprise Security",
    heading: "Bank-Grade Encryption & Dual-Consent Reveal",
    description:
      "Every negotiation room is protected by end-to-end redaction filters, immutable audit trails, and a dual-consent reveal protocol engineered for sensitive corporate compliance dealings.",
    features: [
      { icon: Lock, text: "AES-256-GCM encryption for company identifiers, GSTNs, and contract drafts" },
      { icon: Eye, text: "Automated redaction filters strip phone numbers, domains and emails from chat" },
      { icon: Shield, text: "Cryptographic audit trail recorded for every quote, counter-offer, and consent" },
      { icon: AlertTriangle, text: "Zero credit burn policy: if either party declines reveal, 0 credits are debited" },
    ],
    accent: "#a78bfa",
    metric: "AES-256-GCM Vault",
  },
];

/* ─── 8 Steps Workflow ───────────────────────────────────────────── */
const tradingSteps = [
  { num: "01", icon: EyeOff, title: "Register & Get Masked ID", desc: "Join as a Brand or Recycler. Receive an encrypted trader pseudonym like BRAND-7X4K to preserve negotiation leverage." },
  { num: "02", icon: ShieldCheck, title: "Fund Credit Wallet", desc: "Top up reveal credits securely via Razorpay. Credits remain in escrow until both parties confirm counterparty unlock." },
  { num: "03", icon: FileCheck, title: "Post Live Order / Ask", desc: "Specify waste category (Plastic, E-Waste, Battery, Tyre), target MT tonnage, desired price range and target state." },
  { num: "04", icon: ArrowLeftRight, title: "Automated 7-Factor Match", desc: "Algorithmic engine scores order proximity, recycler capacity, compliance grade, and turnaround times in real time." },
  { num: "05", icon: Lock, title: "Anonymous Dark-Pool Chat", desc: "Enter a private encrypted negotiation room. Phone numbers, emails and contact data are automatically redacted." },
  { num: "06", icon: Handshake, title: "Finalize Commercial Terms", desc: "Agree on price per metric ton, dispatch schedules, and state allocations with zero broker commissions." },
  { num: "07", icon: Scale, title: "Mutual Reveal (1,000 Pts)", desc: "Both parties spend 1,000 points to unlock legal entity names, GST numbers, and authorized signatory details." },
  { num: "08", icon: BadgeCheck, title: "Official CPCB Transfer", desc: "Execute final invoicing and official EPR certificate transfer directly on the statutory CPCB portal." },
];

/* ─── Grid Capabilities ─────────────────────────────────────────── */
const platformFeatures = [
  { icon: EyeOff, title: "Anonymous Trading", desc: "Masked Trader IDs eliminate front-running, price gauging, and competitive information leakage.", cat: "Privacy" },
  { icon: Zap, title: "Instant Match Engine", desc: "7-dimensional scoring evaluates price, location, volume, and compliance readiness within seconds.", cat: "Speed" },
  { icon: ShieldCheck, title: "Razorpay Wallet", desc: "Seamless credit purchases, instant invoice generation, and real-time wallet tracking.", cat: "Billing" },
  { icon: Lock, title: "Vault Encryption", desc: "Zero-knowledge AES-256-GCM encryption safeguarding tax identifiers and corporate filings.", cat: "Security" },
  { icon: Scale, title: "Dual-Consent Reveal", desc: "Both buyer and seller must independently approve identity unlocks. Zero one-sided exposures.", cat: "Fairness" },
  { icon: BarChart3, title: "Market Depth Radar", desc: "Real-time charts, historical price spreads by state, and category-level supply indicators.", cat: "Intelligence" },
  { icon: Globe, title: "Pan-India Reach", desc: "Direct coverage across all 28 states and Union Territories for local state-level quotas.", cat: "Coverage" },
  { icon: FileCheck, title: "Compliance Scoring", desc: "Automated recycler vetting against SPCB consents, CPCB registrations, and audit track records.", cat: "Verification" },
  { icon: Layers, title: "4 Waste Categories", desc: "Comprehensive liquidity for Plastic Waste (Cat I-IV), E-Waste, Battery Waste, and Tyre Waste.", cat: "Scope" },
];

/* ─── Stakeholder Cards ─────────────────────────────────────────── */
const audienceCards = [
  {
    icon: Building2,
    badge: "Buyers",
    title: "Producers & Brand Owners",
    desc: "Companies facing statutory targets under PWM Rules 2022 looking to procure auditable certificates at verified rates without brokers.",
    tags: ["FMCG", "E-Commerce", "Electronics", "Automotive"],
    glow: "#27ceb8",
  },
  {
    icon: Recycle,
    badge: "Sellers",
    title: "Accredited Recyclers",
    desc: "CPCB-registered recycling units with verified processing capacity seeking credit buyers with guaranteed transaction terms.",
    tags: ["Plastic Processors", "E-Waste Dismantlers", "Battery Smelters"],
    glow: "#78c943",
  },
  {
    icon: Users,
    badge: "Aggregators",
    title: "PRO Partners",
    desc: "Producer Responsibility Organisations managing multi-client target fulfillment through direct, auditable recycler inventories.",
    tags: ["Reverse Logistics", "Collection Networks", "Audited PROs"],
    glow: "#07875f",
  },
  {
    icon: Handshake,
    badge: "Advisors",
    title: "Compliance Consultants",
    desc: "EPR consultants sourcing credit liquidity across multiple states and categories for their corporate advisory portfolios.",
    tags: ["EHS Consultants", "ESG Advisory", "Statutory Auditors"],
    glow: "#a78bfa",
  },
];

/* ─── Interactive Order Book Mock ────────────────────────────────── */
const LIVE_TRADES = [
  { id: "TX-902", type: "BUY", cat: "Plastic Cat-III", vol: "250 MT", state: "MH", rate: "₹3,450/MT", status: "Matched" },
  { id: "TX-901", type: "SELL", cat: "E-Waste (EEE-1)", vol: "120 MT", state: "GJ", rate: "₹8,200/MT", status: "Negotiating" },
  { id: "TX-900", type: "BUY", cat: "Battery (Lead-Acid)", vol: "85 MT", state: "TN", rate: "₹5,100/MT", status: "Revealed" },
  { id: "TX-899", type: "SELL", cat: "Plastic Cat-I", vol: "500 MT", state: "DL", rate: "₹2,890/MT", status: "Open" },
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

/* ─── 3D Interactive Trading Terminal Graphic ────────────────────── */
function TradingTerminal3D() {
  const [activeTicker, setActiveTicker] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveTicker((prev) => (prev + 1) % LIVE_TRADES.length);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[500px]">
      <style jsx>{`
        @keyframes orbit-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbit-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes radar-scan {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .orbit-ring-1 {
          animation: orbit-cw 26s linear infinite;
        }
        .orbit-ring-2 {
          animation: orbit-ccw 34s linear infinite;
        }
        .radar-sweep {
          animation: radar-scan 6s linear infinite;
          transform-origin: center center;
        }
      `}</style>

      {/* Atmospheric ambient glow */}
      <div
        className="pointer-events-none absolute inset-[12%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(7,135,95,0.6) 0%, rgba(39,206,184,0.3) 45%, transparent 70%)" }}
      />

      {/* Outer Orbit Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="orbit-ring-1 absolute h-[92%] w-[92%] rounded-full border border-dashed border-[#78c943]/30">
          <span
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#78c943]"
            style={{ boxShadow: "0 0 16px #78c943" }}
          />
          <span
            className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#27ceb8]"
            style={{ boxShadow: "0 0 12px #27ceb8" }}
          />
        </div>

        <div className="orbit-ring-2 absolute h-[76%] w-[76%] rounded-full border border-[#27ceb8]/25">
          <span
            className="absolute top-1/2 -right-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#07875f]"
            style={{ boxShadow: "0 0 12px #07875f" }}
          />
        </div>

        {/* Radar Scanner Line */}
        <div
          className="radar-sweep absolute h-[60%] w-[60%] rounded-full opacity-40 pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, rgba(120,201,67,0.3) 0deg, transparent 60deg, transparent 360deg)",
          }}
        />
      </div>

      {/* Center 3D Dark-Pool Vault Terminal */}
      <div className="absolute inset-[18%] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/20 bg-[#041d24]/90 p-5 shadow-2xl backdrop-blur-xl"
          style={{
            boxShadow: "0 0 50px rgba(7,135,95,0.4), inset 0 0 30px rgba(0,0,0,0.6)",
          }}
        >
          {/* Top Terminal Status */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78c943] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#78c943]" />
              </span>
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#78c943]">
                DARK_POOL // ACTIVE
              </span>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
              AES-256-GCM
            </span>
          </div>

          {/* Center Card: Masked Counterparty Match */}
          <div className="my-auto space-y-2.5 py-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#27ceb8]/20 font-mono text-xs font-bold text-[#27ceb8]">
                  ID
                </span>
                <div>
                  <p className="font-mono text-xs font-bold text-white">BUYER: BRAND-7X4K</p>
                  <p className="text-[10px] text-white/50">Masked Corporate PIBO</p>
                </div>
              </div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Tier-1 Vetted
              </span>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1.5 rounded-full bg-[#78c943]/15 px-3 py-1 font-mono text-[10px] font-bold text-[#78c943] border border-[#78c943]/30">
                <ArrowLeftRight size={11} /> 98.4% Match Score
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#78c943]/20 font-mono text-xs font-bold text-[#78c943]">
                  ID
                </span>
                <div>
                  <p className="font-mono text-xs font-bold text-white">SELLER: RECYC-92B1</p>
                  <p className="text-[10px] text-white/50">CPCB Registered Unit</p>
                </div>
              </div>
              <span className="rounded bg-[#27ceb8]/20 px-2 py-0.5 text-[10px] font-bold text-[#27ceb8]">
                250 MT Ready
              </span>
            </div>
          </div>

          {/* Bottom Feed */}
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold text-white/80">
                {LIVE_TRADES[activeTicker].cat}
              </span>
              <span className="font-mono font-extrabold text-[#78c943]">
                {LIVE_TRADES[activeTicker].rate}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-white/50">
              <span>Vol: {LIVE_TRADES[activeTicker].vol} ({LIVE_TRADES[activeTicker].state})</span>
              <span className="text-[#27ceb8] font-mono">{LIVE_TRADES[activeTicker].status}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Orbital Badges */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-2 left-6 z-10 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#78c943]/25">
          <EyeOff size={12} className="text-[#78c943]" />
        </span>
        Zero Identity Leaks
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-2 right-4 z-10 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#27ceb8]/25">
          <Scale size={12} className="text-[#27ceb8]" />
        </span>
        1,000 Pts Mutual Reveal
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function EPRCreditTradingLandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showStartTrading, setShowStartTrading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCallback, setShowCallback] = useState(false);

  function getRegistrationHref(role) {
    if (role === "BRAND_BUYER") return "/join-network/register/brand-buyer";
    if (role === "CONSULTANT_SELLER") return "/join-network/register/compliance-consultant";
    if (role === "SERVICE_PROVIDER_SELLER") return "/join-network/register/service-provider";
    if (role === "RECYCLER_SELLER") return "/join-network/register/recycler-pro";
    return "/join-network/register/brand-buyer";
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5faf7] font-sans text-[#102c32]">

      {/* ════════════════════════════════════════════════════════
          HERO — Ultra-Classy Dark Pool Terminal
      ════════════════════════════════════════════════════════ */}
      <section
        className="relative isolate overflow-hidden"
        style={{ background: "linear-gradient(145deg, #020f15 0%, #032f3a 42%, #041c10 100%)" }}
      >
        {/* SVG Dot grid */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]" aria-hidden="true">
          <defs>
            <pattern id="trading-hero-dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#78c943" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#trading-hero-dots)" />
        </svg>

        {/* Ambient Glows */}
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
              <li><Link href="/services" className="transition-colors hover:text-white/70">Trading</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="font-medium text-white/75">EPR Credit Trading</li>
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
                <Lock className="h-3.5 w-3.5 text-[#78c943]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78c943]">
                  Anonymous Dark-Pool Desk
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease }}
                className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.14] tracking-tight text-white sm:text-5xl lg:text-[3.2rem]"
              >
                Trade EPR Credits.{" "}
                <span className="relative whitespace-normal">
                  <span className="bg-gradient-to-r from-[#78c943] via-[#27ceb8] to-[#07875f] bg-clip-text text-transparent">
                    Stay Fully Anonymous.
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
                A high-security dark-pool desk where brands and recyclers discover counterparties and finalize deal terms under masked Trader IDs. Real entity identities remain locked until both parties agree and authorize mutual reveal.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => setShowStartTrading(true)}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#78c943] to-[#27ceb8] px-7 py-3.5 text-sm font-extrabold text-[#032f3a] shadow-lg shadow-[#78c943]/25 transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
                  <Zap className="h-4 w-4" />
                  Start Trading Desk
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={() => window.open("/contact", "_blank", "noopener,noreferrer")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5"
                >
                  <PhoneCall className="h-4 w-4 text-[#78c943]" />
                  Request Trading Desk Callback
                </button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.65 }}
                className="mt-10 flex flex-wrap items-center gap-6 text-xs text-white/50 border-t border-white/10 pt-6"
              >
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#78c943]" /> AES-256 Vault</span>
                <span className="inline-flex items-center gap-1.5"><EyeOff className="h-4 w-4 text-[#78c943]" /> Anonymous ID</span>
                <span className="inline-flex items-center gap-1.5"><Scale className="h-4 w-4 text-[#78c943]" /> 1,000 Pts Mutual Reveal</span>
                <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[#78c943]" /> CPCB Settlement</span>
              </motion.div>
            </div>

            {/* Right 3D Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="relative z-10"
            >
              <TradingTerminal3D />
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

      {/* ── Statutory Alert Banner ────────────────────────────────────────── */}
      <div className="border-b border-[#dfe9e4] bg-[#edf7f1] px-4 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 text-center text-xs font-semibold text-[#07593f]">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#07875f] text-white text-[10px]">!</span>
          <span>
            <strong>Official CPCB Notice:</strong> This desk serves discovery, commercial negotiation, and counterparty reveal. Legal credit surrender and payment settlement take place exclusively on the official statutory portal.
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          TABBED SECTION — 3D Glass Tab Navigator
      ════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <InView className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#07875f]">Deep Dive</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#032f3a] sm:text-4xl">
            Engineered for High-Stakes Compliance Deals
          </h2>
          <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-gradient-to-r from-[#07875f] to-[#78c943]" />
        </InView>

        {/* Tab Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {tabbedInfoTabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`relative rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                activeTab === idx
                  ? "bg-[#032f3a] text-white shadow-lg"
                  : "bg-white text-[#607279] border border-[#dfe9e4] hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {activeTab === idx && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#78c943]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="mt-8">
          <TiltCard max={4}>
            <div className="relative overflow-hidden rounded-3xl border border-[#dfe9e4] bg-white p-8 sm:p-12 shadow-xl shadow-[#07875f]/5">
              <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <span className="inline-block rounded-full bg-[#07875f]/10 px-3 py-1 text-xs font-bold text-[#07875f] mb-4">
                    {tabbedInfoTabs[activeTab].badge}
                  </span>
                  <h3 className="text-2xl font-extrabold text-[#102c32] sm:text-3xl leading-snug">
                    {tabbedInfoTabs[activeTab].heading}
                  </h3>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#607279]">
                    {tabbedInfoTabs[activeTab].description}
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {tabbedInfoTabs[activeTab].features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-2xl border border-[#dfe9e4]/70 bg-[#fbfdfc] p-4">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#07875f] to-[#78c943] text-white shadow-sm">
                          <feat.icon size={16} />
                        </span>
                        <p className="text-xs leading-relaxed text-[#102c32] font-medium pt-0.5">
                          {feat.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Interactive Card for Tab */}
                <div className="relative flex flex-col justify-center rounded-2xl bg-gradient-to-br from-[#032f3a] to-[#041c10] p-7 text-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="font-mono text-xs text-[#78c943]">METRIC_OVERVIEW</span>
                    <span className="h-2 w-2 rounded-full bg-[#78c943] animate-pulse" />
                  </div>
                  <div className="py-8 text-center">
                    <p className="text-xs text-white/50 uppercase tracking-widest">Key Advantage</p>
                    <p className="mt-2 text-2xl font-extrabold text-white">
                      {tabbedInfoTabs[activeTab].metric}
                    </p>
                    <p className="mt-2 text-xs text-white/70 max-w-xs mx-auto">
                      Fully auditable &amp; compatible with statutory CPCB compliance returns.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/50">Discovery Model:</span>
                      <span className="font-semibold text-[#78c943]">Anonymous Dark-Pool</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Identity Lock:</span>
                      <span className="font-semibold text-white">AES-256-GCM Vault</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Settlement:</span>
                      <span className="font-semibold text-[#27ceb8]">Statutory CPCB Portal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS — 8 Step 3D Workflow
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24" style={{ background: "linear-gradient(135deg, #021d24 0%, #032f3a 55%, #042a1f 100%)" }}>
        {/* Dot pattern */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" aria-hidden="true">
          <defs>
            <pattern id="trading-steps-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#78c943" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#trading-steps-dots)" />
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <InView className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#78c943]">Step-by-Step Flow</p>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              From Anonymous Order to Government Settlement
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/55">
              An 8-step protocol designed to keep negotiations fair, private, and audit-compliant.
            </p>
          </InView>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tradingSteps.map((step, idx) => (
              <InView key={step.num} delay={idx * 0.05}>
                <TiltCard max={6} className="h-full">
                  <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#07875f] to-[#78c943] text-white shadow-md">
                          <step.icon size={18} />
                        </span>
                        <span className="font-mono text-3xl font-black text-white/10">
                          {step.num}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-xs leading-relaxed text-white/60">{step.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#78c943]">
                      <span>Stage {idx + 1} of 8</span>
                      <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </TiltCard>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CAPABILITIES GRID — 9 Cards with 3D Tilt
      ════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <InView className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#07875f]">Platform Engine</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#032f3a] sm:text-4xl">
            Institutional-Grade Capabilities
          </h2>
          <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-gradient-to-r from-[#07875f] to-[#78c943]" />
        </InView>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((item, idx) => (
            <InView key={item.title} delay={idx * 0.05}>
              <TiltCard max={6} className="h-full">
                <div className="group relative flex h-full flex-col justify-between rounded-3xl border border-[#dfe9e4] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-[#07875f]/10 hover:border-[#07875f]/30">
                  <div className="h-1 w-full bg-gradient-to-r from-[#07875f] via-[#78c943] to-[#07875f] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-0 left-0 rounded-t-3xl" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#eef7f2] to-[#dff0e6] text-[#07875f] shadow-sm group-hover:from-[#07875f] group-hover:to-[#056c4c] group-hover:text-white transition-colors duration-300">
                        <item.icon size={20} />
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                        {item.cat}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-[#102c32] mb-2">{item.title}</h4>
                    <p className="text-xs leading-relaxed text-[#607279]">{item.desc}</p>
                  </div>
                </div>
              </TiltCard>
            </InView>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHO IS THIS FOR — 4 Stakeholders
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 bg-[#eef7f2]/60 border-t border-[#dfe9e4]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <InView className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#07875f]">Participants</p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#032f3a] sm:text-4xl">
              Who Uses the EPR Credit Trading Desk?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#607279]">
              Connecting the entire compliance supply chain under one verified trading environment.
            </p>
          </InView>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {audienceCards.map((aud, idx) => (
              <InView key={aud.title} delay={idx * 0.08}>
                <TiltCard max={8} className="h-full">
                  <div className="relative flex h-full flex-col justify-between rounded-3xl border border-[#dfe9e4] bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#032f3a] to-[#07875f] text-white shadow-md">
                          <aud.icon size={22} />
                        </span>
                        <span className="rounded-full bg-[#07875f]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#07875f]">
                          {aud.badge}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-[#102c32] mb-2">{aud.title}</h4>
                      <p className="text-xs leading-relaxed text-[#607279] mb-4">{aud.desc}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#dfe9e4]">
                      {aud.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BOTTOM CTA BANNER — Dark Futuristic
      ════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <InView>
          <div
            className="relative overflow-hidden rounded-[2.5rem] p-10 sm:p-14 text-center shadow-2xl"
            style={{ background: "linear-gradient(145deg, #020f15 0%, #032f3a 45%, #041c10 100%)" }}
          >
            {/* Ambient Orbital Rings */}
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
                Immediate Order Matching Active
              </span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                Ready to Trade EPR Credits{" "}
                <span className="bg-gradient-to-r from-[#78c943] to-[#27ceb8] bg-clip-text text-transparent">
                  Anonymously?
                </span>
              </h2>
              <p className="mt-4 text-sm text-white/60 leading-relaxed">
                Connect with vetted buyers &amp; recyclers across India. Protect transaction pricing under masked identities, and execute final statutory settlement on the CPCB portal.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowStartTrading(true)}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#78c943] px-8 py-3.5 text-sm font-extrabold text-[#032f3a] shadow-lg shadow-[#78c943]/25 transition-all hover:-translate-y-0.5 hover:brightness-110"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
                  <Zap size={16} />
                  Start Trading Desk
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCallback(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5"
                >
                  <PhoneCall size={16} className="text-[#78c943]" />
                  Request Callback
                </button>
              </div>
            </div>
          </div>
        </InView>
      </section>

      {/* ── Start Trading Modal (Original business functionality retained) ── */}
      {showStartTrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-[#041d24] p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-mono text-xl font-bold text-[#78c943]">START TRADING // SELECT ROLE</h3>
                <p className="mt-1 text-xs text-white/60">
                  Select your role to acquire your masked Trader ID and access the dark pool.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStartTrading(false);
                  setSelectedRole(null);
                }}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { id: "BRAND_BUYER", title: "EPR Buyer (Brand / PIBO)", role: "Buyer Role", desc: "For producers, importers & brand owners procuring valid certificates." },
                { id: "RECYCLER_SELLER", title: "EPR Seller (Recycler)", role: "Seller Role", desc: "For CPCB/SPCB accredited recyclers offering credit capacity." },
                { id: "CONSULTANT_SELLER", title: "EPR Consultant", role: "Advisory Role", desc: "For consultants offering seller-side credit sourcing support." },
                { id: "SERVICE_PROVIDER_SELLER", title: "Service Provider / PRO", role: "Aggregator Role", desc: "For aggregators & PROs participating in credit deals." },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selectedRole === r.id
                      ? "border-[#78c943] bg-[#78c943]/15"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78c943]">{r.role}</span>
                  <h4 className="mt-1 text-sm font-bold text-white">{r.title}</h4>
                  <p className="mt-1 text-xs text-white/60">{r.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70">
              <strong className="text-white block mb-1">Dark Pool Protocol:</strong>
              1. Your identity is masked upon signup (e.g. BRAND-7X4K).<br />
              2. Negotiate terms anonymously; real counterparties unlock only when both spend 1,000 points.<br />
              3. Final execution &amp; transfer take place directly on the statutory CPCB portal.
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowStartTrading(false);
                  setShowCallback(true);
                }}
                className="rounded-xl border border-white/20 px-5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Need Assistance?
              </button>
              <Link
                href={getRegistrationHref(selectedRole)}
                className="rounded-xl bg-[#78c943] px-6 py-2.5 text-xs font-bold text-[#032f3a] hover:brightness-110"
              >
                Proceed to Registration
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Callback modal */}
      <CallbackForm open={showCallback} onClose={() => setShowCallback(false)} />
    </main>
  );
}

