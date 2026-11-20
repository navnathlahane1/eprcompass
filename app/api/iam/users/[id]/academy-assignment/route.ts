/**
 * GET  /api/iam/users/[id]/academy-assignment
 *   Returns the client's linked company, currently assigned academy manager,
 *   and full list of academy managers available for the dropdown.
 *
 * PATCH /api/iam/users/[id]/academy-assignment
 *   Body: { academy_manager_id: string | null }
 *   Sets clients.academy_manager_id for the client linked to this user.
 *
 * Security: user_manager, admin, or manager role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function tryParseToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const p = JSON.parse(raw);
    if (typeof p === 'string') return p;
    if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
    if (p?.access_token) return p.access_token;
  } catch {}
  return raw;
}

async function resolveActor() {
  const cookieStore = await cookies();
  const raw = cookieStore.getAll().find(
    c => c.name.endsWith('-access-token') || c.name === 'sb-access-token' || c.name.endsWith('-auth-token')
  );
  const token = tryParseToken(raw?.value);
  if (!token) return null;

  const db = getAdminClient();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();

  const isSuperAdmin = emailIsSuperAdmin(user.email);
  const role = profile?.role || (isSuperAdmin ? 'admin' : '');

  if (!['user_manager', 'admin', 'manager'].includes(role)) return null;
  return { id: user.id, email: user.email, role, fullName: profile?.full_name };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: profileId } = await params;
  const db = getAdminClient();

  const { data: clientRow } = await db
    .from('clients')
    .select('id, academy_manager_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  const { data: clientProfile } = await db
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', profileId)
    .maybeSingle();

  // Resolve currently assigned academy manager
  let assignedAcademyManager: { id: string; full_name: string | null; email: string | null } | null = null;
  if (clientRow?.academy_manager_id) {
    const { data: mgr } = await db
      .from('profiles')
      .select('id, full_name')
      .eq('id', clientRow.academy_manager_id)
      .maybeSingle();
    if (mgr) {
      const { data: authData } = await db.auth.admin.getUserById(clientRow.academy_manager_id);
      assignedAcademyManager = {
        id: mgr.id,
        full_name: mgr.full_name,
        email: authData?.user?.email ?? null,
      };
    }
  }

  // Fetch all academy managers for the dropdown
  const { data: mgrProfiles } = await db
    .from('profiles')
    .select('id, full_name')
    .in('role', ['academy_director', 'academy_manager', 'admin'])
    .order('full_name', { ascending: true });

  const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailMap: Record<string, string> = {};
  for (const u of authList?.users || []) emailMap[u.id] = u.email || '';

  const academyManagers = (mgrProfiles || []).map((m: any) => ({
    id: m.id,
    full_name: m.full_name || null,
    email: emailMap[m.id] || null,
  }));

  return NextResponse.json({
    client_company: clientRow
      ? {
          id: clientRow.id,
          name: clientProfile?.company_name || clientProfile?.full_name || null,
          academy_manager_id: clientRow.academy_manager_id ?? null,
        }
      : null,
    assigned_academy_manager: assignedAcademyManager,
    academy_managers: academyManagers,
  });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: profileId } = await params;

  let body: { academy_manager_id?: string | null };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!('academy_manager_id' in body)) {
    return NextResponse.json({ error: 'academy_manager_id is required (pass null to unassign)' }, { status: 400 });
  }

  const newManagerId = body.academy_manager_id || null;
  const db = getAdminClient();

  const { data: clientRow } = await db
    .from('clients')
    .select('id, academy_manager_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (!clientRow) {
    return NextResponse.json(
      { error: 'No client company linked to this portal user. Link a company first from Admin → CRM → Clients.' },
      { status: 404 }
    );
  }

  if (newManagerId) {
    const { data: mgrProfile } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', newManagerId)
      .maybeSingle();

    if (!mgrProfile) {
      return NextResponse.json({ error: 'Academy manager profile not found' }, { status: 404 });
    }
    if (!['academy_director', 'academy_manager', 'admin'].includes(mgrProfile.role)) {
      return NextResponse.json(
        { error: `User has role '${mgrProfile.role}' — only academy_director, academy_manager, or admin can be assigned` },
        { status: 400 }
      );
    }
  }

  const previousManagerId = clientRow.academy_manager_id;

  const { error: updateErr } = await db
    .from('clients')
    .update({ academy_manager_id: newManagerId, updated_at: new Date().toISOString() })
    .eq('id', clientRow.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  try {
    await db.from('iam_audit_log').insert({
      actor_id: actor.id,
      actor_name: actor.fullName || actor.email,
      target_id: profileId,
      target_email: null,
      action: 'assign_academy_manager',
      old_value: { academy_manager_id: previousManagerId },
      new_value: { academy_manager_id: newManagerId },
      notes: newManagerId ? `Assigned academy manager ${newManagerId}` : 'Academy manager unassigned',
    });
  } catch {}

  return NextResponse.json({ success: true, academy_manager_id: newManagerId });
}
