import Link from 'next/link';
import ConsultationTriggerButton from '@/components/ConsultationTriggerButton';

export const metadata = {
  title: 'Global Coverage | EPR Compass',
  description:
    'Corporate global EPR compliance partner across 60+ countries. Centralized strategy with local execution for complete EPR liability coverage.',
};

const STATS = [
  { value: '60+', label: 'Countries covered' },
  { value: '500+', label: 'Clients served' },
  { value: '10+', label: 'Years of expertise' },
  { value: '100%', label: 'Compliance rate' },
];

const GLOBAL_PITCH_POINTS = [
  {
    title: 'Single Compliance Partner, Multi-Country Execution',
    desc: 'Operate with one strategic team instead of fragmented country-level consultants. We coordinate filings, documentation, and regulatory tracking across markets.'
  },
  {
    title: 'Country-Specific Adaptation With Central Governance',
    desc: 'We adapt to local authority formats and timelines while maintaining a central control framework for your legal, ESG, and management teams.'
  },
  {
    title: 'Faster Market Entry, Lower Compliance Risk',
    desc: 'Launch products in new countries with a clear EPR roadmap, obligation mapping, and submission plan that reduces rework and delays.'
  },
  {
    title: 'Audit-Ready Records Across Jurisdictions',
    desc: 'From registration packs to annual return evidence, we build defensible records so your global compliance posture remains inspection-ready.'
  },
];

const COVERAGE_MODEL = [
  { step: '01', title: 'Country Applicability Mapping', desc: 'Map product, packaging, and waste obligations by jurisdiction before launch.' },
  { step: '02', title: 'Registration & Producer Onboarding', desc: 'Complete authority registrations and required declarations in each target market.' },
  { step: '03', title: 'PRO/Recycler Network Enablement', desc: 'Set up compliant collection, recovery, and certificate pathways where applicable.' },
  { step: '04', title: 'Returns, Reconciliation & Controls', desc: 'Run periodic filings, evidence checks, and management reporting with a global cadence.' },
];

const COVERED_STREAMS = [
  'Plastic Packaging EPR',
  'E-Waste EPR',
  'Battery Waste EPR',
  'Tyre Waste EPR',
  'Used Oil EPR',
  'End-of-Life Vehicles (ELV)',
  'Construction & Demolition (C&D)',
  'Non-Ferrous Materials'
];

export default function GlobalCoveragePage() {
  return (
    <>
      <section className="bg-eco-gradient-br px-4 py-16 text-center text-white">
        <p className="mb-3 inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
          Global EPR Compliance
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight font-tangent md:text-5xl">
          Global EPR Coverage for Corporate Teams Managing Multi-Country Liability
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-white/85">
          We help manufacturers, importers, brand owners, and marketplace-led businesses cover EPR liabilities
          across all operating geographies with one coordinated compliance partner.
        </p>
        <p className="mx-auto mt-2 max-w-3xl text-sm text-white/75">
          Reduce compliance risk, avoid fragmented vendor management, and implement one governance model for
          registration, return filing, recovery evidence, and audit readiness.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ConsultationTriggerButton
            label="Contact us"
            source="global_coverage_hero"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-eco-green-5 shadow transition hover:bg-gray-100"
          />
          <Link
            href="/epr-countries"
            className="rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View All Country Pages
          </Link>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-gray-200 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="py-6 text-center">
              <p className="text-3xl font-bold text-eco-green-4">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="bg-gray-50 px-4 py-12">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-eco-navy font-tangent">Why Corporates Choose Our Global Coverage</h2>
            <p className="mt-3 text-sm text-gray-600">
              If your business sells across multiple jurisdictions, EPR obligations can quickly become inconsistent,
              expensive, and risky. Our model centralizes strategy while executing locally with market-specific precision.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {GLOBAL_PITCH_POINTS.map((point) => (
              <article key={point.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">{point.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{point.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-7xl">
          <h2 className="text-3xl font-bold text-eco-navy font-tangent">Our Multi-Country Execution Model</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COVERAGE_MODEL.map((item) => (
              <article key={item.step} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold tracking-widest text-eco-green-4">STEP {item.step}</p>
                <h3 className="mt-2 text-base font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-7xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-eco-navy">Category Coverage</h2>
          <p className="mt-2 text-sm text-gray-600">
            We support the full set of priority and emerging EPR streams for corporates operating across markets.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COVERED_STREAMS.map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-eco-green-4/25 bg-eco-green-4/5 px-3 py-1 text-xs font-semibold text-eco-green-4"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-7xl rounded-2xl bg-eco-gradient-br px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold">Need a Global EPR Rollout Plan?</h2>
          <p className="mx-auto mt-2 max-w-3xl text-white/85">
            Share your target countries, product categories, and timelines. We&apos;ll design an actionable implementation
            roadmap so your global EPR liabilities stay covered end-to-end.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-eco-green-5 shadow transition hover:bg-gray-100"
            >
              Talk to Global Compliance Team
            </a>
            <Link
              href="/epr-countries"
              className="rounded-xl border border-white/60 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore Country Pages
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}


