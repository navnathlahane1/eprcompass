import { redirect } from 'next/navigation';
import { resolveKnowledgeActor } from '@/lib/knowledge/auth';
import { canManageAll } from '@/lib/knowledge/permissions';
import CategoriesClient from './CategoriesClient';

export const metadata = { title: 'Categories | Knowledge Hub' };
export const dynamic = 'force-dynamic';

// knowledge_contributor gets read-only access (can see the Services tag per
// category); only knowledge_admin/manager can add/edit/delete categories.
function canViewCategories(role: string): boolean {
  return canManageAll(role) || role === 'knowledge_contributor';
}

export default async function KnowledgeCategoriesPage() {
  const actor = await resolveKnowledgeActor();
  if (!actor) redirect('/knowledge/login');
  if (!canViewCategories(actor.role)) redirect('/knowledge/library');

  return <CategoriesClient canManage={canManageAll(actor.role)} />;
}
