import { redirect } from 'next/navigation';
import { resolveKnowledgeActor } from '@/lib/knowledge/auth';
import { canManageKnowledgeShares } from '@/lib/knowledge/sharedDocuments';
import SharedDocumentsClient from './SharedDocumentsClient';

export const metadata = { title: 'Shared Documents | Knowledge Hub' };
export const dynamic = 'force-dynamic';

export default async function SharedDocumentsPage() {
  const actor = await resolveKnowledgeActor();
  if (!actor || !canManageKnowledgeShares(actor.role)) redirect('/knowledge/dashboard');
  return <SharedDocumentsClient />;
}
