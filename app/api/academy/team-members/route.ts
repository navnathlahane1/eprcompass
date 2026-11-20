/**
 * GET /api/academy/team-members
 * Returns every user provisioned for the Academy portal (all academy roles),
 * enriched with email, who created them (from the IAM audit log) and when.
 *
 * Director / Admin only — this is the collective directory the Academy Director
 * reviews whenever a new academy user is created from the IAM portal.
 */
import { NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';
import { ACADEMY_PORTAL_ROLES } from '@/lib/academy/access';

export const runtime = 'nodejs';

export async function GET() {
  const actor = await resolveAcademyActor(['academy_director', 'admin']);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  // All academy-portal profiles, newest first
  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, full_name, company_name, role, created_at, is_banned')
    .in('role', [...ACADEMY_PORTAL_ROLES])
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = profiles ?? [];
  const ids = rows.map(r => r.id);

  // Resolve auth emails in bulk
  const emailMap: Record<string, string> = {};
  if (ids.length) {
    const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 500 });
    for (const u of authList?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email;
    }
  }

  // Resolve "created by" + provenance from the IAM audit log (action='create')
  const createdByMap: Record<string, { by: string | null; at: string | null }> = {};
  if (ids.length) {
    const { data: logs } = await db
      .from('iam_audit_log')
      .select('target_id, actor_name, created_at')
      .eq('action', 'create')
      .in('target_id', ids)
      .order('created_at', { ascending: false });

    for (const log of logs ?? []) {
      // Keep the earliest create entry per target (the original provisioning)
      createdByMap[log.target_id as string] = {
        by: (log.actor_name as string) ?? null,
        at: (log.created_at as string) ?? null,
      };
    }
  }

  const users = rows.map(r => {
    const prov = createdByMap[r.id];
    return {
      id: r.id,
      full_name: r.full_name,
      company_name: r.company_name,
      email: emailMap[r.id] ?? null,
      role: r.role,
      is_banned: !!r.is_banned,
      created_at: r.created_at,
      created_by: prov?.by ?? null,
      created_via_iam: !!prov,
    };
  });

  // Count per role + how many were added in the last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const countsByRole: Record<string, number> = {};
  let recentCount = 0;
  for (const u of users) {
    countsByRole[u.role] = (countsByRole[u.role] ?? 0) + 1;
    if (u.created_at && new Date(u.created_at).getTime() >= sevenDaysAgo) recentCount += 1;
  }

  return NextResponse.json({
    users,
    total: users.length,
    countsByRole,
    recentCount,
  });
}
