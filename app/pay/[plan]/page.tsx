"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useState } from "react";
import Script from "next/script";
import { ShieldCheck, Lock, BadgeCheck, CheckCircle2 } from "lucide-react";
import { trackEvent, trackRevenue } from "@/lib/analytics";

/* ─── Single-product plans ─────────────────────────────────────────────────── */
const PLANS: Record<string, {
  name: string;
  subtitle: string;
  amountInr: number;
  badge: string | null;
  features: string[];
}> = {
  "cepc-associate": {
    name: "CEPC Associate",
    subtitle: "Certified EPR Professional Consultant — Associate",
    amountInr: 15000,
    badge: null,
    features: [
      "Official CEPC Associate certificate",
      "EPR compliance fundamentals (all 8 categories)",
      "CPCB portal walkthrough guide",
      "6-month email support",
      "Access to CEPC member community",
      "1 state EPR filing reference kit",
    ],
  },
  "cepc-professional": {
    name: "CEPC Professional",
    subtitle: "Certified EPR Professional Consultant — Professional",
    amountInr: 35000,
    badge: "Most Popular",
    features: [
      "Everything in Associate",
      "Advanced EPR audit & return filing",
      "3-state filing support documents",
      "CPCB portal hands-on training (recorded)",
      "1:1 onboarding call (30 min)",
      "12-month priority email support",
      "Listing on CEPC Directory",
    ],
  },
  "cepc-expert": {
    name: "CEPC Expert",
    subtitle: "Certified EPR Professional Consultant — Expert",
    amountInr: 60000,
    badge: "Premium",
    features: [
      "Everything in Professional",
      "Unlimited state filing guides",
      "EPR agency launch playbook",
      "3 live 1:1 mentorship sessions",
      "Featured listing on CEPC Directory",
      "Co-branding rights for client proposals",
      "Lifetime community access",
    ],
  },
  "women-empowerment": {
    name: "Women Empowerment Program",
    subtitle: "Become a Certified Environmental Consultant",
    amountInr: 4999,
    badge: "Limited Seats",
    features: [
      "8-week live mentorship program",
      "CPCB portal hands-on training",
      "Capstone project + certificate",
      "Career & client guidance",
      "Access to EPR consultant community",
      "Performance-based earning opportunities",
    ],
  },
  "students": {
    name: "Student Program",
    subtitle: "Environmental Consultant Program for Students",
    amountInr: 4999,
    badge: null,
    features: [
      "8-week structured program",
      "Live EPR compliance training",
      "Capstone project + certificate",
      "Internship & placement guidance",
      "Access to EPR consultant community",
      "Real-world case studies",
    ],
  },
  "freelancer-network": {
    name: "EPR Freelancer Network",
    subtitle: "Join India's leading EPR consulting freelancer network",
    amountInr: 999,
    badge: null,
    features: [
      "Profile verification & listing",
      "Access to live consulting opportunities",
      "Work with verified clients",
      "Flexible — full-time or project-based",
      "Continuous learning & regulatory updates",
      "National EPR professional network",
    ],
  },
};

/* ─── CEPC 3-tier options shown on cepc-for-* pages ────────────────────────── */
const CEPC_TIERS = [
  {
    planId: "cepc-associate",
    name: "Associate",
    amountInr: 15000,
    badge: null as string | null,
    features: [
      "Official CEPC Associate certificate",
      "EPR compliance fundamentals (all 8 categories)",
      "CPCB portal walkthrough guide",
      "6-month email support",
      "CEPC member community access",
      "1 state EPR filing reference kit",
    ],
  },
  {
    planId: "cepc-professional",
    name: "Professional",
    amountInr: 35000,
    badge: "Most Popular" as string | null,
    features: [
      "Everything in Associate",
      "Advanced EPR audit & return filing",
      "3-state filing support documents",
      "CPCB portal hands-on training (recorded)",
      "1:1 onboarding call (30 min)",
      "12-month priority email support",
      "Listing on CEPC Directory",
    ],
  },
  {
    planId: "cepc-expert",
    name: "Expert",
    amountInr: 60000,
    badge: "Premium" as string | null,
    features: [
      "Everything in Professional",
      "Unlimited state filing guides",
      "EPR agency launch playbook",
      "3 live 1:1 mentorship sessions",
      "Featured listing on CEPC Directory",
      "Co-branding rights for client proposals",
      "Lifetime community access",
    ],
  },
];

/* ─── Known cepc-for-* slugs (for notFound guard) ───────────────────────────── */
const CEPC_FOR_SLUGS = new Set([
  "cepc-for-ca-firms",
  "cepc-for-company-secretaries",
  "cepc-for-corporate-lawyers",
  "cepc-for-environmental-lawyers",
  "cepc-for-ehs-consultants",
  "cepc-for-esg-consultants",
  "cepc-for-fmcg-consultants",
  "cepc-for-hr-and-ld",
  "cepc-for-import-consultants",
  "cepc-for-iso-auditors",
  "cepc-for-pharma-consultants",
  "cepc-for-supply-chain-consultants",
  "cepc-for-startup-incubators",
  "cepc-for-trade-associations",
  "cepc-for-waste-management",
]);

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Single-plan payment form (used for cepc-associate / women / students / etc.)
   ═══════════════════════════════════════════════════════════════════════════════ */
