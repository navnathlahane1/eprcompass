"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Users, GraduationCap, BadgeCheck, ArrowRight, CheckCircle2,
  Briefcase, Clock, Wallet, ShieldCheck, Star, Loader2, Award, Quote,
  Upload, FileText, Leaf, XCircle, MessageCircle,
} from "lucide-react";
import RazorpayModal from "@/components/academy/RazorpayModal";
import WhatsAppJoinCTA from "@/components/WhatsAppJoinCTA";
import { getWhatsAppCommunity } from "@/lib/whatsappCommunities";

const PROGRAM_TITLE = "Women Empowerment — Environmental Consultant Program";
const FEE = 4999;
const WA = "/contact";
const WA_COMMUNITY = getWhatsAppCommunity("women-empowerment");
const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;
const pad = (n) => String(n).padStart(2, "0");

const STATS = [
  { icon: Users, value: "100", label: "Women per cohort" },
  { icon: Wallet, value: fmt(FEE), label: "One-time fee" },
  { icon: Clock, value: "8 Weeks", label: "Live + online" },
  { icon: BadgeCheck, value: "Certificate", label: "On completion" },
];
const BADGES = [
  { icon: Award, t: "Certified trainers" },
  { icon: ShieldCheck, t: "CPCB-aligned curriculum" },
  { icon: Users, t: "2,000+ women trained" },
  { icon: Star, t: "4.9 / 5 rating" },
];
const CURRICULUM = [
  { t: "EPR & compliance foundations", d: "PWM Rules 2022, CPCB framework, how EPR works." },
  { t: "Plastic, e-waste, battery & tyre", d: "Category obligations and the consultant's role." },
  { t: "Registrations, filings & returns", d: "Hands-on CPCB portal and documentation." },
  { t: "Working with PIBOs & recyclers", d: "Onboarding clients and managing calendars." },
  { t: "Becoming a practising consultant", d: "Pricing, finding clients, working from home." },
  { t: "Capstone + certification", d: "A real case study reviewed by our experts." },
];
const OUTCOMES = [
  { icon: Briefcase, t: "A new career path", d: "Start as an independent EPR consultant." },
  { icon: Wallet, t: "Earn from home", d: "Serve producers & brand owners flexibly." },
  { icon: ShieldCheck, t: "Recognised skills", d: "A certificate that signals real capability." },
  { icon: Leaf, t: "Real impact", d: "Help businesses reduce environmental harm." },
];
const REVIEWS = [
  { n: "Sunita R.", c: "Pune", q: "I was a homemaker for 9 years. This program gave me the skills and the confidence to take my first compliance client within 6 weeks.", r: 5 },
  { n: "Fatima K.", c: "Hyderabad", q: "The trainers are patient and the CPCB portal practice was the best part. I now handle EPR filings for two small brands.", r: 5 },
  { n: "Meena P.", c: "Ahmedabad", q: "Flexible timings meant I could learn after my kids slept. Worth every rupee — I earn more than my old job.", r: 5 },
  { n: "Anjali D.", c: "Jaipur", q: "From zero environmental background to a certified consultant. The capstone gave me a real portfolio piece.", r: 5 },
];
const TICKER = [
  { n: "Priya", c: "Mumbai", m: 2 }, { n: "Reshma", c: "Surat", m: 6 }, { n: "Kavita", c: "Delhi", m: 9 },
  { n: "Anita", c: "Nagpur", m: 12 }, { n: "Sneha", c: "Indore", m: 17 }, { n: "Lakshmi", c: "Chennai", m: 21 },
];
const QUALS = ["10th Pass", "12th Pass", "Diploma", "Graduate", "Post Graduate", "Professional Degree"];
const STATUSES = ["Homemaker", "Working professional", "Student", "Career break", "Other"];
const EVAL_STEPS = ["Verifying your details", "Reviewing qualification", "Checking experience & resume", "Matching cohort fit"];

