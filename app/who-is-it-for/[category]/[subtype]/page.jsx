import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getSubtypeContent,
  getAllSubtypes,
  CATEGORY_SUBTYPE_SLUGS,
} from '@/lib/subtypeContent';
import { CheckCircle, ArrowRight, ChevronRight } from 'lucide-react';

const CATEGORY_LABELS = {
  'producers-manufacturers': 'Producers & Manufacturers',
  'brand-owners-importers': 'Brand Owners & Importers',
  'recyclers-pros': 'Recyclers & PROs',
  'government-compliance': 'Government & Compliance',
};

export async function generateStaticParams() {
  const params = [];
  for (const { category, subtypes } of CATEGORY_SUBTYPE_SLUGS) {
    for (const subtype of subtypes) {
      params.push({ category, subtype });
    }
  }
  return params;
}

export async function generateMetadata({ params }) {
  const { category, subtype } = await params;
  const content = getSubtypeContent(category, subtype);
  if (!content) return { title: 'Who is it for | EPR Compass' };
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const description =
    content.subtitle ||
    `EPR compliance solutions for ${content.shortName}. ${content.overview?.slice(0, 120)}...`;
  return {
    title: `${content.title} | EPR Compass`,
    description,
    openGraph: {
      title: content.title,
      description,
      type: 'website',
    },
    keywords: [
      'EPR',
      'Extended Producer Responsibility',
      content.shortName,
      'PWM Rules 2022',
      'CPCB',
      'EPR registration',
      'EPR compliance',
    ],
  };
}

export default async function SubtypePage({ params }) {
  const { category, subtype } = await params;
  const content = getSubtypeContent(category, subtype);
  if (!content) notFound();

  const categoryLabel = CATEGORY_LABELS[category] || category;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Breadcrumbs */}
      <nav className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-3 min-w-0">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-0">
            <li>
              <Link href="/" className="hover:text-eco-green-4 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight size={16} className="text-gray-400" />
            </li>
            <li>
              <Link href="/who-is-it-for" className="hover:text-eco-green-4 transition-colors">
                Who is it for
              </Link>
            </li>
            <li>
              <ChevronRight size={16} className="text-gray-400" />
            </li>
            <li className="text-gray-600 dark:text-gray-300">{categoryLabel}</li>
            <li>
              <ChevronRight size={16} className="text-gray-400" />
            </li>
            <li className="text-gray-900 dark:text-white font-medium truncate">
              {content.shortName}
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-eco-green-1/10 to-eco-green-2/20 dark:from-gray-800 dark:to-gray-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 break-words min-w-0">
            {content.title}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mb-8 break-words min-w-0">
            {content.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-eco-green-4 text-white px-6 py-3 rounded-lg font-medium hover:bg-eco-green-5 transition-colors"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/services/extended-producer-responsibility"
              className="inline-flex items-center gap-2 border-2 border-eco-green-4 text-eco-green-4 px-6 py-3 rounded-lg font-medium hover:bg-eco-green-4 hover:text-white transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Overview</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 break-words min-w-0 overflow-hidden">
            <p>{content.overview}</p>
          </div>
        </div>
      </section>

      {/* EPR Requirements */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            EPR Requirements for {content.shortName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            {content.requirements.map((req, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">{req.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 break-words min-w-0">{req.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Common EPR Challenges
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            {content.challenges.map((challenge, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-gray-600 dark:text-gray-300 break-words min-w-0"
              >
                <CheckCircle size={20} className="text-eco-green-4 flex-shrink-0 mt-0.5" />
                <span className="min-w-0">{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Our Solutions */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            How We Help {content.shortName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            {content.solutions.map((solution, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">{solution.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 break-words min-w-0">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Our Process
          </h2>
          <ol className="space-y-6 min-w-0">
            {content.process.map((step, idx) => (
              <li key={idx} className="flex gap-4 min-w-0">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-eco-green-4 text-white flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <strong className="text-lg text-gray-900 dark:text-white block mb-1 break-words">
                    {step.title}
                  </strong>
                  <p className="text-gray-600 dark:text-gray-300 break-words">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Success Story
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed break-words">
              {content.caseStudy}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-eco-green-4 to-eco-green-5 relative">
        <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 [text-shadow:0_1px_2px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 break-words">
            Ready to Achieve EPR Compliance?
          </h2>
          <p className="text-lg sm:text-xl text-white mb-8 break-words min-w-0">{content.ctaText}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-eco-green-4 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/services/extended-producer-responsibility"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-eco-green-4 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

