"use client";

import { useState, useRef } from "react";
import { Calendar, Clock, MapPin, Check, ChevronDown } from "lucide-react";
import WebinarRegistrationForm from "@/components/WebinarRegistrationForm";
import CountdownTimer from "@/components/CountdownTimer";
import useScrollReveal from "@/components/useScrollReveal";
import { SITE_CONTACT_WHATSAPP, SITE_CONTACT_WHATSAPP_DIGITS } from "@/lib/siteContact";

/* ── DATA ── */
const PROBLEMS = [
  { icon: "♻️", text: "Unsure how to register as a Producer, Importer or Brand Owner under EPR rules?" },
  { icon: "📋", text: "Struggling to calculate EPR obligations, set targets and file returns with CPCB?" },
  { icon: "📑", text: "Difficulty finding authorised PROs, recyclers and managing compliance documentation?" },
];

const LEARNINGS = [
  { icon: "🏭", title: "Understanding EPR Framework & PWM Rules 2022", desc: "Learn how Extended Producer Responsibility works under India's Plastic Waste Management Rules, key categories, and compliance timelines." },
  { icon: "📝", title: "Registration on CPCB EPR Portal", desc: "Step-by-step guidance to register producers, importers and brand owners and link your account to authorised PROs." },
  { icon: "📊", title: "Target-Setting & Annual Reporting", desc: "Learn how to compute annual EPR targets, track fulfilment, and file accurate annual returns without errors." },
  { icon: "🤝", title: "Selecting PROs & Recyclers", desc: "Understand how to evaluate, onboard and manage CPCB-registered PROs and recyclers for maximum compliance." },
  { icon: "💰", title: "Cost Optimisation & EPR Credits", desc: "Learn about EPR certificate markets, credit trading, and strategies to reduce your overall compliance cost." },
  { icon: "🚀", title: "Launching Your EPR Compliance System", desc: "Get actionable guidance to build an in-house compliance calendar, audit trail and documentation system." },
];

const AUDIENCE = [
  { icon: "🏢", title: "Business Owners & Brands", desc: "Producers, importers and brand owners who deal in plastic-packaged goods and need to meet EPR mandates confidently." },
  { icon: "⚖️", title: "CA / CS / Legal Professionals", desc: "Professionals adding EPR compliance as a new service line to advise FMCG, pharma, e-commerce and retail clients." },
  { icon: "🎓", title: "Students & Consultants", desc: "Environmental management students and sustainability consultants looking to specialise in EPR and circular economy compliance." },
];

const TESTIMONIALS = [
  { name: "Rakesh Sharma", role: "FMCG Brand Owner, Mumbai", stars: 5, text: "This webinar demystified the entire CPCB portal registration in one session. I finally understood what EPR targets mean for my business and how to start." },
  { name: "Priya Menon", role: "CS Professional, Bengaluru", stars: 5, text: "Incredibly structured. The section on PRO selection and EPR credit trading was something I had never seen explained so clearly anywhere online." },
  { name: "Lakshmi Venkataraman", role: "Sustainability Head, Chennai", stars: 5, text: "EPR Compass transformed how our compliance team approaches plastic waste obligations. We are now fully registered and filing on time." },
  { name: "Amit Desai", role: "Import-Export Business, Ahmedabad", stars: 5, text: "As an importer of packaged goods, I had no idea I had EPR obligations. This webinar was an eye-opener and saved us from heavy penalties." },
  { name: "Jayesh Yadav", role: "Environmental Consultant, Pune", stars: 4, text: "The practical examples and live Q&A made it easy to understand complex provisions. Highly recommended for anyone entering the EPR advisory space." },
];

const FAQS = [
  { q: "Do I need any prior knowledge to attend the webinar?", a: "No prior knowledge is required. The webinar is designed for beginners as well as professionals already working in the compliance space." },
  { q: "Will I get a certificate for attending the webinar?", a: "Yes, all attendees will receive an official Certificate of Participation issued by EPR Compass." },
  { q: "Is the webinar live or pre-recorded?", a: "This is a live interactive webinar. A recording will be shared with registered participants for a limited period after the session." },
  { q: "What if I miss the live session?", a: "Registered participants get access to the full recording so you won't miss any content even if you can't attend live." },
  { q: "Can I ask questions during the webinar?", a: "Absolutely. There is a dedicated live Q&A segment at the end where you can ask our EPR training team your specific compliance questions." },
  { q: "What device do I need to attend the webinar?", a: "Any device with a stable internet connection — mobile, tablet, or laptop. The session is hosted on Zoom." },
  { q: "Is this free or paid?", a: "The webinar is FREE to attend. Register now to secure your seat. Premium recordings and advanced materials are available for enrolled members." },
];