function useCountdown(targetMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const diff = Math.max(0, targetMs - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function WomenEmpowermentLanding() {
  const [target] = useState(() => Date.now() + 3 * 86400000 + 4 * 3600000); // ~3 days
  const { d, h, m, s } = useCountdown(target);

  // step: form | evaluating | qualified | review | rejected | payment | success
  const [step, setStep] = useState("form");
  const [evalStep, setEvalStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", age: "", city: "",
    qualification: "", field_of_study: "", current_status: "", experience_years: "", motivation: "",
  });
  const [resume, setResume] = useState(null);
  const fileRef = useRef(null);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  // Live ticker
  const [ti, setTi] = useState(0);
  useEffect(() => { const id = setInterval(() => setTi((x) => (x + 1) % TICKER.length), 3500); return () => clearInterval(id); }, []);

  const goApply = () => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });

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
      if (resume) fd.append("resume", resume);
      const [res] = await Promise.all([
        fetch("/api/public/women-program-apply", { method: "POST", body: fd }),
        new Promise((r) => setTimeout(r, 3400)),
      ]);
      const data = await res.json();
      clearInterval(tick);
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong");
      setResult(data);
      setStep(data.status === "qualified" ? "qualified" : data.status === "review" ? "review" : "rejected");
    } catch (err) {
      clearInterval(tick);
      setErrors({ form: err.message || "Application failed. Please try again." });
      setStep("form");
    }
  };

  const inputCls = "w-full rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-rose-400 outline-none";

  return (
    <main className="bg-white text-gray-900">
      {step === "payment" && (
        <RazorpayModal
          programTitle={PROGRAM_TITLE}
          participantName={form.name}
          participantEmail={form.email}
          participantPhone={form.mobile}
          createOrderUrl="/api/payment/program-order"
          verifyUrl="/api/payment/verify"
          onSuccess={() => setStep("success")}
          onFailure={(msg) => { alert(`Payment failed: ${msg}`); setStep("qualified"); }}
          onClose={() => setStep("qualified")}
        />
      )}

      {/* COUNTDOWN BAR */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-rose-300 font-bold uppercase tracking-wider text-[11px]">Cohort closing</span>
            <span className="hidden sm:inline text-white/80">Applications close in</span>
          </div>
          <div className="flex items-center gap-2">
            {[["Days", d], ["Hrs", h], ["Min", m], ["Sec", s]].map(([l, v]) => (
              <div key={l} className="text-center">
                <div className="bg-white/10 rounded-md px-2 py-1 font-mono font-bold text-base min-w-[40px]">{pad(v)}</div>
                <div className="text-[9px] text-white/60 mt-0.5">{l}</div>
              </div>
            ))}
            <button onClick={goApply} className="ml-2 rounded-lg bg-rose-500 hover:bg-rose-600 px-4 py-2 text-sm font-bold transition">Apply Now →</button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-fuchsia-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} /> Women Empowerment Initiative
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl">
            Become a Certified <span className="text-rose-100">Environmental Consultant</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/90 max-w-2xl">
            We're training <strong>100 educated women &amp; homemakers</strong> to launch a flexible,
            high-impact career — no prior experience needed. <strong>Apply, get screened, and enrol.</strong>
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button onClick={goApply} className="inline-flex items-center gap-2 rounded-xl bg-white text-rose-700 font-bold px-7 py-3.5 text-sm shadow-lg hover:bg-rose-50 transition">
              Apply Now — {fmt(FEE)} <ArrowRight size={16} />
            </button>
            <span className="inline-flex items-center gap-2 text-sm text-white/90"><Star size={15} className="fill-yellow-300 text-yellow-300" /> Only 100 seats per cohort</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {BADGES.map((b) => (
              <span key={b.t} className="inline-flex items-center gap-2 text-sm text-white/90"><b.icon size={16} className="text-rose-100" /> {b.t}</span>
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

      {/* WHO / OUTCOMES */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-4">A career built around <span className="text-rose-600">your life</span></h2>
          <p className="text-gray-600 mb-6">For women who want financial independence and purpose — on a schedule that works around the family.</p>
          <ul className="space-y-3">
            {["Educated women & homemakers", "Graduates of any discipline", "Career-restart mothers", "Anyone passionate about sustainability"].map((w) => (
              <li key={w} className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle2 className="text-rose-600 flex-shrink-0 mt-0.5" size={18} /> {w}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {OUTCOMES.map((o) => (
            <div key={o.t} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
              <o.icon className="text-rose-600 mb-2" size={22} />
              <div className="font-semibold text-sm text-gray-900">{o.t}</div>
              <div className="text-xs text-gray-500 mt-1">{o.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600">What you'll learn</span>
            <h2 className="text-3xl font-bold mt-2">An 8-week practical curriculum</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {CURRICULUM.map((c, i) => (
              <div key={c.t} className="rounded-2xl bg-white border border-gray-200 p-6">
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center mb-3">{i + 1}</div>
                <div className="font-semibold text-gray-900">{c.t}</div>
                <div className="text-sm text-gray-500 mt-1.5">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Success stories</span>
          <h2 className="text-3xl font-bold mt-2">Women who changed their careers</h2>
          <div className="mt-2 inline-flex items-center gap-1 text-sm text-amber-500">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
            <span className="text-gray-500 ml-1">4.9/5 from 2,000+ learners</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {REVIEWS.map((rv) => (
            <div key={rv.n} className="rounded-2xl border border-gray-200 p-6">
              <Quote className="text-rose-300 mb-2" size={22} />
              <p className="text-sm text-gray-700 leading-relaxed">"{rv.q}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-semibold flex items-center justify-center text-xs">{rv.n.split(" ").map((x) => x[0]).join("")}</div>
                <div>
                  <div className="text-sm font-semibold">{rv.n}</div>
                  <div className="text-xs text-gray-500">{rv.c} · {[...Array(rv.r)].map(() => "★").join("")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* APPLY / SCREENING */}
      <section id="apply" className="bg-gradient-to-br from-rose-600 to-purple-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div className="md:sticky md:top-24">
            <h2 className="text-3xl md:text-4xl font-bold">Apply for the next cohort</h2>
            <p className="mt-3 text-white/90">Tell us about yourself. We screen every profile — only the right fit proceeds to payment.</p>
            <div className="mt-6 flex items-end gap-3"><span className="text-5xl font-extrabold">{fmt(FEE)}</span><span className="mb-1.5 text-white/80 text-sm">one-time · only if selected</span></div>
            <ul className="mt-6 space-y-2 text-sm text-white/90">
              {["8 weeks live mentoring", "Practical CPCB portal training", "Capstone + certificate", "Career & client guidance"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 size={16} /> {x}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white text-gray-900 p-6 shadow-2xl">
            {/* FORM */}
            {step === "form" && (
              <form onSubmit={submit} className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2"><GraduationCap className="text-rose-600" size={20} /> Application form</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><input className={inputCls} placeholder="Full name *" value={form.name} onChange={(e) => set("name", e.target.value)} />{errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}</div>
                  <div><input type="number" className={inputCls} placeholder="Age" value={form.age} onChange={(e) => set("age", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><input type="email" className={inputCls} placeholder="Email *" value={form.email} onChange={(e) => set("email", e.target.value)} />{errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}</div>
                  <div><input type="tel" className={inputCls} placeholder="Mobile *" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />{errors.mobile && <p className="text-xs text-rose-600 mt-1">{errors.mobile}</p>}</div>
                </div>
                <input className={inputCls} placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select className={inputCls} value={form.qualification} onChange={(e) => set("qualification", e.target.value)}>
                      <option value="">Highest qualification *</option>
                      {QUALS.map((q) => <option key={q}>{q}</option>)}
                    </select>
                    {errors.qualification && <p className="text-xs text-rose-600 mt-1">{errors.qualification}</p>}
                  </div>
                  <input className={inputCls} placeholder="Field of study" value={form.field_of_study} onChange={(e) => set("field_of_study", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select className={inputCls} value={form.current_status} onChange={(e) => set("current_status", e.target.value)}>
                    <option value="">Current status</option>
                    {STATUSES.map((q) => <option key={q}>{q}</option>)}
                  </select>
                  <input type="number" className={inputCls} placeholder="Years of experience" value={form.experience_years} onChange={(e) => set("experience_years", e.target.value)} />
                </div>
                <textarea className={inputCls} rows={3} placeholder="Why do you want to join this program?" value={form.motivation} onChange={(e) => set("motivation", e.target.value)} />
                <label className="flex items-center gap-3 rounded-lg border border-dashed border-rose-300 px-3 py-2.5 text-sm cursor-pointer hover:bg-rose-50">
                  <Upload size={16} className="text-rose-600" />
                  <span className="text-gray-600 truncate">{resume ? resume.name : "Upload your resume (PDF/DOC, optional)"}</span>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResume(e.target.files?.[0] || null)} />
                </label>
                {errors.form && <p className="text-xs text-rose-600">{errors.form}</p>}
                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-sm transition">
                  Submit Application <ArrowRight size={16} />
                </button>
                <p className="text-[11px] text-gray-400 text-center">Payment is requested only after your profile is selected.</p>
              </form>
            )}

            {/* EVALUATING */}
            {step === "evaluating" && (
              <div className="py-6 text-center">
                <Loader2 size={40} className="mx-auto text-rose-600 animate-spin" />
                <h3 className="text-lg font-bold mt-4">Evaluating your profile…</h3>
                <p className="text-sm text-gray-500 mt-1">Please wait while we review your application.</p>
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

            {/* QUALIFIED */}
            {step === "qualified" && (
              <div className="py-4 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3"><CheckCircle2 className="text-emerald-600" size={30} /></div>
                <h3 className="text-xl font-bold">You're selected! 🎉</h3>
                <p className="text-sm text-gray-600 mt-2">{result?.message}</p>
                <button onClick={() => setStep("payment")} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-sm transition">
                  Proceed to Secure Payment — {fmt(FEE)} <ArrowRight size={16} />
                </button>
                <p className="text-[11px] text-gray-400 mt-2">Secure payment via Razorpay</p>
              </div>
            )}

            {/* REVIEW / WAITLIST */}
            {(step === "review" || step === "rejected") && (
              <div className="py-6 text-center">
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 ${step === "review" ? "bg-amber-100" : "bg-gray-100"}`}>
                  {step === "review" ? <Clock className="text-amber-600" size={28} /> : <XCircle className="text-gray-500" size={28} />}
                </div>
                <h3 className="text-lg font-bold">{step === "review" ? "Profile under review" : "Application received"}</h3>
                <p className="text-sm text-gray-600 mt-2">{result?.message}</p>
                <a href={WA} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-[#052e16] font-semibold py-2.5 px-5 text-sm transition">
                  <MessageCircle size={16} /> Chat with us on WhatsApp
                </a>
              </div>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <div className="py-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3"><Award className="text-emerald-600" size={30} /></div>
                <h3 className="text-xl font-bold">Enrolment confirmed! 🎉</h3>
                <p className="text-sm text-gray-600 mt-2">Welcome aboard, {form.name}. Our team will share your cohort schedule shortly.</p>
                <div className="mt-5">
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


