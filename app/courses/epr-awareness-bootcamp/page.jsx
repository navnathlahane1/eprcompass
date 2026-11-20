import Link from 'next/link';

export const metadata = {
  title: 'Tier 1 — EPR Awareness Bootcamp | EPR Academy',
  description:
    "India's fastest EPR compliance crash course. 2-day live online bootcamp covering PWM Rules, EPR portal, plastic waste accounting & credit trading. ₹999 only.",
};

const CURRICULUM = [
  { day: 'Day 1', title: 'EPR Regulations & Portal', topics: ['PWM Rules 2016 & 2022 — obligations by entity', 'CPCB & SPCB portal navigation live walkthrough', 'Producer vs Importer vs Brand Owner — who owes what', 'EPR targets, timelines & penalty exposure'] },
  { day: 'Day 2', title: 'Compliance Operations & Credit Trading', topics: ['Plastic waste accounting methodology', 'EPR credit generation, purchase & settlement', 'Filing annual returns step-by-step', 'Common rejection reasons & how to avoid them'] },
];

const OUTCOMES = [
  'Understand your exact EPR obligations under PWM Rules',
  'Navigate the CPCB portal confidently without a consultant',
  'Calculate plastic waste targets & credit requirements',
  'File EPR annual returns without errors',
  'Get a shareable certificate of completion',
];

const WHO = [
  { role: 'Producers & Brand Owners', desc: 'Understand your obligations before your first filing date' },
  { role: 'Importers', desc: 'Learn plastic packaging EPR rules applicable to imported goods' },
  { role: 'EHS & Compliance Managers', desc: 'Upskill your team in 2 days with a certificate' },
  { role: 'Consultants & CAs', desc: 'Add EPR compliance to your service portfolio' },
];

export default function Tier1Page() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-eco-green-4/10 to-eco-green-3/5 border-b border-eco-green-4/20 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-4 py-1 text-sm font-bold mb-4">
            TIER 1 · EPR AWARENESS BOOTCAMP
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
            Go from Zero to EPR-Ready<br className="hidden md:block" /> in 2 Days
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            India's most affordable live online EPR compliance course. Master PWM Rules, CPCB portal & credit trading in one weekend — with a certificate.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/academy/login?program=tier-1"
              className="inline-flex items-center gap-2 rounded-xl bg-eco-green-4 text-white font-bold text-lg px-8 py-4 hover:bg-eco-green-5 transition shadow-lg"
            >
              Enroll Now — ₹999 only →
            </Link>
            <Link
              href="/training_calendar"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-eco-green-4 text-eco-green-4 font-semibold text-base px-6 py-3.5 hover:bg-eco-green-4/10 transition"
            >
              View Upcoming Batches
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>🗓 2-day live online (Sat–Sun)</span>
            <span>📜 Certificate included</span>
            <span>👥 500+ professionals trained</span>
            <span>💰 ₹999 one-time</span>
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You'll Walk Away With</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex items-start gap-3 bg-eco-green-4/5 rounded-xl p-4 border border-eco-green-4/20">
                <span className="text-eco-green-4 text-lg mt-0.5">✓</span>
                <span className="text-gray-800 font-medium text-sm">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-14 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">2-Day Curriculum</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CURRICULUM.map((d) => (
              <div key={d.day} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <span className="inline-block rounded-full bg-eco-green-4/10 text-eco-green-4 text-xs font-bold px-3 py-1 mb-2">{d.day}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{d.title}</h3>
                <ul className="space-y-2">
                  {d.topics.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-eco-green-4 mt-0.5 shrink-0">›</span>{t}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Who Should Attend</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHO.map((w) => (
              <div key={w.role} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-eco-green-4/40 transition">
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
      <section className="py-16 px-4 bg-eco-green-4 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3">Ready to Get EPR-Certified?</h2>
          <p className="text-white/80 mb-8">Join 500+ professionals who cleared EPR compliance in one weekend. Batches fill fast.</p>
          <Link
            href="/academy/login?program=tier-1"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-eco-green-4 font-bold text-lg px-8 py-4 hover:bg-gray-100 transition shadow-lg"
          >
            Enroll Now — ₹999 →
          </Link>
          <p className="mt-4 text-sm text-white/60">Have questions? <a href="/contact" target="_blank" rel="noopener noreferrer" className="underline">Talk to our team</a></p>
        </div>
      </section>

      {/* Upgrade path */}
      <section className="py-10 px-4 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-4">Want to go further? Upgrade your career with a higher tier.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/courses/cepc" className="rounded-lg border border-eco-green-4/40 text-eco-green-4 font-semibold text-sm px-4 py-2 hover:bg-eco-green-4/10 transition">
            Tier 2 — CEPC Certification (₹5,000) →
          </Link>
          <Link href="/courses/ealp" className="rounded-lg border border-eco-green-4/40 text-eco-green-4 font-semibold text-sm px-4 py-2 hover:bg-eco-green-4/10 transition">
            Tier 3 — EPR Agency Leadership (₹50,000) →
          </Link>
        </div>
      </section>
    </div>
  );
}

