import Link from 'next/link';

export const metadata = {
  title: 'Tier 3 — EPR Agency Leadership Programme (EALP) | EPR Academy',
  description:
    'Build and scale your own EPR consulting agency. 6-month executive programme for serious professionals. Mentorship, live clients, revenue systems. ₹50,000.',
};

const PHASES = [
  {
    phase: 'Phase 1 · Month 1–2',
    title: 'Foundation & Expert Positioning',
    topics: [
      'Advanced EPR law — all 6 categories (Plastic, E-Waste, Battery, Tyre, ELV, Used Oil)',
      'Building your niche & ICP (Ideal Client Profile)',
      'LinkedIn authority & content positioning',
      'Pricing architecture: ₹15K to ₹5L engagements',
    ],
  },
  {
    phase: 'Phase 2 · Month 3–4',
    title: 'Agency Systems & Client Delivery',
    topics: [
      'SOP design for onboarding, filing & reporting',
      'Hiring & managing sub-consultants & CAs',
      'Client portal & document workflow setup',
      'Upsell & cross-sell systems for existing clients',
    ],
  },
  {
    phase: 'Phase 3 · Month 5–6',
    title: 'Scale, Revenue & Agency Exit',
    topics: [
      'BD pipeline: corporate, SME & government clients',
      'Partnership channels: PROs, auditors, law firms',
      'Revenue targets: ₹5L–₹25L ARR in 12 months',
      'Final assessment + EALP certification + alumni network',
    ],
  },
];

const OUTCOMES = [
  "EALP certification — India's highest EPR advisory credential",
  'A live agency playbook built during the programme',
  '₹5L–₹25L ARR roadmap with your own client base',
  "Access to EPR Academy's corporate lead-sharing network",
  'Featured on EPR Compass as a verified partner',
  'Lifetime alumni community & quarterly masterclasses',
];

const WHO = [
  { role: 'CEPC Graduates', desc: 'Scale from solo consulting to a full agency operation' },
  { role: 'EHS Firm Founders', desc: 'Add EPR as a high-margin vertical to your practice' },
  { role: 'Senior Corporate Professionals', desc: 'Transition into independent consulting with a proven system' },
  { role: 'Ambitious Entrepreneurs', desc: 'Build a ₹1Cr+ EPR advisory business from the ground up' },
];

export default function EALPPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200/60 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-700 px-4 py-1 text-sm font-bold mb-4">
            TIER 3 · EPR AGENCY LEADERSHIP PROGRAMME
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
            Build a ₹1Cr+ EPR Consulting<br className="hidden md:block" /> Agency in 6 Months
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            India's only executive-level EPR agency-building programme. Get mentorship, live client pipelines, agency SOPs and India's highest EPR advisory credential.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/academy/login?program=tier-3"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 text-white font-bold text-lg px-8 py-4 hover:bg-amber-600 transition shadow-lg"
            >
              Apply Now — ₹50,000 →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-400 text-amber-700 font-semibold text-base px-6 py-3.5 hover:bg-amber-50 transition"
            >
              Book a Discovery Call
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>🗓 6 months · hybrid mentorship</span>
            <span>🏆 EALP certification</span>
            <span>🌐 Listed as Verified Partner</span>
            <span>🎯 Limited to 10 seats per cohort</span>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You'll Build & Earn</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
                <span className="text-amber-600 text-lg mt-0.5">✓</span>
                <span className="text-gray-800 font-medium text-sm">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-14 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">6-Month Programme Phases</h2>
          <div className="space-y-6">
            {PHASES.map((p) => (
              <div key={p.phase} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="inline-block rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1">{p.phase}</span>
                  <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {p.topics.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-amber-500 mt-0.5 shrink-0">›</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Who This Is For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHO.map((w) => (
              <div key={w.role} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-amber-300 transition">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{w.role}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 text-center font-medium">
            ⚠️ This programme is selective. Only 10 seats per cohort. An application + discovery call is required before enrollment.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-amber-500 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3">Ready to Build Your EPR Agency?</h2>
          <p className="text-amber-100 mb-8">10 seats per cohort. Application required. Serious applicants only.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/academy/login?program=tier-3"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-amber-600 font-bold text-lg px-8 py-4 hover:bg-amber-50 transition shadow-lg"
            >
              Apply Now — ₹50,000 →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white text-white font-semibold text-base px-6 py-3.5 hover:bg-amber-600 transition"
            >
              Book Discovery Call
            </Link>
          </div>
          <p className="mt-4 text-sm text-amber-100/80">Questions? <Link href="/contact" className="underline">Contact the EPR Compass team</Link></p>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-10 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-start gap-3 text-sm">
          <Link href="/courses/epr-awareness-bootcamp" className="rounded-lg border border-gray-300 text-gray-600 font-medium px-4 py-2 hover:border-eco-green-4 hover:text-eco-green-4 transition">
            ← Tier 1 — EPR Awareness Bootcamp (₹999)
          </Link>
          <Link href="/courses/cepc" className="rounded-lg border border-indigo-300 text-indigo-600 font-medium px-4 py-2 hover:bg-indigo-50 transition">
            ← Tier 2 — CEPC Certification (₹5,000)
          </Link>
        </div>
      </section>
    </div>
  );
}

