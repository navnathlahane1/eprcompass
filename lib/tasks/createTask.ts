/**
 * lib/tasks/createTask.ts
 *
 * Server-only utilities for creating and resolving portal tasks.
 * Always uses the service-role client so tasks can be inserted from any API route
 * regardless of the caller's auth context.
 *
 * TAT default = 120 minutes.
 * Overdue    = due_at < now() AND status NOT IN ('completed', 'cancelled')
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Internal service client ──────────────────────────────────────────────────

function getDb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'document_review'
  | 'document_rereview'
  | 'client_onboarding'
  | 'filing_review'
  | 'filing_status_oversight'
  | 'general';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CreateTaskInput {
  title: string;
  description?: string;
  task_type: TaskType;
  /** UUID of the manager/admin profile this task is assigned to */
  assigned_to?: string | null;
  /** UUID of the clients row (NOT the profile_id) */
  client_id?: string | null;
  related_entity_type?: 'document' | 'filing' | 'client' | string;
  related_entity_id?: string;
  priority?: TaskPriority;
  /** Override default TAT. Defaults to 120 minutes. */
  tat_minutes?: number;
  created_by?: string;
}

// ─── createTask ───────────────────────────────────────────────────────────────

/**
 * Creates a portal task. Non-fatal — logs but never throws so calling routes
 * are not broken if the task insert fails.
 * Returns the new task UUID on success, or null on failure.
 */
export async function createTask(input: CreateTaskInput): Promise<string | null> {
  try {
    const db = getDb();
    const tat = input.tat_minutes ?? 120;
    const dueAt = new Date(Date.now() + tat * 60 * 1000).toISOString();

    const { data, error } = await db
      .from('portal_tasks')
      .insert({
        title: input.title,
        description: input.description ?? null,
        task_type: input.task_type,
        assigned_to: input.assigned_to ?? null,
        client_id: input.client_id ?? null,
        related_entity_type: input.related_entity_type ?? null,
        related_entity_id: input.related_entity_id ?? null,
        priority: input.priority ?? 'normal',
        tat_minutes: tat,
        due_at: dueAt,
        created_by: input.created_by ?? 'system',
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[createTask] insert failed:', error.message);
      return null;
    }
    return (data as any).id ?? null;
  } catch (e: any) {
    console.error('[createTask] exception:', e?.message);
    return null;
  }
}

// ─── completeTasksForEntity ───────────────────────────────────────────────────

/**
 * Marks all pending/in-progress tasks for a related entity as completed.
 * Call this when the action that triggered the task has been handled
 * (e.g., admin reviews a document → complete its document_review task).
 */
export async function completeTasksForEntity(options: {
  related_entity_id: string;
  related_entity_type: string;
  completed_by: string;
  resolution_note?: string;
}): Promise<void> {
  try {
    const db = getDb();
    await db
      .from('portal_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: options.completed_by,
        resolution_note: options.resolution_note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('related_entity_id', options.related_entity_id)
      .eq('related_entity_type', options.related_entity_type)
      .in('status', ['pending', 'in_progress']);
  } catch (e: any) {
    console.error('[completeTasksForEntity] exception:', e?.message);
  }
}

// ─── getAssignedManagerForClientProfile ───────────────────────────────────────

/**
 * Given a portal user's profile_id (= auth.users.id), returns:
 *   { managerId, clientRowId }
 * Used by document/filing hooks to know WHO to assign the task to.
 */
export async function getAssignedManagerForClientProfile(
  profileId: string
): Promise<{ managerId: string | null; clientRowId: string | null }> {
  try {
    const db = getDb();
    const { data } = await db
      .from('clients')
      .select('id, assigned_manager_id')
      .eq('profile_id', profileId)
      .maybeSingle();

    return {
      managerId: (data as any)?.assigned_manager_id ?? null,
      clientRowId: (data as any)?.id ?? null,
    };
  } catch {
    return { managerId: null, clientRowId: null };
  }
}

/**
 * Given a clients row UUID, returns the assigned manager and company name.
 */
export async function getAssignedManagerForClientRow(
  clientRowId: string
): Promise<{ managerId: string | null; companyName: string | null }> {
  try {
    const db = getDb();
    const { data } = await db
      .from('clients')
      .select('assigned_manager_id, profile_id')
      .eq('id', clientRowId)
      .maybeSingle();

    if (!data) return { managerId: null, companyName: null };

    const managerId = (data as any).assigned_manager_id ?? null;
    const profileId = (data as any).profile_id;

    let companyName: string | null = null;
    if (profileId) {
      const { data: prof } = await db
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', profileId)
        .maybeSingle();
      companyName = (prof as any)?.company_name || (prof as any)?.full_name || null;
    }

    return { managerId, companyName };
  } catch {
    return { managerId: null, companyName: null };
  }
}
