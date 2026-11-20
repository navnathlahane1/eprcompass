import { notFound } from 'next/navigation';
import {
  RECYCLER_CATEGORIES, COURSE_TYPES, COURSE_CURRICULUM,
  TESTIMONIALS, COMMON_FAQS, resolveSlug, buildSlug,
} from '../data';
import RecyclerCourseLanding from './RecyclerCourseLanding';

// Generate all 24 static paths at build time
export function generateStaticParams() {
  return RECYCLER_CATEGORIES.flatMap(cat =>
    COURSE_TYPES.map(ct => ({ slug: buildSlug(cat.id, ct.type) }))
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);
  if (!resolved) return { title: 'Course Not Found' };
  const { category, courseType } = resolved;
  const title = `${category.label} — ${courseType.type} | EPR Compass`;
  const desc = `${courseType.tagline}. ${courseType.description.slice(0, 120)}…`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/trainings/recycler/${slug}` },
    openGraph: { title, description: desc, url: `/trainings/recycler/${slug}`, type: 'article' },
  };
}

export default async function RecyclerCourseDetailPage({ params }) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);
  if (!resolved) return notFound();
  return <RecyclerCourseLanding slug={slug} {...resolved} />;
}

