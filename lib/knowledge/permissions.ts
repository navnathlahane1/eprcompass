// Static capability model for the Knowledge Hub (4 roles + admin/manager).
// Kept in code rather than a DB matrix — the role set is small and fixed.

export function isKnowledgeRole(role: string): boolean {
  return role.startsWith('knowledge_') || role === 'admin' || role === 'manager';
}

// May upload / create items, and edit or delete their own items.
export function canContribute(role: string): boolean {
  return (
    role === 'admin' ||
    role === 'manager' ||
    role === 'knowledge_admin' ||
    role === 'knowledge_manager' ||
    role === 'knowledge_contributor'
  );
}

// May edit/delete ANY item and manage categories.
export function canManageAll(role: string): boolean {
  return (
    role === 'admin' ||
    role === 'manager' ||
    role === 'knowledge_admin' ||
    role === 'knowledge_manager'
  );
}

// May edit/delete a specific item: managers can touch anything; contributors
// can only touch what they created.
export function canEditItem(role: string, itemCreatedBy: string | null, userId: string): boolean {
  if (canManageAll(role)) return true;
  if (role === 'knowledge_contributor') return !!itemCreatedBy && itemCreatedBy === userId;
  return false;
}
