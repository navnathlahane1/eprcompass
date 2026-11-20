import { redirect } from 'next/navigation';
import { resolveKnowledgeActor } from '@/lib/knowledge/auth';
import { canContribute } from '@/lib/knowledge/permissions';
import UploadForm from './UploadForm';

export const metadata = { title: 'Upload | Knowledge Hub' };
export const dynamic = 'force-dynamic';

export default async function KnowledgeUploadPage() {
  const actor = await resolveKnowledgeActor();
  if (!actor) redirect('/knowledge/login');
  if (!canContribute(actor.role)) redirect('/knowledge/library');

  return <UploadForm />;
}