function SinglePlanPage({ planId, plan }: { planId: string; plan: typeof PLANS[string] }) {
  const router = useRouter();
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handlePay = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ""))) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (typeof window === "undefined" || typeof (window as any).Razorpay !== "function") {
      setError("Razorpay SDK failed to load. Please refresh and try again.");
      return;
    }

    setLoading(true);
    trackEvent("Checkout Started", { plan: planId, amount: plan.amountInr });
    try {
      const res = await fetch("/api/payment/cepc-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, name: name.trim(), email: email.trim(), phone: phone.trim(), sourcePage: `pay/${planId}` }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not create order");

      const rzp = new (window as any).Razorpay({
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "EPR Compass",
        description: data.planName,
        order_id:    data.orderId,
        image:       "/imgs/epr-compass/epr-compass-platform.png",
        prefill:     { name: name.trim(), email: email.trim(), contact: phone.trim() },
        theme:       { color: "#07875f" },
        handler: async (response: any) => {
          try {
            const verify = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            }).then(r => r.json());
            if (!verify.success) throw new Error(verify.message || "Payment verification failed");
            trackEvent("Purchase Completed", {
              plan: planId,
              amount: plan.amountInr,
              payment_id: response.razorpay_payment_id || "",
              order_id: response.razorpay_order_id || "",
            });
            trackRevenue({ amount: plan.amountInr, productId: planId });
            const qs = new URLSearchParams({ payment_id: response.razorpay_payment_id || "", order_id: response.razorpay_order_id || "", plan: planId, page: planId });
            router.push(`/thank-you?${qs.toString()}`);
          } catch (err: any) {
            setError(err.message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Payment initialization failed");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4">
      <section className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — plan details */}
        <div>
          {plan.badge && (
            <span className="inline-block mb-3 text-xs font-semibold px-3 py-1 rounded-full bg-eco-green-4/10 text-eco-green-4 border border-eco-green-4/30">
              {plan.badge}
            </span>
          )}
          <h1 className="font-tricks text-3xl md:text-4xl text-eco-navy dark:text-white mb-1">{plan.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.subtitle}</p>
          <p className="text-4xl font-bold text-eco-navy dark:text-white mb-1">{formatINR(plan.amountInr)}</p>
          <p className="text-xs text-gray-400 mb-8">All inclusive · No hidden fees</p>
          <ul className="space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 size={16} className="text-eco-green-4 mt-0.5 flex-shrink-0" />{f}
              </li>
            ))}
          </ul>
          <div className="mt-8 space-y-2 text-xs text-gray-400">
            <p className="flex items-center gap-2"><ShieldCheck size={13} className="text-eco-green-4" /> Secure Razorpay checkout</p>
            <p className="flex items-center gap-2"><Lock size={13} className="text-eco-green-4" /> SSL encrypted</p>
            <p className="flex items-center gap-2"><BadgeCheck size={13} className="text-eco-green-4" /> Verified business account</p>
          </div>
        </div>

        {/* Right — form */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Your details</h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 min-h-[44px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco-green-4 focus:border-eco-green-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@example.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 min-h-[44px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco-green-4 focus:border-eco-green-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 min-h-[44px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco-green-4 focus:border-eco-green-4" />
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3 mb-5 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Total payable</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatINR(plan.amountInr)}</span>
          </div>
          {error && (
            <div role="alert" className="rounded-lg px-3 py-2 mb-4 text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">{error}</div>
          )}
          <button type="button" onClick={handlePay} disabled={loading} aria-busy={loading}
            className="w-full bg-eco-green-4 hover:bg-eco-green-3 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 min-h-[48px] rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eco-green-4">
            {loading ? "Opening Razorpay…" : `Pay ${formatINR(plan.amountInr)}`}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">Certificate delivered to your email after payment confirmation.</p>
        </div>
      </section>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   3-tier selector page (used for all cepc-for-* pages)
   ═══════════════════════════════════════════════════════════════════════════════ */
function CepcTierPage({ sourcePlanId, pageTitle }: { sourcePlanId: string; pageTitle: string }) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState(0); // index into CEPC_TIERS
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const tier = CEPC_TIERS[selectedTier];

  const handlePay = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ""))) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (typeof window === "undefined" || typeof (window as any).Razorpay !== "function") {
      setError("Razorpay SDK failed to load. Please refresh and try again.");
      return;
    }

    setLoading(true);
    trackEvent("Checkout Started", { plan: tier.planId, amount: tier.amountInr, source_plan: sourcePlanId });
    try {
      const res = await fetch("/api/payment/cepc-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId:     tier.planId,
          name:       name.trim(),
          email:      email.trim(),
          phone:      phone.trim(),
          sourcePage: `pay/${sourcePlanId}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not create order");

      const rzp = new (window as any).Razorpay({
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "EPR Compass",
        description: data.planName,
        order_id:    data.orderId,
        image:       "/imgs/epr-compass/epr-compass-platform.png",
        prefill:     { name: name.trim(), email: email.trim(), contact: phone.trim() },
        theme:       { color: "#07875f" },
        handler: async (response: any) => {
          try {
            const verify = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            }).then(r => r.json());
            if (!verify.success) throw new Error(verify.message || "Payment verification failed");
            trackEvent("Purchase Completed", {
              plan: tier.planId,
              amount: tier.amountInr,
              source_plan: sourcePlanId,
              payment_id: response.razorpay_payment_id || "",
              order_id: response.razorpay_order_id || "",
            });
            trackRevenue({ amount: tier.amountInr, productId: tier.planId });
            const qs = new URLSearchParams({ payment_id: response.razorpay_payment_id || "", order_id: response.razorpay_order_id || "", plan: tier.planId, page: sourcePlanId });
            router.push(`/thank-you?${qs.toString()}`);
          } catch (err: any) {
            setError(err.message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Payment initialization failed");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-tricks text-3xl md:text-4xl text-eco-navy dark:text-white mb-2">
            CEPC Certification
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{pageTitle} · Choose your certification level</p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {CEPC_TIERS.map((t, i) => (
            <button
              key={t.planId}
              type="button"
              onClick={() => setSelectedTier(i)}
              className={`relative rounded-2xl border-2 p-5 text-left transition focus:outline-none ${
                selectedTier === i
                  ? "border-eco-green-4 bg-eco-green-4/5 shadow-lg"
                  : "border-gray-200 dark:border-gray-700 hover:border-eco-green-4/50"
              }`}
            >
              {t.badge && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-eco-green-4 text-white">
                  {t.badge}
                </span>
              )}
              {selectedTier === i && (
                <span className="absolute top-3 left-3 w-4 h-4 rounded-full bg-eco-green-4 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </span>
              )}
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 mt-3">CEPC</p>
              <h3 className="text-lg font-bold text-eco-navy dark:text-white mb-1">{t.name}</h3>
              <p className="text-2xl font-bold text-eco-green-4 mb-3">{formatINR(t.amountInr)}</p>
              <ul className="space-y-1.5">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <CheckCircle2 size={12} className="text-eco-green-4 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Form + pay */}
        <div className="max-w-lg mx-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Your details — paying for <span className="text-eco-green-4">CEPC {tier.name}</span>
          </h2>
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 min-h-[44px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco-green-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@example.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 min-h-[44px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco-green-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 min-h-[44px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco-green-4" />
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3 mb-5 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">CEPC {tier.name} — Total payable</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatINR(tier.amountInr)}</span>
          </div>

          {error && (
            <div role="alert" className="rounded-lg px-3 py-2 mb-4 text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">{error}</div>
          )}

          <button type="button" onClick={handlePay} disabled={loading} aria-busy={loading}
            className="w-full bg-eco-green-4 hover:bg-eco-green-3 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 min-h-[48px] rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eco-green-4">
            {loading ? "Opening Razorpay…" : `Pay ${formatINR(tier.amountInr)} — CEPC ${tier.name}`}
          </button>

          <div className="mt-4 space-y-1.5 text-xs text-gray-400">
            <p className="flex items-center gap-2"><ShieldCheck size={12} className="text-eco-green-4" /> Secure Razorpay checkout</p>
            <p className="flex items-center gap-2"><Lock size={12} className="text-eco-green-4" /> SSL encrypted</p>
            <p className="flex items-center gap-2"><BadgeCheck size={12} className="text-eco-green-4" /> Certificate delivered to your email</p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Root export — routes to correct sub-page
   ═══════════════════════════════════════════════════════════════════════════════ */
const CEPC_FOR_LABELS: Record<string, string> = {
  "cepc-for-ca-firms":                 "For CA Firms",
  "cepc-for-company-secretaries":      "For Company Secretaries",
  "cepc-for-corporate-lawyers":        "For Corporate Lawyers",
  "cepc-for-environmental-lawyers":    "For Environmental Lawyers",
  "cepc-for-ehs-consultants":          "For EHS Consultants",
  "cepc-for-esg-consultants":          "For ESG Consultants",
  "cepc-for-fmcg-consultants":         "For FMCG Consultants",
  "cepc-for-hr-and-ld":                "For HR & L&D",
  "cepc-for-import-consultants":       "For Import Consultants",
  "cepc-for-iso-auditors":             "For ISO Auditors",
  "cepc-for-pharma-consultants":       "For Pharma Consultants",
  "cepc-for-supply-chain-consultants": "For Supply Chain",
  "cepc-for-startup-incubators":       "For Startup Incubators",
  "cepc-for-trade-associations":       "For Trade Associations",
  "cepc-for-waste-management":         "For Waste Management",
};

export default function PayPage() {
  const params = useParams();
  const planId = params?.plan as string;

  if (CEPC_FOR_SLUGS.has(planId)) {
    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <CepcTierPage sourcePlanId={planId} pageTitle={CEPC_FOR_LABELS[planId] ?? ""} />
      </>
    );
  }

  const plan = PLANS[planId];
  if (!plan) notFound();

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <SinglePlanPage planId={planId} plan={plan} />
    </>
  );
}

