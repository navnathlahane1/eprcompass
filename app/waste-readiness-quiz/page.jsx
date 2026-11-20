import BusinessReadinessQuiz from "../components/BusinessReadinessQuiz";
import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";

export const metadata = {
  title: "Waste Management Business Readiness Quiz | EPR Compass",
  description:
    "Take our free 60-second assessment and get a personalised readiness score with a step-by-step action plan for launching your waste management business in India.",
};

export default function WasteReadinessQuizPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Background ── */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(251,191,36,0.10),transparent_35%)] " />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(148,163,184,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.3)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6">

        {/* ── Back nav ── */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
        >
          <ArrowLeft size={13} /> Back to Home
        </Link>

        {/* ── Page header ── */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200">
            <Leaf size={13} /> Free Business Assessment
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Launch Your Waste Management Business
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Answer 4 questions and receive a personalised <span className="text-white font-medium">Readiness Score</span> with
            a sector-specific action plan — covering 16 waste categories across India's EPR framework.
          </p>

          {/* Trust chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["Free", "No signup needed", "~60 seconds", "16 waste sectors covered"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Quiz card ── */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-[0_24px_80px_-28px_rgba(20,184,166,0.3)] backdrop-blur sm:p-10">
          <BusinessReadinessQuiz />
        </div>

        {/* ── Footer note ── */}
        <p className="mt-8 text-center text-[11px] text-slate-600">
          EPR Compass · India's EPR Compliance & Recycling Business Platform ·{" "}
          <Link href="/privacy-policy" className="underline hover:text-slate-400">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}

