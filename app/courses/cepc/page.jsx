import Link from 'next/link';

export const metadata = {
  title: 'Tier 2 — Certified EPR Professional Consultant (CEPC) | EPR Academy',
  description:
    'Become a Certified EPR Professional Consultant in 12 weeks. Master compliance consulting, client acquisition and EPR filings. Live online. ₹5,000 only.',
};

const CURRICULUM = [
  { week: 'Weeks 1–3', title: 'EPR Regulatory Mastery', topics: ['PWM, E-Waste, Battery, Tyre & ELV rules in depth', 'CPCB & SPCB portal advanced workflows', 'Target calculation across all waste categories', 'Audit & penalty exposure framework'] },
  { week: 'Weeks 4–6', title: 'Compliance Operations', topics: ['Filing annual returns for producers, importers & BOs', 'EPR credit procurement & settlement strategies', 'Document management & SOP design', 'Handling rejection notices & appeals'] },
  { week: 'Weeks 7–9', title: 'Consulting Practice', topics: ['Client onboarding & obligation mapping', 'Gap analysis & compliance roadmap delivery', 'Pricing your EPR services (₹15k–₹2L per client)', 'Retainer vs project-based engagement models'] },
  { week: 'Weeks 10–12', title: 'Client Acquisition & Certification', topics: ['LinkedIn, content & referral lead generation', 'Proposal writing & closing techniques', 'Final assessment — 70% pass to get CEPC', 'Listed in the CEPC Directory post-certification'] },
];

const OUTCOMES = [
  'Certified EPR Professional Consultant (CEPC) credential',
  'Consult clients across all 6 EPR waste categories',
  'Charge ₹15,000–₹2,00,000 per client engagement',
  'Listed in the official CEPC Directory',
  'Ready-to-use proposal templates & pricing guides',
  'Access to EPR Academy partner community',
];

const WHO = [
  { role: 'EHS Consultants', desc: 'Add EPR compliance to your service menu & earn more per client' },
  { role: 'Chartered Accountants & CS', desc: 'Offer EPR compliance retainers alongside your existing work' },
  { role: 'Tier 1 Graduates', desc: 'Natural next step — go from awareness to billable consulting' },
  { role: 'Entrepreneurs', desc: 'Launch an EPR compliance consulting firm from scratch' },
];

export default function CEPCPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border-b border-indigo-200/50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-700 px-4 py-1 text-sm font-bold mb-4">
            TIER 2 · CERTIFIED EPR PROFESSIONAL CONSULTANT
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
            Become India's Next<br className="hidden md:block" /> Certified EPR Consultant
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            12-week live online programme. Master compliance consulting, client acquisition and EPR filings across all waste categories — and earn ₹15K–₹2L per client.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/academy/login?program=tier-2"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white font-bold text-lg px-8 py-4 hover:bg-indigo-700 transition shadow-lg"
            >
              Enroll Now — ₹5,000 only →
            </Link>
            <Link
              href="/training_calendar"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-400 text-indigo-600 font-semibold text-base px-6 py-3.5 hover:bg-indigo-50 transition"
            >
              View Upcoming Batches
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>🗓 12 weeks · live online (Sat–Sun)</span>
            <span>📜 CEPC certification</span>
            <span>📋 Listed in CEPC Directory</span>
            <span>💰 ₹5,000 one-time</span>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You'll Get</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex items-start gap-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <span className="text-indigo-600 text-lg mt-0.5">✓</span>
                <span className="text-gray-800 font-medium text-sm">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-14 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">12-Week Curriculum</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CURRICULUM.map((d) => (
              <div key={d.week} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <span className="inline-block rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1 mb-2">{d.week}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{d.title}</h3>
                <ul className="space-y-2">
                  {d.topics.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-indigo-500 mt-0.5 shrink-0">›</span>{t}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Who Should Enroll</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHO.map((w) => (
              <div key={w.role} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{w.role}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3">Launch Your EPR Consulting Career</h2>
          <p className="text-indigo-200 mb-8">Earn ₹15K–₹2L per client. Get certified. Get listed. Batches are limited to 25 seats.</p>
          <Link
            href="/academy/login?program=tier-2"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-600 font-bold text-lg px-8 py-4 hover:bg-indigo-50 transition shadow-lg"
          >
            Enroll Now — ₹5,000 →
          </Link>
          <p className="mt-4 text-sm text-indigo-200/80">Have questions? <a href="/contact" target="_blank" rel="noopener noreferrer" className="underline">Talk to our team</a></p>
        </div>
      </section>

      {/* Navigation between tiers */}
      <section className="py-10 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between gap-3 text-sm">
          <Link href="/courses/epr-awareness-bootcamp" className="rounded-lg border border-gray-300 text-gray-600 font-medium px-4 py-2 hover:border-eco-green-4 hover:text-eco-green-4 transition">
            ← Tier 1 — EPR Awareness Bootcamp (₹999)
          </Link>
          <Link href="/courses/ealp" className="rounded-lg border border-amber-400/60 text-amber-700 font-semibold px-4 py-2 hover:bg-amber-50 transition">
            Tier 3 — EPR Agency Leadership (₹50,000) →
          </Link>
        </div>
      </section>
    </div>
  );
}