/* ── SMALL COMPONENTS ── */
const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const Stars = ({ n = 5 }) => (
  <span className="flex gap-1">
    {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} filled={i < n} />)}
  </span>
);

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} className="border-b border-gray-200 dark:border-gray-700/50 py-5 cursor-pointer group">
      <div className="flex justify-between items-center gap-3">
        <span className="font-semibold text-gray-900 dark:text-white text-[15px] group-hover:text-eco-green-4 transition-colors">{q}</span>
        <ChevronDown size={18} className={`text-eco-green-4 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 mt-3" : "max-h-0"}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function EPRWebinarPage() {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);

  const heroRef = useRef(null);
  const problemsRef = useRef(null);
  const learningsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const audienceRef = useRef(null);
  const mentorRef = useRef(null);
  const certRef = useRef(null);
  const faqRef = useRef(null);

  useScrollReveal(heroRef);
  useScrollReveal(problemsRef, { delay: 0.1 });
  useScrollReveal(learningsRef, { delay: 0.15 });
  useScrollReveal(testimonialsRef, { delay: 0.1 });
  useScrollReveal(audienceRef, { delay: 0.15 });
  useScrollReveal(mentorRef, { delay: 0.1 });
  useScrollReveal(certRef, { delay: 0.15 });
  useScrollReveal(faqRef, { delay: 0.1 });

  const handleEnroll = () => {
    setSelectedTraining({
      id: "epr-webinar-live",
      title: "EPR Compliance Blueprint Webinar",
      type: "webinar",
      date: "28th June 2026",
      time: "7:00 PM IST",
      duration: "2 Hours",
      format: "Online (Zoom)",
      price: 0,
    });
    setRegistrationOpen(true);
  };

  const handleEnrollPremium = () => {
    setSelectedTraining({
      id: "epr-webinar-paid",
      title: "EPR Premium Live Webinar",
      type: "webinar",
      date: "28th June 2026",
      time: "7:00 PM IST",
      duration: "2 Hours",
      format: "Online (Zoom)",
      price: 499,
    });
    setRegistrationOpen(true);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-eco-green-1/10 via-white to-eco-green-2/10 dark:from-eco-navy dark:via-eco-navy-light dark:to-eco-green-5/20" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(13,148,136,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(20,184,166,0.2) 0%, transparent 50%)" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {["🎙️ Live Q&A", "🏆 Free Certificate", "👨‍🏫 Expert Guidance"].map(t => (
                <span key={t} className="bg-eco-green-4/10 border border-eco-green-4/30 text-eco-green-4 text-xs font-semibold px-3 py-1 rounded-full">{t}</span>
              ))}
            </div>
            <h1 className="font-tricks text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Join Our Live <span className="text-eco-green-4">EPR Compliance</span> Webinar
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
              Unlock the secrets of EPR compliance under India&apos;s Plastic Waste Management Rules 2022. Register on CPCB portal, file your targets, and avoid penalties — with industry experts. <strong className="text-gray-900 dark:text-white">Limited Seats — Register Now!</strong>
            </p>
            <div className="flex items-center gap-3 mb-8">
              <Stars n={5} />
              <span className="text-gray-500 dark:text-gray-400 text-sm">1k+ reviews (4.9 of 5)</span>
            </div>
            <button onClick={handleEnroll} className="bg-eco-gradient-r text-white font-bold py-4 px-8 rounded-lg text-lg hover:shadow-lg hover:shadow-eco-green-4/25 transition-all duration-300 hover:-translate-y-0.5">
              🎟️ Enroll Now — It&apos;s Free!
            </button>
            <CountdownTimer targetDate="2026-06-28T19:00:00+05:30" label="Webinar starts in" className="mt-6 max-w-sm" />
          </div>

          {/* Right card */}
          <div className="bg-white dark:bg-eco-navy-light border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 md:p-8 shadow-2xl relative backdrop-blur-sm">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>
              LIVE
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-eco-green-4/20 flex items-center justify-center text-2xl">👨‍💼</div>
              <div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 tracking-widest uppercase">EPR Compass</div>
                <div className="font-bold text-sm">EPR Compliance Blueprint Webinar</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">What you will learn:</p>
            <div className="space-y-2.5 mb-6">
              {[
                "Register as Producer / Importer / Brand Owner on CPCB EPR portal",
                "Set EPR targets and file annual returns correctly",
                "Select PROs, recyclers & trade EPR certificates to cut costs",
                "Build an in-house compliance calendar & avoid penalties",
              ].map(l => (
                <div key={l} className="flex gap-2 items-start">
                  <Check size={14} className="text-eco-ocean-light mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{l}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700/50 pt-4 flex gap-4 flex-wrap mb-5">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Calendar size={12} /> 28th June, 2026</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Clock size={12} /> 7:00 PM IST</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><MapPin size={12} /> Online (Zoom)</span>
            </div>
            <button onClick={handleEnroll} className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white font-bold py-3 rounded-lg transition-colors duration-200 text-sm">
              Register Free →
            </button>
          </div>
        </div>
      </section>

      {/* ── PROBLEMS ── */}
      <section ref={problemsRef} className="bg-gray-50 dark:bg-eco-navy py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">Pain Points</span>
            <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-5 mb-4">Do You Struggle With These Problems?</h2>
            <p className="text-eco-green-4 text-lg font-medium">Find solutions to your biggest EPR compliance challenges:</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PROBLEMS.map(p => (
              <div key={p.text} className="bg-white dark:bg-eco-navy-light border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 border-l-4 border-l-eco-green-4 hover:border-l-eco-ocean transition-colors duration-300">
                <span className="text-3xl mb-4 block">{p.icon}</span>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEARNINGS ── */}
      <section ref={learningsRef} className="bg-white dark:bg-eco-navy-light py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">Curriculum</span>
            <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-5 mb-4">What You&apos;ll Learn to Master EPR Compliance</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-[15px] leading-relaxed">Unlock the secrets of EPR compliance in India. This webinar covers everything you need to confidently register, manage, and grow your compliance practice.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEARNINGS.map(l => (
              <div key={l.title} className="bg-gray-50 dark:bg-eco-navy border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 hover:border-eco-green-4/40 transition-all duration-300 group">
                <span className="text-3xl mb-3 block">{l.icon}</span>
                <h4 className="text-gray-900 dark:text-white font-bold text-[15px] mb-2 group-hover:text-eco-green-4 transition-colors">{l.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section ref={testimonialsRef} className="bg-gray-50 dark:bg-eco-navy py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">Testimonials</span>
            <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-5 mb-4">5,000+ Students Have Already Transformed Their Journey</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white dark:bg-eco-navy-light border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 border-t-2 border-t-eco-green-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-eco-gradient-r flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
                <Stars n={t.stars} />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO SHOULD ATTEND ── */}
      <section ref={audienceRef} className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-eco-green-5 via-eco-green-4 to-eco-navy" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-tricks text-3xl md:text-4xl font-bold text-white">Who Should Attend This Webinar?</h2>
            <p className="text-white/70 text-[15px] mt-3">This webinar is designed for everyone who needs to navigate India&apos;s EPR landscape.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {AUDIENCE.map(a => (
              <div key={a.title} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-6 text-center hover:bg-white/15 transition-colors duration-300">
                <span className="text-4xl mb-4 block">{a.icon}</span>
                <h4 className="font-bold text-[15px] mb-2 text-white">{a.title}</h4>
                <p className="text-white/70 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MENTOR ── */}
      <section ref={mentorRef} className="bg-white dark:bg-eco-navy-light py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[220px_1fr] gap-10 items-center">
          <div className="text-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-eco-green-4/20 to-eco-ocean/20 border-4 border-eco-green-4/40 mx-auto mb-4 flex items-center justify-center text-6xl">
              👨‍💼
            </div>
            <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold px-3 py-1 rounded-full inline-block">
              EPR Expert & CPCB Specialist
            </span>
          </div>
          <div>
            <p className="text-eco-green-4 font-bold text-xs tracking-widest uppercase mb-1">Meet your Mentor</p>
            <h2 className="font-tricks text-3xl font-bold mb-4">EPR Compass Training Team</h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm mb-3">
              Our training team helps producers, importers, consultants and compliance professionals understand EPR obligations and navigate CPCB filing workflows.
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
              Sessions cover topics such as PWM Rules 2022, PRO onboarding, target-setting and EPR certificate trading through practical examples and guided discussions.
            </p>
          </div>
        </div>
      </section>

      {/* ── CERTIFICATE ── */}
      <section ref={certRef} className="bg-gray-50 dark:bg-eco-navy py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-tricks text-3xl md:text-4xl font-bold mb-4">Get Your Official Certificate of Participation</h2>
          </div>
          {/* Certificate mock */}
          <div className="bg-white dark:bg-eco-navy-light border-2 border-eco-green-4/40 rounded-xl p-8 md:p-10 max-w-md mx-auto mb-8 relative shadow-2xl shadow-eco-green-4/5">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-eco-green-4 text-white text-[10px] font-bold px-5 py-1 rounded-full tracking-widest whitespace-nowrap">EPR COMPASS</div>
            <div className="border-t-2 border-b-2 border-eco-green-4/30 py-5 my-3">
              <div className="text-[10px] text-gray-500 tracking-[3px] uppercase mb-2">Certificate of Participation</div>
              <div className="font-tricks text-xs text-gray-600 dark:text-gray-400 mb-1">THIS CERTIFICATE IS AWARDED TO</div>
              <div className="font-tricks text-3xl text-eco-green-4 italic my-2">Your Name Here</div>
              <div className="text-xs text-gray-500 leading-relaxed mt-3">
                For successfully completing the <strong className="text-gray-700 dark:text-gray-300">EPR Compliance Masterclass Webinar</strong><br />
                conducted by <strong className="text-gray-700 dark:text-gray-300">EPR Compass</strong>.
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-left">
                <div className="border-t border-eco-green-4/30 pt-2 text-[11px] text-gray-600 dark:text-gray-400">EPR Compass<br /><span className="text-gray-500 dark:text-gray-600">Training Team</span></div>
              </div>
              <div className="w-12 h-12 rounded-full bg-eco-gradient-r flex items-center justify-center text-white font-black text-[10px] text-center leading-tight">2025<br />EPR</div>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Receive an EPR Compass webinar completion certificate after attending the session.</p>
          <div className="flex gap-2 justify-center flex-wrap mb-8">
            {["✅ Certificate of Participation", "🖥️ On Completion", "🎓 EPR learning resources"].map(t => (
              <span key={t} className="bg-gray-100 dark:bg-eco-navy-light border border-gray-200 dark:border-gray-700/50 text-xs text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
          <button onClick={handleEnroll} className="bg-eco-gradient-r text-white font-bold py-3.5 px-8 rounded-lg text-base hover:shadow-lg hover:shadow-eco-green-4/25 transition-all duration-300">
            🎟️ Enroll Now — It&apos;s Free
          </button>
        </div>
      </section>

      {/* ── PRICING TIERS ── */}
      <section className="bg-white dark:bg-eco-navy-light py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">Pricing</span>
            <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-5 mb-4">Choose Your Webinar Experience</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-[15px]">Join the live session for free, or unlock premium features with recordings and bonus resources.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 p-8 bg-gray-50 dark:bg-eco-navy">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Free Access</p>
              <p className="font-tricks text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">₹0</p>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-8">
                {["Live 2-hour Zoom session", "Live Q&A with the EPR Compass team", "Certificate of Participation", "Access to session chat"].map(i => (
                  <li key={i} className="flex items-start gap-2"><Check size={16} className="text-eco-green-4 mt-0.5 flex-shrink-0" />{i}</li>
                ))}
              </ul>
              <button onClick={handleEnroll} className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white font-bold py-3 rounded-lg transition-colors">
                Register Free →
              </button>
            </div>
            {/* Premium Tier */}
            <div className="rounded-2xl border-2 border-eco-green-4 p-8 bg-white dark:bg-eco-navy relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-eco-green-4 text-white text-[10px] font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
              <p className="text-xs font-bold text-eco-green-4 uppercase tracking-wider">Premium Access</p>
              <p className="font-tricks text-4xl font-bold mt-2 mb-1 text-gray-900 dark:text-white">₹499 <span className="text-base font-normal text-gray-400">+ GST</span></p>
              <p className="text-xs text-gray-500 mb-4">One-time payment</p>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-8">
                {["Everything in Free, plus:", "Full session recording (lifetime access)", "EPR compliance templates & checklists", "Priority Q&A slot", "Bonus: EPR Credit Cost Optimizer Sheet", "30-day email support from instructor"].map(i => (
                  <li key={i} className="flex items-start gap-2"><Check size={16} className="text-eco-green-4 mt-0.5 flex-shrink-0" />{i}</li>
                ))}
              </ul>
              <button onClick={handleEnrollPremium} className="w-full bg-eco-gradient-r text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-eco-green-4/25 transition-all">
                Get Premium Access — ₹499
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section ref={faqRef} className="bg-white dark:bg-eco-navy-light py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-tricks text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="relative py-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-eco-green-5 via-eco-green-4 to-eco-navy" />
        <div className="relative max-w-xl mx-auto">
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Master EPR Compliance?</h2>
          <p className="text-white/75 text-[15px] mb-8">Join producers, importers and consultants learning to manage EPR compliance with EPR Compass.</p>
          <button onClick={handleEnroll} className="bg-white text-eco-navy font-bold py-4 px-10 rounded-lg text-lg hover:bg-gray-100 transition-colors duration-200 shadow-xl">
            🎟️ Register for Free Webinar
          </button>
          <p className="mt-6 text-white/50 text-xs">📅 28th June 2026 &nbsp;|&nbsp; ⏰ 7:00 PM IST &nbsp;|&nbsp; 💻 Online (Zoom) &nbsp;|&nbsp; <a href={`https://wa.me/${SITE_CONTACT_WHATSAPP_DIGITS}`} className="underline underline-offset-2">WhatsApp: {SITE_CONTACT_WHATSAPP}</a></p>
        </div>
      </section>

      {/* Registration Modal */}
      <WebinarRegistrationForm
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        training={selectedTraining}
      />
    </main>
  );
}
