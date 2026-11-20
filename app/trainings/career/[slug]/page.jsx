import { notFound } from 'next/navigation';
import { CAREER_PROGRAMMES, resolveCareerSlug } from '../data';
import CareerProgrammeLanding from './CareerProgrammeLanding';

export function generateStaticParams() {
  return CAREER_PROGRAMMES.map(p => ({ slug: p.id }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const programme = resolveCareerSlug(slug);
  if (!programme) return { title: 'Programme Not Found' };
  const title = `${programme.title} | EPR Compass`;
  const desc = programme.description.slice(0, 155);
  return {
    title,
    description: desc,
    alternates: { canonical: `/trainings/career/${slug}` },
    openGraph: { title, description: desc, url: `/trainings/career/${slug}`, type: 'article' },
  };
}

export default async function CareerProgrammeDetailPage({ params }) {
  const { slug } = await params;
  const programme = resolveCareerSlug(slug);
  if (!programme) return notFound();
  return <CareerProgrammeLanding programme={programme} />;
}

