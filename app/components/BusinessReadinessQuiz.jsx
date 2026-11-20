"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  Phone,
  RefreshCw,
  User,
  Mail,
  Zap,
} from "lucide-react";

/* ─── Questions ─────────────────────────────────────────────────────────── */

export const questions = [
  {
    id: "stage",
    label: "Where are you in your journey?",
    hint: "Pick the option that best describes you right now",
    options: [
      { value: "exploring",   label: "Just exploring ideas",                weight: 1 },
      { value: "researching", label: "Actively researching sectors",         weight: 2 },
      { value: "ready",       label: "Ready to invest & launch",             weight: 3 },
      { value: "operating",   label: "Already operating, need compliance",   weight: 4 },
    ],
  },
  {
    id: "sector",
    label: "Which waste sector interests you?",
    hint: "Choose the category you want to enter or are already in",
    wide: true,
    options: [
      { value: "plastic",      label: "♻️ Plastic Recycling (PWM)",         weight: 2 },
      { value: "ewaste",       label: "🖥️ E-Waste / ITAD",                  weight: 2 },
      { value: "battery",      label: "🔋 Battery Recycling (BWMR)",        weight: 2 },
      { value: "tyre",         label: "🛞 Tyre Pyrolysis / Recycling",       weight: 2 },
      { value: "oil_elv",      label: "🛢️ Used Oil / ELV",                  weight: 2 },
      { value: "cd_waste",     label: "🏗️ C&D Waste",                       weight: 2 },
      { value: "organic",      label: "🌿 Organic Waste",                    weight: 2 },
      { value: "agricultural", label: "🌾 Agricultural Waste",               weight: 2 },
      { value: "hazardous",    label: "⚠️ Hazardous Waste",                  weight: 2 },
      { value: "food",         label: "🍱 Food Waste",                       weight: 2 },
      { value: "wastewater",   label: "💧 Waste Water Treatment",            weight: 2 },
      { value: "biogas",       label: "🔥 Biogas",                           weight: 2 },
      { value: "wood_paper",   label: "🪵 Wood, Paper & Pulp Waste",         weight: 2 },
      { value: "medical",      label: "🏥 Medical Waste",                    weight: 2 },
      { value: "textile",      label: "🧵 Textile Waste",                    weight: 2 },
      { value: "chemical",     label: "⚗️ Chemical Waste",                   weight: 2 },
    ],
  },
  {
    id: "goal",
    label: "What is your primary goal right now?",
    hint: "This helps us point you to the right resource",
    options: [
      { value: "understand",  label: "Understand EPR rules & obligations",  weight: 1 },
      { value: "opportunity", label: "Find a profitable opportunity",        weight: 2 },
      { value: "comply",      label: "Get registered & stay compliant",      weight: 3 },
      { value: "scale",       label: "Scale operations & win clients",       weight: 4 },
    ],
  },
  {
    id: "timeline",
    label: "What is your decision timeline?",
    hint: "Be honest — urgency changes the recommendations",
    options: [
      { value: "no_rush",      label: "No rush — still learning",           weight: 1 },
      { value: "six_months",   label: "6–12 months from now",               weight: 2 },
      { value: "three_months", label: "Within the next 3 months",           weight: 3 },
      { value: "now",          label: "Immediately — need help now",         weight: 4 },
    ],
  },
];

/* ─── Score → Profile ────────────────────────────────────────────────────── */

const sectorLabel = {
  plastic:      "Plastic Recycling",
  ewaste:       "E-Waste / ITAD",
  battery:      "Battery Recycling",
  tyre:         "Tyre Pyrolysis",
  oil_elv:      "Used Oil / ELV",
  cd_waste:     "C&D Waste",
  organic:      "Organic Waste",
  agricultural: "Agricultural Waste",
  hazardous:    "Hazardous Waste",
  food:         "Food Waste",
  wastewater:   "Waste Water Treatment",
  biogas:       "Biogas",
  wood_paper:   "Wood, Paper & Pulp Waste",
  medical:      "Medical Waste",
  textile:      "Textile Waste",
  chemical:     "Chemical Waste",
};

