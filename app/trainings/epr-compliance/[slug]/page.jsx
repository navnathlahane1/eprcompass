import { notFound } from 'next/navigation';
import { EPR_CATEGORIES, EPR_COURSE_TYPES, buildEprSlug, resolveEprSlug } from '../data';
import EprCourseLanding from './EprCourseLanding';

export function generateStaticParams() {
  return EPR_CATEGORIES.flatMap(cat =>
    EPR_COURSE_TYPES.map(ct => ({ slug: buildEprSlug(cat.id, ct.type) }))
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resolved = resolveEprSlug(slug);
  if (!resolved) return { title: 'Course Not Found' };
  const { category, courseType } = resolved;
  const title = `${category.label} — ${courseType.type} | EPR Compass`;
  const desc = `${courseType.tagline}. ${courseType.description.slice(0, 130)}…`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/trainings/epr-compliance/${slug}` },
    openGraph: { title, description: desc, url: `/trainings/epr-compliance/${slug}`, type: 'article' },
  };
}

export default async function EprCourseDetailPage({ params }) {
  const { slug } = await params;
  const resolved = resolveEprSlug(slug);
  if (!resolved) return notFound();
  return <EprCourseLanding slug={slug} {...resolved} />;
}

