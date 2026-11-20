import { notFound } from 'next/navigation';
import { STANDALONE_WORKSHOPS, resolveWorkshopSlug } from '../data';
import WorkshopLanding from './WorkshopLanding';

export function generateStaticParams() {
  return STANDALONE_WORKSHOPS.map(w => ({ slug: w.id }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const workshop = resolveWorkshopSlug(slug);
  if (!workshop) return { title: 'Workshop Not Found' };
  const title = `${workshop.title} | EPR Compass`;
  return {
    title,
    description: workshop.description.slice(0, 155),
    alternates: { canonical: `/trainings/workshop/${slug}` },
    openGraph: { title, description: workshop.description.slice(0, 155), url: `/trainings/workshop/${slug}`, type: 'article' },
  };
}

export default async function WorkshopDetailPage({ params }) {
  const { slug } = await params;
  const workshop = resolveWorkshopSlug(slug);
  if (!workshop) return notFound();
  return <WorkshopLanding workshop={workshop} />;
}

