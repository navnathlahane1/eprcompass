/**
 * /manager/clients/[id]
 * Detailed view of a single client assigned to this manager.
 */
import { resolveManager } from '@/lib/manager/auth';
import { redirect } from 'next/navigation';
import ClientDetailClient from './ClientDetailClient';

export const dynamic = 'force-dynamic';

export default async function ManagerClientDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveManager();
  if (!actor) redirect('/manager/login');

  const { id } = await params;

  return <ClientDetailClient clientId={id} />;
}
