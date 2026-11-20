import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveKnowledgeActor } from '@/lib/knowledge/auth';
import { canContribute, canManageAll } from '@/lib/knowledge/permissions';
import KnowledgeShell from '@/components/knowledge/KnowledgeShell';
import { canManageKnowledgeShares } from '@/lib/knowledge/sharedDocuments';

const BYPASS = ['/knowledge/login', '/knowledge/change-password'];

export default async function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (BYPASS.includes(pathname)) return <>{children}</>;

  const actor = await resolveKnowledgeActor();
  if (!actor) redirect('/knowledge/login');
  if (actor.forcePasswordChange) redirect('/knowledge/change-password');

  return (
    <KnowledgeShell
      userName={actor.fullName || ''}
      userRole={actor.role}
      userEmail={actor.email}
      canContribute={canContribute(actor.role)}
      canManageAll={canManageAll(actor.role)}
      canShareDocuments={canManageKnowledgeShares(actor.role)}
    >
      {children}
    </KnowledgeShell>
  );
}
