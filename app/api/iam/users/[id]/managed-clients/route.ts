/**
 * GET  /api/iam/users/[id]/managed-clients
 *   For a compliance-manager user, returns:
 *     - assigned:  the client companies currently linked to this manager
 *                  (clients.assigned_manager_id = [id])
 *     - results:   when ?search= is supplied, client companies matching the
 *                  search that can be linked, each annotated with their current
 *                  manager (so the operator knows a link will reassign).
 *
 * PATCH /api/iam/users/[id]/managed-clients
 *   Body: { client_id: string, action: 'link' | 'unlink' }
 *   link   → sets clients.assigned_manager_id = [id]   (reassigns if needed)
 *   unlink → clears it, but only if it currently points at this manager.
 *   Logs the action to iam_audit_log.
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
    c =>
      c.name.endsWith('-access-token') ||
      c.name === 'sb-access-token' ||
      c.name.endsWith('-auth-token')
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

interface ClientLite {
  id: string;
  company_name: string | null;
  full_name: string | null;
  status: string | null;
  current_manager_id: string | null;
  current_manager_name: string | null;
}

/** Confirm the target profile is a compliance manager (or admin). */
async function assertManager(db: ReturnType<typeof getAdminClient>, managerId: string) {
  const { data: mgr } = await db
    .from('profiles').select('role').eq('id', managerId).maybeSingle();
  if (!mgr) return { ok: false as const, error: 'Manager profile not found', status: 404 };
  if (!['manager', 'admin'].includes(mgr.role)) {
    return { ok: false as const, error: `User has role '${mgr.role}', not a manager`, status: 400 };
  }
  return { ok: true as const };
}

/** Resolve company/contact names + current-manager names for a set of clients. */
async function hydrateClients(
  db: ReturnType<typeof getAdminClient>,
  rows: { id: string; profile_id: string; status: string | null; assigned_manager_id: string | null }[]
): Promise<ClientLite[]> {
  if (rows.length === 0) return [];

  const profileIds = Array.from(new Set(rows.map(r => r.profile_id).filter(Boolean)));
  const managerIds = Array.from(
    new Set(rows.map(r => r.assigned_manager_id).filter((v): v is string => !!v))
  );

  const [{ data: clientProfiles }, { data: managerProfiles }] = await Promise.all([
    profileIds.length
      ? db.from('profiles').select('id, company_name, full_name').in('id', profileIds)
      : Promise.resolve({ data: [] as any[] }),
    managerIds.length
      ? db.from('profiles').select('id, full_name').in('id', managerIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const nameMap: Record<string, { company_name: string | null; full_name: string | null }> = {};
  for (const p of clientProfiles ?? []) {
    nameMap[p.id] = { company_name: p.company_name ?? null, full_name: p.full_name ?? null };
  }
  const mgrNameMap: Record<string, string | null> = {};
  for (const m of managerProfiles ?? []) mgrNameMap[m.id] = m.full_name ?? null;

  return rows.map(r => ({
    id: r.id,
    company_name: nameMap[r.profile_id]?.company_name ?? null,
    full_name: nameMap[r.profile_id]?.full_name ?? null,
    status: r.status ?? null,
    current_manager_id: r.assigned_manager_id ?? null,
    current_manager_name: r.assigned_manager_id ? (mgrNameMap[r.assigned_manager_id] ?? null) : null,
  }));
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: managerId } = await params;
  const db = getAdminClient();

  const check = await assertManager(db, managerId);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  // Clients currently assigned to this manager
  const { data: assignedRows, error: assignedErr } = await db
    .from('clients')
    .select('id, profile_id, status, assigned_manager_id')
    .eq('assigned_manager_id', managerId);
  if (assignedErr) return NextResponse.json({ error: assignedErr.message }, { status: 500 });

  const assigned = await hydrateClients(db, assignedRows ?? []);
  assigned.sort((a, b) =>
    (a.company_name || a.full_name || '').localeCompare(b.company_name || b.full_name || ''));

  // Optional search to find other clients to link
  const search = req.nextUrl.searchParams.get('search')?.trim() || '';
  let results: ClientLite[] = [];

  if (search) {
    // Match client companies by company name or contact name
    const { data: matchProfiles } = await db
      .from('profiles')
      .select('id')
      .eq('role', 'client')
      .or(`company_name.ilike.%${search}%,full_name.ilike.%${search}%`)
      .limit(25);

    const matchIds = (matchProfiles ?? []).map(p => p.id);
    if (matchIds.length) {
      const { data: clientRows } = await db
        .from('clients')
        .select('id, profile_id, status, assigned_manager_id')
        .in('profile_id', matchIds);

      // Exclude clients already linked to this manager
      const filtered = (clientRows ?? []).filter(r => r.assigned_manager_id !== managerId);
      results = await hydrateClients(db, filtered);
      results.sort((a, b) =>
        (a.company_name || a.full_name || '').localeCompare(b.company_name || b.full_name || ''));
    }
  }

  return NextResponse.json({ assigned, results });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: managerId } = await params;

  let body: { client_id?: string; action?: 'link' | 'unlink' };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { client_id, action } = body;
  if (!client_id || (action !== 'link' && action !== 'unlink')) {
    return NextResponse.json(
      { error: "client_id and action ('link' | 'unlink') are required" },
      { status: 400 }
    );
  }

  const db = getAdminClient();

  const check = await assertManager(db, managerId);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const { data: clientRow } = await db
    .from('clients')
    .select('id, assigned_manager_id')
    .eq('id', client_id)
    .maybeSingle();
  if (!clientRow) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const previousManagerId = clientRow.assigned_manager_id;

  if (action === 'unlink') {
    // Only unlink if the client is actually linked to this manager
    if (clientRow.assigned_manager_id !== managerId) {
      return NextResponse.json({ error: 'This client is not linked to this manager' }, { status: 400 });
    }
  }

  const newManagerId = action === 'link' ? managerId : null;

  const { error: updateErr } = await db
    .from('clients')
    .update({ assigned_manager_id: newManagerId, updated_at: new Date().toISOString() })
    .eq('id', client_id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  try {
    await db.from('iam_audit_log').insert({
      actor_id: actor.id,
      actor_name: actor.fullName || actor.email,
      target_id: managerId,
      target_email: null,
      action: action === 'link' ? 'link_client' : 'unlink_client',
      old_value: { client_id, assigned_manager_id: previousManagerId },
      new_value: { client_id, assigned_manager_id: newManagerId },
      notes: action === 'link'
        ? `Linked client ${client_id} to manager ${managerId}`
        : `Unlinked client ${client_id} from manager ${managerId}`,
    });
  } catch {}

  return NextResponse.json({ success: true, client_id, assigned_manager_id: newManagerId });
}