// answers = { [questionId]: { value, weight } }
export function getProfile(answers) {
  const total = Object.values(answers).reduce((sum, a) => sum + a.weight, 0);
  const max   = questions.length * 4;
  const pct   = Math.round((total / max) * 100);
  const sector = sectorLabel[answers.sector?.value] || "your chosen sector";

  if (pct <= 30) {
    return {
      score: pct, tier: "Explorer", color: "amber",
      headline: `You're at the starting line for ${sector} — build a strong foundation first.`,
      summary:
        "Most successful waste-management entrepreneurs spent 2–3 months learning before committing capital. The right first step is a structured course covering regulations, margins, and vendor networks.",
    };
  }
  if (pct <= 55) {
    return {
      score: pct, tier: "Researcher", color: "cyan",
      headline: `You have context on ${sector} — now validate before committing.`,
      summary:
        "You're past the basics but need sector-specific clarity before investing. A bank-loan-ready business plan will sharpen your numbers, and a brief consultant session will reveal hidden compliance costs.",
    };
  }
  if (pct <= 78) {
    return {
      score: pct, tier: "Launcher", color: "teal",
      headline: `You're ready to launch in ${sector} — execution planning is your next milestone.`,
      summary:
        "Your readiness is strong. The gap between you and a registered, operating business is a clear execution blueprint and the right compliance partner. Our team can close that gap in weeks.",
    };
  }
  return {
    score: pct, tier: "Operator", color: "green",
    headline: `You're in execution mode for ${sector} — optimise for margin and compliance.`,
    summary:
      "You already have skin in the game. The highest-leverage move now is tightening your credit strategy, building an audit-ready trail, and exploring enterprise client acquisition channels.",
  };
}

/* ─── Fixed CTAs ─────────────────────────────────────────────────────────── */

export const FIXED_CTAS = [
  {
    icon: BookOpen,
    title: "Join Our EPR Course",
    desc: "Learn EPR regulations, sector operations, and compliance workflows — structured for new entrants.",
    href: "/courses",
    cta: "Explore Courses",
    accent: "teal",
  },
  {
    icon: FileText,
    title: "Buy a Bank-Loan Ready Business Plan",
    desc: "Investor- and bank-grade waste management business plans with financials, market data, and compliance roadmap.",
    href: "/resources",
    cta: "Get Business Plan",
    accent: "amber",
  },
  {
    icon: Briefcase,
    title: "Connect with a Launch Consultant",
    desc: "1-on-1 session with an EPR specialist to map your registration, vendor network, and first 90 days.",
    href: "/contact",
    cta: "Book a Consultation",
    accent: "cyan",
  },
];

export const colorMap = {
  amber: { badge: "border-amber-300/40 bg-amber-300/10 text-amber-200", bar: "bg-amber-300", score: "text-amber-300", ring: "ring-amber-300/30" },
  cyan:  { badge: "border-cyan-300/40 bg-cyan-300/10 text-cyan-200",   bar: "bg-cyan-300",  score: "text-cyan-300",  ring: "ring-cyan-300/30"  },
  teal:  { badge: "border-teal-300/40 bg-teal-300/10 text-teal-200",   bar: "bg-teal-300",  score: "text-teal-300",  ring: "ring-teal-300/30"  },
  green: { badge: "border-green-300/40 bg-green-300/10 text-green-200",bar: "bg-green-400", score: "text-green-300", ring: "ring-green-300/30" },
};

export const accentMap = {
  teal:  "border-teal-300/35 bg-teal-400/10 text-teal-300",
  amber: "border-amber-300/35 bg-amber-400/10 text-amber-300",
  cyan:  "border-cyan-300/35 bg-cyan-400/10 text-cyan-300",
};

/* ─── Steps ──────────────────────────────────────────────────────────────── */

