import Link from 'next/link';
import { notFound } from 'next/navigation';
import ServiceCard from '@/components/epr/ServiceCard';
import ConsultationTriggerButton from '@/components/ConsultationTriggerButton';
import countries from '@/data/eprCountries.json';

const SERVICES = [
  {
    title: 'Registration',
    description: 'Producer onboarding, account setup, and complete regulatory registration support.'
  },
  {
    title: 'Annual Return Filing',
    description: 'Accurate annual and periodic filing preparation, validation, and submission.'
  },
  {
    title: 'PRO Tie-up',
    description: 'Connect with compliant PRO/recycler networks for collection and fulfillment.'
  },
  {
    title: 'EPR Compass',
    description: 'Support for certification workflows and documentation for compliance visibility.'
  },
  {
    title: 'Audit Support',
    description: 'End-to-end audit readiness with documentation checks and response assistance.'
  }
];

function buildFaq(country) {
  return [
    {
      question: `Who needs EPR compliance in ${country.name}?`,
      answer: `Producers, importers, and brand owners placing regulated products or packaging in ${country.name} typically fall under EPR obligations.`
    },
    {
      question: `What documents are required to register for EPR in ${country.name}?`,
      answer: `Most registrations need legal entity details, product/category declarations, waste estimates, and authorized representative information specific to ${country.name}.`
    },
    {
      question: `How long does EPR registration take in ${country.name}?`,
      answer: `Timelines vary by authority and category, but with complete documentation, registrations in ${country.name} are typically processed in structured stages.`
    },
    {
      question: `Can you support annual return filing in ${country.name}?`,
      answer: `Yes. We support periodic and annual filing in ${country.name}, including data preparation, reconciliation, and submission support.`
    },
    {
      question: `Do you offer end-to-end EPR consulting in ${country.name}?`,
      answer: `Yes. Our team supports full lifecycle compliance in ${country.name}, from onboarding and PRO tie-ups to filings, audits, and ongoing advisory.`
    }
  ];
}

function getKeyDeadline(region) {
  if (region === 'Europe') return 'Annual return cycle based on national registry timelines';
  if (region === 'Americas') return 'State/provincial reporting cycles and annual disclosures';
  if (region === 'Middle East & Africa') return 'Authority-specific annual compliance and reporting windows';
  return 'Periodic filing and annual return deadlines as per authority notifications';
}

export async function generateStaticParams() {
  return countries.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }) {
  const { country: countrySlug } = await params;
  const country = countries.find((c) => c.slug === countrySlug);
  if (!country) return {};
  return {
    title: `EPR Compliance in ${country.name} | EPR Compass`,
    description: `EPR registration, filing & certification in ${country.name}. Trusted by 500+ clients. IIM Bangalore alumni-led.`,
  };
}

export default async function EprCountryPage({ params }) {
  const { country: countrySlug } = await params;
  const country = countries.find((c) => c.slug === countrySlug);
  if (!country) notFound();

  const faqItems = buildFaq(country);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">

        {/* Hero */}
        <section className="rounded-2xl bg-eco-gradient-br px-6 py-10 text-white md:px-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            <span aria-hidden="true">{country.flag}</span>
            {country.region}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight font-tangent md:text-4xl">
            EPR Compliance in {country.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/90">{country.regulation}</p>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            We help producers, importers, and brand owners navigate {country.name}&apos;s EPR registration,
            return filing, and certification requirements with practical, audit-ready support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-eco-green-5 shadow transition hover:bg-gray-100"
            >
              Get Started
            </Link>
            <ConsultationTriggerButton
              label="Contact us"
              source="global_epr_country_hero"
              className="rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            />
          </div>
        </section>

        {/* Regulation Overview */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-eco-navy">Regulation Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody>
                {[
                  ['Governing Law', country.regulation],
                  ['Authority', country.authority],
                  ['Waste Categories', country.categories.join(', ')],
                  ['Applicable To', 'Producers, importers, brand owners, and obligated entities under local EPR rules'],
                  ['Key Deadline', getKeyDeadline(country.region)],
                ].map(([label, value], idx) => (
                  <tr key={label} className={idx < 4 ? 'border-b border-gray-200' : ''}>
                    <th className="w-52 bg-eco-green-4/5 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-eco-green-4">
                      {label}
                    </th>
                    <td className="px-5 py-3 text-gray-700">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Services */}
        <section>
          <h2 className="text-2xl font-bold text-eco-navy">Our Services</h2>
          <p className="mt-1 text-sm text-gray-500">End-to-end EPR support covering every stage of compliance in {country.name}.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.title} title={service.title} description={service.description} />
            ))}
          </div>
        </section>

        {/* Why Us */}
        <section>
          <h2 className="text-2xl font-bold text-eco-navy">Why Choose Us</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { icon: '🎓', text: 'IIM Bangalore alumni-led trust anchor and strategic compliance approach.' },
              { icon: '🌏', text: 'Pan-India + global reach for multi-country producer responsibility programs.' },
              { icon: '🔄', text: 'End-to-end support from registration and reporting to audit readiness.' },
              { icon: '🧠', text: 'Expert consultants with practical execution frameworks and industry depth.' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-start gap-4 rounded-2xl border border-eco-green-4/20 bg-eco-green-4/5 p-4"
              >
                <span className="mt-0.5 text-xl">{icon}</span>
                <p className="text-sm text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-eco-navy">Frequently Asked Questions</h2>
          <div className="mt-5 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-eco-navy group-open:text-eco-green-4">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-eco-gradient-br px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to comply in {country.name}?</h2>
          <p className="mt-2 text-white/80">Our experts will guide you through every step of the process.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ConsultationTriggerButton
              label="Book Free Consultation"
              source="global_epr_country_cta"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-eco-green-5 shadow transition hover:bg-gray-100"
            />
            <a
              href="/contact"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Contact us
            </a>
          </div>
        </section>

        {/* Back link */}
        <div className="text-center">
          <Link href="/epr-countries" className="text-sm font-semibold text-eco-green-4 hover:text-eco-green-5">
            ← View all countries
          </Link>
        </div>

      </div>
    </main>
  );
}


