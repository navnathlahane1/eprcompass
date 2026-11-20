import { Suspense } from 'react';
import { resolveKnowledgeActor } from '@/lib/knowledge/auth';
import { canContribute, canManageAll } from '@/lib/knowledge/permissions';
import LibraryClient from './LibraryClient';

export const metadata = { title: 'Library | Knowledge Hub' };
export const dynamic = 'force-dynamic';

export default async function KnowledgeLibraryPage() {
  const actor = await resolveKnowledgeActor();
  const role = actor?.role || '';

  return (
    <Suspense>
      <LibraryClient
        userId={actor?.id || ''}
        role={role}
        canContribute={canContribute(role)}
        canManageAll={canManageAll(role)}
      />
    </Suspense>
  );
}
