"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, Users, GraduationCap, BadgeCheck, ArrowRight, CheckCircle2,
  Briefcase, Clock, ShieldCheck, Star, Loader2, Award, Leaf, MessageCircle,
  Wifi, Gift, FileCheck, Network,
} from "lucide-react";

import WhatsAppJoinCTA from "@/components/WhatsAppJoinCTA";
import { getWhatsAppCommunity } from "@/lib/whatsappCommunities";

const PROGRAM_KEY = "internship";
const WA = "/contact";
const WA_COMMUNITY = getWhatsAppCommunity("internship");
const pad = (n) => String(n).padStart(2, "0");

const STATS = [
  { icon: Users, value: "25", label: "Internship seats" },
  { icon: Gift, value: "FREE", label: "100% free program" },
  { icon: Wifi, value: "Remote", label: "Work from anywhere" },
  { icon: BadgeCheck, value: "Certificate", label: "On completion" },
];
const HIGHLIGHTS = [
  { icon: Users, t: "Limited to 25 interns" },
  { icon: Gift, t: "100% free program" },
  { icon: Wifi, t: "Remote opportunity" },
  { icon: Briefcase, t: "Work on live projects" },
  { icon: FileCheck, t: "Internship certificate" },
  { icon: Award, t: "Industry mentorship" },
  { icon: Award, t: "Paid internship opportunity" },
  { icon: Award, t: "Performance-based stipend" },
];
const WHO = [
  "Students", "Fresh graduates", "Environmental science students", "Engineering students",
  "MBA students", "Sustainability enthusiasts", "Individuals seeking industry experience",
];
const BENEFITS = [
  { icon: Gift, t: "No registration fee", d: "The internship is completely free to join." },
  { icon: Briefcase, t: "Real industry exposure", d: "Work on actual compliance projects." },
  { icon: Award, t: "Learn from experts", d: "Mentorship from industry professionals." },
  { icon: FileCheck, t: "Completion certificate", d: "An internship certificate for your resume." },
  { icon: Network, t: "Networking", d: "Connect with mentors and peers in the sector." },
  { icon: ShieldCheck, t: "Professional experience", d: "Build credibility for future roles." },
  { icon: Award, t: "Paid internship", d: "Performance-based monthly stipend for selected interns." },
];
const LEARN = [
  { t: "Extended Producer Responsibility (EPR)", d: "Foundations of India's EPR framework." },
  { t: "Plastic Waste Management Rules", d: "PWM Rules 2022 in practice." },
  { t: "E-Waste compliance", d: "Obligations and the consultant's role." },
  { t: "Battery Waste Management", d: "Category rules and filings." },
  { t: "CPCB portal operations", d: "Hands-on portal navigation & filing." },
  { t: "Client documentation", d: "Preparing compliance paperwork." },
  { t: "Compliance research", d: "Tracking rules, notices and updates." },
  { t: "Sustainability consulting basics", d: "How advisory engagements work." },
];
const STEPS = [
  { n: "1", t: "Submit application", d: "Fill the short form below." },
  { n: "2", t: "Profile review", d: "We review your background & fit." },
  { n: "3", t: "Intro discussion", d: "A short introductory call." },
  { n: "4", t: "Selection", d: "Shortlisted candidates are confirmed." },
  { n: "5", t: "Onboarding", d: "Start your internship & live projects." },
];
const TICKER = [
  { n: "Rahul", c: "Mumbai", m: 2 }, { n: "Sneha", c: "Surat", m: 6 }, { n: "Aman", c: "Delhi", m: 9 },
  { n: "Priya", c: "Nagpur", m: 12 }, { n: "Karan", c: "Indore", m: 17 }, { n: "Neha", c: "Chennai", m: 21 },
];
const QUALS = ["Pursuing Graduation", "Graduate", "Post Graduate", "Diploma", "12th Pass"];
const STATUSES = ["Student", "Fresher", "Graduate", "Professional"];
const EVAL_STEPS = ["Submitting your application", "Reviewing your profile", "Checking eligibility", "Matching with the batch"];