const TOTAL_QUIZ_STEPS = questions.length;
const LEAD_STEP        = TOTAL_QUIZ_STEPS + 1;
const RESULT_STEP      = TOTAL_QUIZ_STEPS + 2;

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function BusinessReadinessQuiz({ compact = false }) {
  const [step,     setStep]     = useState(0);
  // answers[id] = { value, weight }
  const [answers,  setAnswers]  = useState({});
  // selected = option value string (unique per question)
  const [selected, setSelected] = useState(null);
  const [result,   setResult]   = useState(null);

  const [lead,       setLead]       = useState({ name: "", email: "", phone: "" });
  const [leadErrors, setLeadErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");
  const [reviewRequested, setReviewRequested] = useState(false);

  const qIndex   = step - 1;
  const currentQ = questions[qIndex];
  const isLastQ  = qIndex === TOTAL_QUIZ_STEPS - 1;

  function reset() {
    setStep(0); setAnswers({}); setSelected(null); setResult(null);
    setLead({ name: "", email: "", phone: "" });
    setLeadErrors({}); setSubmitting(false); setSubmitErr("");
    setReviewRequested(false);
  }

  function handleSelect(opt) {
    // Store by value string — unique within each question
    setSelected(opt.value);
  }

  function handleNext() {
    if (!selected) return;
    const opt = currentQ.options.find((o) => o.value === selected);
    const updated = { ...answers, [currentQ.id]: { value: selected, weight: opt.weight } };
    setAnswers(updated);
    setSelected(null);
    if (isLastQ) {
      setResult(getProfile(updated));
      setStep(RESULT_STEP);
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step === 1)          { reset(); }
    else if (step === LEAD_STEP) { setStep(TOTAL_QUIZ_STEPS); setSelected(null); }
    else                     { setStep(step - 1); setSelected(null); }
  }

  function validateLead() {
    const errs = {};
    if (!lead.name.trim())  errs.name  = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) errs.email = "Enter a valid email.";
    if (!/^\+?[0-9\s()\-]{10,15}$/.test(lead.phone.trim()))    errs.phone = "Enter a valid phone number.";
    return errs;
  }

  async function handleLeadSubmit() {
    const errs = validateLead();
    if (Object.keys(errs).length) { setLeadErrors(errs); return; }
    setLeadErrors({}); setSubmitting(true); setSubmitErr("");
    try {
      const res = await fetch("/api/public/forms/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:          "get_matched_form",
          name:          lead.name.trim(),
          email:         lead.email.trim(),
          phone:         lead.phone.trim(),
          submitted_at:  Date.now(),
          quiz_stage:    answers.stage?.value,
          quiz_sector:   answers.sector?.value,
          quiz_goal:     answers.goal?.value,
          quiz_timeline: answers.timeline?.value,
          quiz_score:    result?.score,
          quiz_tier:     result?.tier,
          source_page:   "waste_readiness_quiz",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Submission failed.");
      setReviewRequested(true);
      setStep(RESULT_STEP);
    } catch (err) {
      setSubmitErr(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════ */

  /* ── Intro ── */
  if (step === 0) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300">
          <Zap size={28} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">4 Quick Questions</p>
          <h3 className={`mt-2 font-bold text-white ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}>
            Are You Ready to Launch a Waste Management Business?
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Answer 4 questions and get your personalised{" "}
            <strong className="text-white">Readiness Score</strong> — with a step-by-step action plan tailored
            to your sector and stage.
          </p>
        </div>
        <button
          onClick={() => setStep(1)}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-teal-400 px-8 py-3 text-sm font-bold text-slate-900 transition hover:bg-teal-300"
        >
          Start My Assessment <ArrowRight size={15} />
        </button>
        <p className="text-[11px] text-slate-500">Free · No signup required · Takes ~60 seconds</p>
      </div>
    );
  }

  /* ── Lead Capture ── */
  if (step === LEAD_STEP) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Expert review</p>
          <h3 className={`mt-1.5 font-bold text-white ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
            Request a review from our team
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Share your contact details for staff follow-up on your assessment.
          </p>
        </div>

        {result && (
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${colorMap[result.color].badge}`}>
            <span className={`text-2xl font-black ${colorMap[result.color].score}`}>{result.score}%</span>
            <div>
              <p className="text-xs font-semibold text-white">{result.tier} Profile</p>
              <p className="text-[11px] text-slate-400">Indicative assessment for review</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Rajesh Kumar"
                value={lead.name}
                onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
                className={`w-full rounded-xl border bg-slate-900/80 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-teal-400/50 ${leadErrors.name ? "border-red-400/60" : "border-slate-700"}`}
              />
            </div>
            {leadErrors.name && <p className="mt-1 text-[11px] text-red-400">{leadErrors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={lead.email}
                onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
                className={`w-full rounded-xl border bg-slate-900/80 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-teal-400/50 ${leadErrors.email ? "border-red-400/60" : "border-slate-700"}`}
              />
            </div>
            {leadErrors.email && <p className="mt-1 text-[11px] text-red-400">{leadErrors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Contact Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                placeholder="Enter phone number"
                value={lead.phone}
                onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))}
                className={`w-full rounded-xl border bg-slate-900/80 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-teal-400/50 ${leadErrors.phone ? "border-red-400/60" : "border-slate-700"}`}
              />
            </div>
            {leadErrors.phone && <p className="mt-1 text-[11px] text-red-400">{leadErrors.phone}</p>}
          </div>

          {submitErr && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
              {submitErr}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200">
            <ArrowLeft size={13} /> Back
          </button>
          <button
            onClick={handleLeadSubmit}
            disabled={submitting}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-teal-400 px-5 py-2 text-sm font-bold text-slate-900 transition hover:bg-teal-300 disabled:opacity-50"
          >
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <>Request expert review <ArrowRight size={14} /></>}
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-600">
          No spam. Your details are only used to send your report and relevant resources.
        </p>
      </div>
    );
  }

  /* ── Results ── */
  if (step === RESULT_STEP && result) {
    const c = colorMap[result.color];
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${c.badge}`}>
              <CheckCircle2 size={12} /> {result.tier}
            </span>
            <h3 className={`mt-3 font-bold text-white leading-snug ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
              {result.headline}
            </h3>
          </div>
          <div className={`flex shrink-0 flex-col items-center justify-center rounded-2xl border bg-slate-950/60 p-3 ${c.ring} ring-1`}>
            <span className={`text-2xl font-black ${c.score}`}>{result.score}%</span>
            <span className="text-[10px] font-semibold text-slate-400">Ready</span>
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${result.score}%` }} />
        </div>

        <p className="text-sm leading-relaxed text-slate-300">{result.summary}</p>
        <p className="text-xs text-slate-400">Indicative readiness only. Your account team validates applicability and compliance.</p>
        {reviewRequested ? <p role="status" className="text-sm text-teal-200">Review request received. Our team will contact you.</p> : <button type="button" onClick={() => setStep(LEAD_STEP)} className="min-h-11 rounded-lg border border-teal-400 px-4 py-2 text-sm font-semibold text-teal-200">Request expert review</button>}

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Your next steps</p>
          <div className="grid grid-cols-1 gap-3">
            {FIXED_CTAS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-teal-300/50 hover:bg-slate-800/70"
                >
                  <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${accentMap[action.accent]}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-teal-100">{action.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-400">{action.desc}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300">
                      {action.cta} <ArrowRight size={11} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <button onClick={reset} className="mx-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-slate-300">
          <RefreshCw size={11} /> Retake assessment
        </button>
      </div>
    );
  }

  /* ── Question Step ── */
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">
            Question {step} of {TOTAL_QUIZ_STEPS}
          </span>
          <span className="text-[11px] font-semibold text-teal-300">
            {Math.round((step / TOTAL_QUIZ_STEPS) * 100)}% complete
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-teal-400 transition-all duration-300"
            style={{ width: `${(step / TOTAL_QUIZ_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{currentQ.hint}</p>
        <h3 className={`mt-1.5 font-bold text-white ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
          {currentQ.label}
        </h3>
      </div>

      <div className={`grid gap-2 ${currentQ.wide ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {currentQ.options.map((opt) => {
          // Compare by value string — fixes the "all selected" bug
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? "border-teal-300/60 bg-teal-400/15 text-teal-100"
                  : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500 hover:bg-slate-800/70"
              }`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${isActive ? "border-teal-300 bg-teal-300" : "border-slate-600"}`}>
                {isActive && <span className="h-2 w-2 rounded-full bg-slate-900" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200">
          <ArrowLeft size={13} /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selected}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-teal-400 px-5 py-2 text-sm font-bold text-slate-900 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastQ ? "Continue" : "Next"} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

