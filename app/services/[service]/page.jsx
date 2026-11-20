import { notFound } from 'next/navigation';
import { serviceContent } from '@/data/serviceContent';
import ClientPage from './ClientPage';

export function generateStaticParams() {
  return Object.keys(serviceContent).map((serviceKey) => ({ service: serviceKey }));
}

export default async function ServicePage({ params }) {
  const { service: serviceKey } = await params;
  const content = serviceContent[serviceKey];
  if (!content) return notFound();
  return <ClientPage serviceKey={serviceKey} />;
}