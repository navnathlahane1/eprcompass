/**
 * GET /api/iam/tasks
 * Returns portal_tasks of type 'iam_create_client' for the IAM user_manager.
 * user_manager sees only their own; admin sees all.
 *
 * Query params:
 *   status   = pending | in_progress | completed | all  (default: active)
 *   countOnly = 1  → { count: N } only (for badge)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const dynamic = 'force-dynamic';

async function getReadClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServerComponentClient();
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

const IAM_TASK_TYPES = ['iam_create_client'];

export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser();
  if (!authUser || !['user_manager', 'admin', 'manager'].includes(authUser.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp         = req.nextUrl.searchParams;
  const statusFilter = sp.get('status') || '';
  const countOnly    = sp.get('countOnly') === '1';

  const db  = await getReadClient();
  const now = new Date().toISOString();

  let q = (db as any)
    .from('portal_tasks')
    .select(
      'id, title, description, task_type, status, priority, assigned_to, client_id, due_at, created_at, resolution_note, completed_at',
      { count: countOnly ? 'exact' : undefined, head: countOnly ? true : undefined }
    )
    .in('task_type', IAM_TASK_TYPES)
    .order('due_at', { ascending: true });

  // Non-admin sees only their own tasks
  if (authUser.role === 'user_manager') q = q.eq('assigned_to', authUser.id);

  if (statusFilter === 'pending') {
    q = q.eq('status', 'pending');
  } else if (statusFilter === 'in_progress') {
    q = q.eq('status', 'in_progress');
  } else if (statusFilter === 'completed') {
    q = q.eq('status', 'completed');
  } else if (statusFilter !== 'all') {
    // Default: active
    q = q.in('status', ['pending', 'in_progress']);
  }

  const { data: tasks, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (countOnly) return NextResponse.json({ count: count ?? 0 });

  const rows: any[] = tasks ?? [];

  // Enrich client names
  const clientIds = [...new Set(rows.map(t => t.client_id).filter(Boolean))];
  const clientNameMap: Record<string, string> = {};
  if (clientIds.length) {
    const { data: cls } = await (db as any).from('clients').select('id, profile_id').in('id', clientIds);
    const pids = (cls ?? []).map((c: any) => c.profile_id).filter(Boolean);
    if (pids.length) {
      const { data: profs } = await (db as any).from('profiles').select('id, company_name, full_name').in('id', pids);
      const pm: Record<string, string> = {};
      for (const p of profs ?? []) pm[p.id] = p.company_name || p.full_name || 'Client';
      for (const c of cls ?? []) clientNameMap[c.id] = pm[c.profile_id] || 'Client';
    }
  }

  const enriched = rows.map(t => ({
    ...t,
    client_name: clientNameMap[t.client_id] || 'Unknown',
    is_overdue:  !['completed', 'cancelled'].includes(t.status) && t.due_at && t.due_at < now,
  }));

  return NextResponse.json({ tasks: enriched, total: enriched.length });
}