function useCountdown(targetMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const diff = Math.max(0, targetMs - now);
  return { d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
}

export default function InternshipLanding() {
  const [target] = useState(() => Date.now() + 3 * 86400000 + 4 * 3600000);
  const { d, h, m, s } = useCountdown(target);

  const [step, setStep] = useState("form"); // form | evaluating | success
  const [evalStep, setEvalStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", email: "", mobile: "", city: "", qualification: "", current_status: "", motivation: "" });

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const [ti, setTi] = useState(0);
  useEffect(() => { const id = setInterval(() => setTi((x) => (x + 1) % TICKER.length), 3500); return () => clearInterval(id); }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = "Valid email required";
    if (form.mobile.replace(/\D/g, "").length < 8) er.mobile = "Valid mobile required";
    if (!form.qualification) er.qualification = "Select your qualification";
    if (Object.keys(er).length) { setErrors(er); return; }

    setStep("evaluating"); setEvalStep(0);
    const tick = setInterval(() => setEvalStep((x) => Math.min(x + 1, EVAL_STEPS.length - 1)), 800);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("program", PROGRAM_KEY);
      const [res] = await Promise.all([
        fetch("/api/public/women-program-apply", { method: "POST", body: fd }),
        new Promise((r) => setTimeout(r, 3200)),
      ]);
      const data = await res.json();
      clearInterval(tick);
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong");
      setStep("success");
    } catch (err) {
      clearInterval(tick);
      setErrors({ form: err.message || "Application failed. Please try again." });
      setStep("form");
    }
  };

  const inputCls = "w-full rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-rose-400 outline-none";

  return (
    <main className="bg-white text-gray-900">
      {/* COUNTDOWN BAR */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-rose-300 font-bold uppercase tracking-wider text-[11px]">Batch closing</span>
            <span className="hidden sm:inline text-white/80">Applications close in</span>
          </div>
          <div className="flex items-center gap-2">
            {[["Days", d], ["Hrs", h], ["Min", m], ["Sec", s]].map(([l, v]) => (
              <div key={l} className="text-center">
                <div className="bg-white/10 rounded-md px-2 py-1 font-mono font-bold text-base min-w-[40px]">{pad(v)}</div>
                <div className="text-[9px] text-white/60 mt-0.5">{l}</div>
              </div>
            ))}
            <button onClick={() => scrollTo("apply")} className="ml-2 rounded-lg bg-rose-500 hover:bg-rose-600 px-4 py-2 text-sm font-bold transition">Apply Now →</button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-fuchsia-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} /> Environmental Compliance Internship Program
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl">
            Launch Your Career in <span className="text-rose-100">Environmental Compliance</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/90 max-w-2xl">
            Gain hands-on experience in EPR Compliance, E-Waste Management, Plastic Waste Management,
            Battery Waste Management, Sustainability Consulting, and Regulatory Compliance.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button onClick={() => scrollTo("apply")} className="inline-flex items-center gap-2 rounded-xl bg-white text-rose-700 font-bold px-7 py-3.5 text-sm shadow-lg hover:bg-rose-50 transition">
              Apply for Internship <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollTo("details")} className="inline-flex items-center gap-2 rounded-xl border border-white/40 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10 transition">
              View Program Details
            </button>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 max-w-2xl">
            {HIGHLIGHTS.map((b) => (
              <span key={b.t} className="inline-flex items-center gap-2 text-sm text-white/90"><CheckCircle2 size={16} className="text-rose-100" /> {b.t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE TICKER */}
      <div className="bg-rose-50 border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-center gap-2 text-sm text-rose-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <strong>{TICKER[ti].n}</strong> from {TICKER[ti].c} just applied · {TICKER[ti].m} min ago
        </div>
      </div>

      {/* STATS */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s2) => (
            <div key={s2.label} className="text-center">
              <s2.icon className="mx-auto mb-2 text-rose-600" size={26} />
              <div className="text-2xl font-extrabold text-gray-900">{s2.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s2.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHO / BENEFITS */}
      <section id="details" className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-3xl font-bold mb-4">Who can <span className="text-rose-600">apply</span></h2>
          <p className="text-gray-600 mb-6">
            This internship is designed for students, freshers, and aspiring environmental professionals who want
            practical exposure to India's growing environmental compliance and sustainability sector.
          </p>
          <ul className="space-y-3">
            {WHO.map((w) => (
              <li key={w} className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle2 className="text-rose-600 flex-shrink-0 mt-0.5" size={18} /> {w}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">Program benefits</h3>
          <div className="grid grid-cols-2 gap-4">
            {BENEFITS.map((o) => (
              <div key={o.t} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
                <o.icon className="text-rose-600 mb-2" size={22} />
                <div className="font-semibold text-sm text-gray-900">{o.t}</div>
                <div className="text-xs text-gray-500 mt-1">{o.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="font-semibold text-gray-900 flex items-center gap-2"><Award size={16} className="text-rose-600" /> Paid internship</div>
            <p className="text-sm text-gray-600 mt-2">Selected interns who actively participate, complete assigned tasks, and contribute to live projects may receive a performance-based monthly stipend during the internship period. The amount depends on performance, attendance, project contribution, and task completion.</p>
          </div>
        </div>
      </section>

      {/* WHAT INTERNS WILL LEARN */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600">What interns will learn</span>
            <h2 className="text-3xl font-bold mt-2">Practical, industry-ready skills</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {LEARN.map((c, i) => (
              <div key={c.t} className="rounded-2xl bg-white border border-gray-200 p-6">
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center mb-3">{i + 1}</div>
                <div className="font-semibold text-gray-900">{c.t}</div>
                <div className="text-sm text-gray-500 mt-1.5">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLICATION PROCESS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Application process</span>
          <h2 className="text-3xl font-bold mt-2">From application to onboarding</h2>
        </div>
        <div className="grid md:grid-cols-5 gap-5">
          {STEPS.map((st) => (
            <div key={st.n} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-lg">{st.n}</div>
              <div className="font-semibold mt-3 text-sm">{st.t}</div>
              <div className="text-xs text-gray-500 mt-1">{st.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="bg-gradient-to-br from-rose-600 to-purple-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div className="md:sticky md:top-24">
            <h2 className="text-3xl md:text-4xl font-bold">Applications Open for the Next Internship Batch</h2>
            <p className="mt-3 text-white/90">Only 25 internship positions are available. Apply now and gain practical experience in India's rapidly growing environmental compliance industry.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-lg font-extrabold"><Gift size={20} /> 100% Free Internship</div>
            <ul className="mt-6 space-y-2 text-sm text-white/90">
              {["Mode: Remote", "Seats available: 25", "Duration: As per current batch", "Fee: FREE (no registration fee)", "Stipend: Performance-based (for selected interns)", "Certificate: Yes"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 size={16} /> {x}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white text-gray-900 p-6 shadow-2xl">
            {step === "form" && (
              <form onSubmit={submit} className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2"><GraduationCap className="text-rose-600" size={20} /> Apply for Internship</h3>
                <div><input className={inputCls} placeholder="Full name *" value={form.name} onChange={(e) => set("name", e.target.value)} />{errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><input type="email" className={inputCls} placeholder="Email *" value={form.email} onChange={(e) => set("email", e.target.value)} />{errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}</div>
                  <div><input type="tel" className={inputCls} placeholder="Mobile number *" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />{errors.mobile && <p className="text-xs text-rose-600 mt-1">{errors.mobile}</p>}</div>
                </div>
                <input className={inputCls} placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select className={inputCls} value={form.qualification} onChange={(e) => set("qualification", e.target.value)}>
                      <option value="">Qualification *</option>
                      {QUALS.map((q) => <option key={q}>{q}</option>)}
                    </select>
                    {errors.qualification && <p className="text-xs text-rose-600 mt-1">{errors.qualification}</p>}
                  </div>
                  <select className={inputCls} value={form.current_status} onChange={(e) => set("current_status", e.target.value)}>
                    <option value="">Current status</option>
                    {STATUSES.map((q) => <option key={q}>{q}</option>)}
                  </select>
                </div>
                <textarea className={inputCls} rows={3} placeholder="Why do you want to join?" value={form.motivation} onChange={(e) => set("motivation", e.target.value)} />
                {errors.form && <p className="text-xs text-rose-600">{errors.form}</p>}
                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-sm transition">
                  Apply Now <ArrowRight size={16} />
                </button>
                <p className="text-[11px] text-gray-400 text-center">100% free — no registration fee.</p>
              </form>
            )}

            {step === "evaluating" && (
              <div className="py-6 text-center">
                <Loader2 size={40} className="mx-auto text-rose-600 animate-spin" />
                <h3 className="text-lg font-bold mt-4">Submitting your application…</h3>
                <p className="text-sm text-gray-500 mt-1">Please wait a moment.</p>
                <div className="mt-5 space-y-2 text-left max-w-xs mx-auto">
                  {EVAL_STEPS.map((st, i) => (
                    <div key={st} className={`flex items-center gap-2 text-sm ${i <= evalStep ? "text-gray-800" : "text-gray-300"}`}>
                      {i < evalStep ? <CheckCircle2 size={16} className="text-emerald-500" /> : i === evalStep ? <Loader2 size={16} className="text-rose-500 animate-spin" /> : <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />}
                      {st}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="py-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3"><CheckCircle2 className="text-emerald-600" size={30} /></div>
                <h3 className="text-xl font-bold">Thank you for applying.</h3>
                <p className="text-sm text-gray-600 mt-2">Our team will review your application and contact shortlisted candidates.</p>
                <a href={WA} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-[#052e16] font-semibold py-2.5 px-5 text-sm transition">
                  <MessageCircle size={16} /> Chat with us on WhatsApp
                </a>
                <div className="mt-4">
                  <WhatsAppJoinCTA communityName={WA_COMMUNITY.name} link={WA_COMMUNITY.link} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LEGAL FOOTER */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            <a href="/terms-and-conditions" className="hover:text-white transition">Terms &amp; Conditions</a>
            <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
            <a href="/refund-cancellation-policy" className="hover:text-white transition">Refund &amp; Cancellation Policy</a>
            <a href="/shipping-delivery-policy" className="hover:text-white transition">Shipping &amp; Delivery Policy</a>
            <a href="/results-earnings-disclaimer" className="hover:text-white transition">Results / Earnings Disclaimer</a>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div><span className="font-semibold text-white/90">EPR Compass</span> &copy; 2026 Neubrain Solutions Pvt. Ltd. All rights reserved.</div>
            <div className="text-white/50">Transparent policies for payment gateway and learner trust.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}


