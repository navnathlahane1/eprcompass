"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
  CalendarDays,
  Landmark,
  FileWarning,
  Hash,
} from "lucide-react";


const inputCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EPRPenaltyChecker() {
  const [step, setStep] = useState("search"); // search | gate | result

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef(null);

  // ── Chosen company + contact form ──────────────────────────────────────────
  const [selected, setSelected] = useState(null); // { id, name, state } | null
  const [company, setCompany] = useState(""); // resolved display name
  const [form, setForm] = useState({ email: "", phone: "", name: "" });

  // ── Submit + result ────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Debounced company suggestions (companies that have a notice on record).
  useEffect(() => {
    if (step !== "search") return;
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const res = await fetch(`/api/public/penalty-search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSuggestions(Array.isArray(data?.results) ? data.results : []);
      } catch (err) {
        if (err?.name !== "AbortError") setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, step]);

  const goToGate = (picked) => {
    const name = picked ? picked.name : query.trim();
    if (!name || name.length < 2) {
      setError("Please enter your company name.");
      return;
    }
    // If the user didn't click a suggestion, auto-match an exact suggestion.
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const exact = picked || suggestions.find((s) => norm(s.name) === norm(name));
    setSelected(exact || null);
    setCompany(exact ? exact.name : name);
    setError("");
    setStep("gate");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const email = form.email.trim();
    const phone = form.phone.trim();
    const name = form.name.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email.");
    if (phone.replace(/\D/g, "").length < 8) return setError("Please enter a valid mobile number.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/penalty-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { name, email, phone },
          company: { id: selected?.id || null, name: company },
          source_url: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }
      setResult(data);
      setStep("result");
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep("search");
    setQuery("");
    setSuggestions([]);
    setSelected(null);
    setCompany("");
    setForm({ email: "", phone: "", name: "" });
    setResult(null);
    setError("");
  };

  const buildWhatsappUrl = () => {
    const co = result?.company?.name || company;
    const hasPenalty = result?.has_penalty;
    const total = result?.summary?.total_penalty_label;
    const refs = (result?.notices || []).map((n) => n.notice_number).filter(Boolean).join(", ");
    const msg = hasPenalty
      ? `Hi EPR Compass team, I checked the EPR Penalty Checker for "${co}". It shows ${result.notices.length} notice(s) on record${total ? `, total penalty ${total}` : ""}${refs ? ` (notice no. ${refs})` : ""}. I'd like help responding to the notice and closing my EPR shortfall.`
      : `Hi EPR Compass team, I checked the EPR Penalty Checker for "${co}". I'd like help staying EPR-compliant and avoiding penalties.`;
    return "/contact";
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <ShieldAlert size={14} /> EPR Penalty Checker
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Check Your EPR Penalty Status
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Search your company to see if a CPCB / SPCB notice or Environmental Compensation demand
            is on record — and get expert help to respond.
          </p>
        </div>

        {/* ── STEP 1: SEARCH ─────────────────────────────────────────────── */}
        {step === "search" && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Company Name
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); goToGate(null); } }}
                  placeholder="Enter your company name…"
                  className={`${inputCls} pl-9`}
                />
                {searching && (
                  <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-green-4 animate-spin" />
                )}
              </div>
              <button
                onClick={() => goToGate(null)}
                className="flex items-center justify-center gap-2 bg-eco-green-4 hover:bg-eco-green-5 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm whitespace-nowrap"
              >
                <Search size={15} /> Search
              </button>
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {suggestions.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => goToGate(c)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-eco-green-4/5 transition"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Building2 size={16} className="text-eco-green-4 flex-shrink-0" />
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {c.name}
                        </span>
                        {c.applicant_type && (
                          <span className="hidden sm:inline-flex items-center text-xs text-gray-400">
                            {c.applicant_type}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                          {c.notice_count} notice{c.notice_count === 1 ? "" : "s"}
                        </span>
                        <ArrowRight size={14} className="text-gray-400" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 text-[11px] text-gray-400 dark:text-gray-500">
              Enter your company name and press Search. We&apos;ll ask for your email &amp; mobile,
              then show your penalty status instantly.
            </p>
          </div>
        )}

        {/* ── STEP 2: EMAIL + MOBILE GATE ────────────────────────────────── */}
        {step === "gate" && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={18} className="text-eco-green-4" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{company}</p>
            </div>
            {selected?.applicant_type && (
              <p className="text-xs text-gray-400 mb-4 ml-7">{selected.applicant_type}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Enter your email and mobile number to see this company&apos;s penalty status —
              total penalty and notice / document number.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    autoFocus
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@company.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Mobile *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="10-digit mobile"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Your Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
                  <AlertTriangle size={16} className="flex-shrink-0" /> {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep("search"); setError(""); }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-eco-green-4 hover:bg-eco-green-5 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm"
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Checking…</>
                  ) : (
                    <>Show My Penalty Status <ArrowRight size={15} /></>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                We respect your privacy. Your details are used only to share your compliance report.
              </p>
            </form>
          </div>
        )}

        {/* ── STEP 3: RESULT ─────────────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="space-y-5">
            {result.has_penalty ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                    <FileWarning className="w-5 h-5 text-red-600 dark:text-red-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.summary.notice_count} notice{result.summary.notice_count === 1 ? "" : "s"} on record for {result.company.name}
                    </h3>
                    {result.summary.total_penalty_label && (
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Total penalty / Environmental Compensation:{" "}
                        <span className="font-bold text-base">{result.summary.total_penalty_label}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      No penalty notice on record for {result.company.name}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                      We didn&apos;t find a published EPR notice for this company in our registry.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notice cards */}
            {result.notices.map((n, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{n.notice_type}</p>
                    <p className="text-xs text-eco-green-4 font-mono mt-0.5 flex items-center gap-1">
                      <Hash size={11} /> Notice / Document No.: {n.notice_number}
                    </p>
                  </div>
                  {n.penalty_label && (
                    <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {n.penalty_label}
                    </span>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <CalendarDays size={14} className="text-gray-400" />
                    <span>Notice date: <span className="font-medium">{formatDate(n.notice_date)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Landmark size={14} className="text-gray-400" />
                    <span>Authority: <span className="font-medium">{n.authority || "—"}</span></span>
                  </div>
                  {n.waste_category && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <ShieldAlert size={14} className="text-gray-400" />
                      <span>Category: <span className="font-medium">{n.waste_category}</span></span>
                    </div>
                  )}
                  {n.shortfall_mt != null && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <AlertTriangle size={14} className="text-gray-400" />
                      <span>Shortfall: <span className="font-medium">{n.shortfall_mt.toLocaleString("en-IN")} MT</span></span>
                    </div>
                  )}
                </div>
                {n.violation_summary && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                    {n.violation_summary}
                  </p>
                )}
              </div>
            ))}

            {/* Compliance help message */}
            <div className="rounded-2xl border border-eco-green-4/30 bg-eco-green-4/5 p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldAlert size={18} className="text-eco-green-4" /> How we can help
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {result.has_penalty
                  ? "Our legal compliance team will respond to the penalties on your behalf. We draft and file the reply to the authority within the notice window, complete the entire legal compliance, and represent you through any litigation — working to get the penalty reduced or closed. Don't wait for the deadline to pass."
                  : "Staying ahead of EPR obligations is the cheapest form of compliance. Our legal compliance team can review your registration, targets and filings so you never receive a notice in the first place. Get a free compliance check today."}
              </p>
            </div>

            {/* Contact CTA + reset */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={buildWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-[#052e16] font-semibold py-3 rounded-lg transition text-sm"
              >
                <MessageCircle size={17} /> Contact our team
              </a>
              <button
                onClick={reset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-3 px-5 rounded-lg transition text-sm"
              >
                <RotateCcw size={15} /> Check another
              </button>
            </div>
          </div>
        )}
        <p className="mt-8 max-w-3xl mx-auto text-xs leading-5 text-gray-500 dark:text-gray-400">
          Indicative only. Environmental Compensation and notices arise under the Environment (Protection) Act, 1986 and category rules (PWM Rules 2016 as amended, E-Waste 2022, Battery 2022, Tyre 2022) as administered by CPCB/SPCBs. Last reviewed 2026. Confirm the live notice and formula with counsel before acting.
        </p>
      </div>
    </section>
  );
}
