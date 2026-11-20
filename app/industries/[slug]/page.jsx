import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CircleCheck, ShieldAlert } from 'lucide-react';
import { getIndustryBySlug, industryPages } from '../industryContent';
import TrackedCtaLink from '@/components/shared/TrackedCtaLink';

const statusStyles = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
  emerging: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  developing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
};

const statusLabels = {
  active: 'Active Applicability',
  emerging: 'Emerging Applicability',
  developing: 'Developing Applicability'
};

export function generateStaticParams() {
  return industryPages.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const industry = getIndustryBySlug(resolvedParams.slug);
  if (!industry) {
    return { title: 'Industry Not Found | EPR Compass' };
  }

  const pageTitle = industry.seoTitle || `${industry.title} EPR Applicability | EPR Compass`;
  const pageDescription = industry.seoDescription || industry.summary;
  const pageKeywords = industry.seoKeywords || [];
  const canonicalPath = `/industries/${industry.slug}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: 'article',
      url: canonicalPath,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  };
}

const ctaVariants = {
  a: {
    heroPrimary: 'Book Free Industry Review',
    actionPlanPrimary: 'Get My Action Plan Reviewed',
    qualificationPrimary: 'Schedule 30-Minute Applicability Call'
  },
  b: {
    heroPrimary: 'Secure My Compliance Risk Review',
    actionPlanPrimary: 'Request Priority Action Plan Review',
    qualificationPrimary: 'Book My Priority Qualification Call'
  }
};

export default async function IndustryDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const industry = getIndustryBySlug(resolvedParams.slug);
  if (!industry) notFound();

  const rawVariant = Array.isArray(resolvedSearchParams?.cta)
    ? resolvedSearchParams.cta[0]
    : resolvedSearchParams?.cta;
  const ctaVariant = rawVariant === 'b' ? 'b' : 'a';
  const ctaCopy = ctaVariants[ctaVariant];

  return (
    <main className="bg-[var(--brand-surface)] text-[var(--brand-text)]">
      <section className="border-b border-[var(--brand-border)] bg-gradient-to-br from-white via-[#f1f7f3] to-[#e5f2e8] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--brand-muted)]">
              <li>
                <Link href="/" className="hover:text-[var(--brand-primary)]">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/industries" className="hover:text-[var(--brand-primary)]">Industries</Link>
              </li>
              <li>/</li>
              <li aria-current="page" className="text-[var(--brand-text)]">{industry.title}</li>
            </ol>
          </nav>

          <Link href="/industries" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-secondary)] hover:text-[var(--brand-primary)]">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Industry Hub
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{industry.title}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[industry.status] || statusStyles.emerging}`}>
              {statusLabels[industry.status] || statusLabels.emerging}
            </span>
          </div>
          <p className="mt-4 max-w-4xl text-base text-[var(--brand-muted)]">{industry.headline}</p>
          <p className="mt-3 max-w-4xl text-sm text-[var(--brand-muted)]">{industry.summary}</p>
          <p className="mt-3 max-w-4xl text-sm font-medium text-[var(--brand-text)] dark:text-gray-200">
            Outcome: Your team gets a clear applicability map, priority filing sequence, and execution checklist for the next compliance cycle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedCtaLink
              href={`/contact?intent=industry-review&industry=${industry.slug}&cta=${ctaVariant}`}
              className="btn-primary"
              eventName="industry_cta_clicked"
              eventPayload={{
                intent: 'industry-review',
                industry: industry.slug,
                cta_variant: ctaVariant,
                cta_label: ctaCopy.heroPrimary,
                surface: 'industry_detail_hero'
              }}
            >
              {ctaCopy.heroPrimary}
            </TrackedCtaLink>
            <Link href="/compliance-checklist" className="btn-secondary">Run 2-Minute Compliance Checklist</Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--brand-muted)]">
            <span className="rounded-full bg-white/80 px-2.5 py-1 dark:bg-gray-800">No technical prep needed</span>
            <span className="rounded-full bg-white/80 px-2.5 py-1 dark:bg-gray-800">Practical action plan</span>
            <span className="rounded-full bg-white/80 px-2.5 py-1 dark:bg-gray-800">Role-specific guidance</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-secondary)]">Current EPR Applicability</h2>
            <div className="mt-4 space-y-3">
              {industry.streams.map((stream) => (
                <div key={stream.name} className="rounded-xl border border-[var(--brand-border)] p-3 dark:border-gray-700">
                  <p className="text-sm font-semibold">{stream.name}</p>
                  <p className="mt-1 text-xs text-[var(--brand-muted)]">{stream.applicability}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-secondary)]">Where Teams Usually Slip</h2>
            <ul className="mt-4 space-y-2">
              {industry.blindSpots.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <article className="mt-4 rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-secondary)]">Recommended Action Plan</h2>
          <ul className="mt-4 space-y-2">
            {industry.actions.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedCtaLink
              href={`/contact?intent=action-plan&industry=${industry.slug}&cta=${ctaVariant}`}
              className="btn-primary"
              eventName="industry_cta_clicked"
              eventPayload={{
                intent: 'action-plan',
                industry: industry.slug,
                cta_variant: ctaVariant,
                cta_label: ctaCopy.actionPlanPrimary,
                surface: 'industry_detail_action_plan'
              }}
            >
              {ctaCopy.actionPlanPrimary}
            </TrackedCtaLink>
            <Link href="/services" className="btn-secondary">Explore EPR Services</Link>
          </div>
        </article>

        <article className="mt-4 rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-secondary)]">Quick Qualification Check</h2>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">If you answer yes to any of these, this industry applicability likely needs immediate action:</p>
          <ul className="mt-4 space-y-2">
            <li className="flex gap-2 text-sm"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" /><span>You introduced new products/SKUs or expanded geographies this year.</span></li>
            <li className="flex gap-2 text-sm"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" /><span>Your data sits across sales, finance, operations, and partner channels.</span></li>
            <li className="flex gap-2 text-sm"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" /><span>You are unsure whether all applicable waste streams are already covered.</span></li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedCtaLink
              href={`/contact?intent=qualification-call&industry=${industry.slug}&cta=${ctaVariant}`}
              className="btn-primary"
              eventName="industry_cta_clicked"
              eventPayload={{
                intent: 'qualification-call',
                industry: industry.slug,
                cta_variant: ctaVariant,
                cta_label: ctaCopy.qualificationPrimary,
                surface: 'industry_detail_qualification'
              }}
            >
              {ctaCopy.qualificationPrimary}
            </TrackedCtaLink>
            <Link href="/get-matched" className="btn-secondary">Get Matched To A Compliance Plan</Link>
          </div>
        </article>

        <div className="mt-6 rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs text-[var(--brand-muted)]">
            Advisory note: This page is an operational guidance overview for planning. Final legal applicability depends on product category definitions, notifications, business role, and current regulatory interpretations.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {industryPages
            .filter((item) => item.slug !== industry.slug)
            .slice(0, 4)
            .map((item) => (
              <Link key={item.slug} href={`/industries/${item.slug}`} className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-secondary)] hover:text-[var(--brand-primary)] dark:border-gray-700 dark:bg-gray-900">
                {item.title}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}

