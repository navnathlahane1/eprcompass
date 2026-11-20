/**
 * GET  /api/iam/users/[id]/partner-assignments
 *   Returns the partner company linked to this profile (via
 *   partners.profile_id), the currently assigned Portal User and Customer
 *   Success Manager, plus the full lists of candidates for each dropdown.
 *
 * PATCH /api/iam/users/[id]/partner-assignments
 *   Body: { field: 'portal_user_id' | 'csm_id', value: string | null }
 *   Sets partners.portal_user_id or partners.csm_id for the partner company
 *   linked to this user. Logs the action to iam_audit_log.
 *
 * Security: user_manager, admin, or manager role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

const FIELD_CONFIG = {
  portal_user_id: {
    eligibleRoles: ['manager', 'user_manager', 'admin'],
    auditAction: 'assign_partner_portal_user',
    label: 'Portal User',
  },
  csm_id: {
    eligibleRoles: ['manager', 'admin'],
    auditAction: 'assign_partner_csm',
    label: 'Customer Success Manager',
  },
} as const;

type AssignableField = keyof typeof FIELD_CONFIG;

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

async function resolveAssignedProfile(db: ReturnType<typeof getAdminClient>, profileId: string | null) {
  if (!profileId) return null;
  const { data: p } = await db
    .from('profiles')
    .select('id, full_name')
    .eq('id', profileId)
    .maybeSingle();
  if (!p) return null;
  const { data: authData } = await db.auth.admin.getUserById(profileId);
  return { id: p.id, full_name: p.full_name, email: authData?.user?.email ?? null };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: profileId } = await params;
  const db = getAdminClient();

  const { data: partnerRow } = await db
    .from('partners')
    .select('id, portal_user_id, csm_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  const { data: partnerProfile } = await db
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', profileId)
    .maybeSingle();

  const [assignedPortalUser, assignedCsm] = await Promise.all([
    resolveAssignedProfile(db, partnerRow?.portal_user_id ?? null),
    resolveAssignedProfile(db, partnerRow?.csm_id ?? null),
  ]);

  const { data: portalUserProfiles } = await db
    .from('profiles')
    .select('id, full_name')
    .in('role', FIELD_CONFIG.portal_user_id.eligibleRoles)
    .order('full_name', { ascending: true });

  const { data: csmProfiles } = await db
    .from('profiles')
    .select('id, full_name')
    .in('role', FIELD_CONFIG.csm_id.eligibleRoles)
    .order('full_name', { ascending: true });

  const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailMap: Record<string, string> = {};
  for (const u of authList?.users || []) emailMap[u.id] = u.email || '';

  const toCandidates = (rows: { id: string; full_name: string | null }[] | null) =>
    (rows || []).map(m => ({ id: m.id, full_name: m.full_name || null, email: emailMap[m.id] || null }));

  return NextResponse.json({
    partner_company: partnerRow
      ? {
          id: partnerRow.id,
          name: partnerProfile?.company_name || partnerProfile?.full_name || null,
          portal_user_id: partnerRow.portal_user_id ?? null,
          csm_id: partnerRow.csm_id ?? null,
        }
      : null,
    assigned_portal_user: assignedPortalUser,
    assigned_csm: assignedCsm,
    portal_users: toCandidates(portalUserProfiles),
    csm_candidates: toCandidates(csmProfiles),
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

  let body: { field?: string; value?: string | null };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const field = body.field as AssignableField;
  if (!field || !(field in FIELD_CONFIG)) {
    return NextResponse.json({ error: `field must be one of: ${Object.keys(FIELD_CONFIG).join(', ')}` }, { status: 400 });
  }

  const config = FIELD_CONFIG[field];
  const newValue = body.value || null;
  const db = getAdminClient();

  const { data: partnerRow } = await db
    .from('partners')
    .select('id, portal_user_id, csm_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (!partnerRow) {
    return NextResponse.json(
      { error: 'No partner company is linked to this portal user. Link a company first from Admin → CRM → Partners.' },
      { status: 404 }
    );
  }

  if (newValue) {
    const { data: candidateProfile } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', newValue)
      .maybeSingle();

    if (!candidateProfile) {
      return NextResponse.json({ error: `${config.label} profile not found` }, { status: 404 });
    }
    if (!config.eligibleRoles.includes(candidateProfile.role)) {
      return NextResponse.json(
        { error: `User has role '${candidateProfile.role}' — only ${config.eligibleRoles.join(', ')} can be assigned as ${config.label}` },
        { status: 400 }
      );
    }
  }

  const previousValue = partnerRow[field];

  const { error: updateErr } = await db
    .from('partners')
    .update({ [field]: newValue })
    .eq('id', partnerRow.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  try {
    await db.from('iam_audit_log').insert({
      actor_id: actor.id,
      actor_name: actor.fullName || actor.email,
      target_id: profileId,
      target_email: null,
      action: config.auditAction,
      old_value: { [field]: previousValue },
      new_value: { [field]: newValue },
      notes: newValue ? `Assigned ${config.label} ${newValue}` : `${config.label} unassigned`,
    });
  } catch {}

  return NextResponse.json({ success: true, field, value: newValue });
}
