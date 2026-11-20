/**
 * GET  /api/admin/clients/[clientId]/link-user?search=<query>
 *   Search portal users (role='client') by name / email / company.
 *   Each result includes linked_client_id / linked_client_name so the
 *   UI can warn when a user is already connected to a different company.
 *
 * PATCH /api/admin/clients/[clientId]/link-user
 *   Body: { profile_id: string | null }
 *   Links or unlinks a portal user from this client.
 *   If the user is currently linked to a DIFFERENT client, that old
 *   link is cleared first (both changes are written to iam_audit_log).
 *
 * Security: admin or manager role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// ─── GET — search portal users ────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin or manager role required' }, { status: 403 });

  const { clientId } = await params;
  const search = req.nextUrl.searchParams.get('search')?.trim() || '';

  const db = makeServiceClient();

  // Fetch matching profiles with role='client'
  let query = (db as any)
    .from('profiles')
    .select('id, full_name, company_name, phone')
    .eq('role', 'client')
    .limit(20);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!profiles?.length) return NextResponse.json({ users: [] });

  // Auth data batch (emails + last sign-in)
  const { data: authData } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailMap: Record<string, string> = {};
  const lastSignInMap: Record<string, string> = {};
  for (const u of authData?.users || []) {
    emailMap[u.id] = u.email || '';
    lastSignInMap[u.id] = u.last_sign_in_at || '';
  }

  // Email filter when search contains '@'
  let filtered = profiles;
  if (search.includes('@')) {
    const lower = search.toLowerCase();
    filtered = profiles.filter(
      (p: any) =>
        (emailMap[p.id] || '').toLowerCase().includes(lower) ||
        (p.full_name || '').toLowerCase().includes(lower.replace(/@.*/, '')) ||
        (p.company_name || '').toLowerCase().includes(lower.replace(/@.*/, ''))
    );
  }

  const profileIds: string[] = filtered.map((p: any) => p.id);

  // Find which of these profiles are already linked to a client record
  const { data: linkedClients } = await (db as any)
    .from('clients')
    .select('id, profile_id, category')
    .in('profile_id', profileIds);

  // Build a map: profile_id → { client_id, company_name_from_profile }
  // We need the company name — join with profiles for the linked profile
  const linkedMap: Record<string, { client_id: string; company_name: string | null }> = {};
  for (const lc of linkedClients || []) {
    if (lc.profile_id) {
      // company_name comes from the profile we already have
      const matchedProfile = profiles.find((p: any) => p.id === lc.profile_id);
      linkedMap[lc.profile_id] = {
        client_id: lc.id,
        company_name: matchedProfile?.company_name ?? null,
      };
    }
  }

  const users = filtered.slice(0, 10).map((p: any) => ({
    id: p.id,
    full_name: p.full_name || null,
    company_name: p.company_name || null,
    phone: p.phone || null,
    email: emailMap[p.id] || null,
    last_sign_in_at: lastSignInMap[p.id] || null,
    // populated when user is already linked to a client
    linked_client_id: linkedMap[p.id]?.client_id ?? null,
    // this is the company name stored on their own profile
    linked_company_name: linkedMap[p.id] ? (p.company_name ?? 'another company') : null,
  }));

  // Final email filter
  const final =
    search.includes('@')
      ? users.filter((u: any) => (u.email || '').toLowerCase().includes(search.toLowerCase()))
      : users;

  return NextResponse.json({ users: final });
}

// ─── PATCH — link or unlink a portal user ────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin or manager role required' }, { status: 403 });

  const { clientId } = await params;

  let body: { profile_id?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!('profile_id' in body)) {
    return NextResponse.json({ error: 'profile_id is required' }, { status: 400 });
  }

  const db = makeServiceClient();

  // Resolve actor's name for audit records
  const { data: actorProfile } = await (db as any)
    .from('profiles')
    .select('full_name')
    .eq('id', actor.userId)
    .maybeSingle();
  const actorName: string = actorProfile?.full_name ?? 'Admin';

  // Fetch the target client
  const { data: targetClient, error: fetchErr } = await (db as any)
    .from('clients')
    .select('id, profile_id')
    .eq('id', clientId)
    .maybeSingle();

  if (fetchErr || !targetClient) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const newProfileId = body.profile_id || null;

  // ── UNLINK path ────────────────────────────────────────────────────────────
  if (!newProfileId) {
    const oldProfileId = targetClient.profile_id;

    const { error: updateErr } = await (db as any)
      .from('clients')
      .update({ profile_id: null, updated_at: new Date().toISOString() })
      .eq('id', clientId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Fetch the unlinked user's email for the audit record
    let unlinkedEmail: string | null = null;
    if (oldProfileId) {
      const { data: authUser } = await db.auth.admin.getUserById(oldProfileId);
      unlinkedEmail = authUser?.user?.email ?? null;
    }

    await (db as any).from('iam_audit_log').insert({
      actor_id: actor.userId,
      actor_name: actorName,
      target_id: oldProfileId ?? null,
      target_email: unlinkedEmail,
      action: 'unlink_company',
      old_value: { client_id: clientId, profile_id: oldProfileId },
      new_value: { client_id: clientId, profile_id: null },
      notes: `Portal login unlinked from client ${clientId}`,
    });

    return NextResponse.json({ success: true, profile_id: null });
  }

  // ── LINK path ──────────────────────────────────────────────────────────────

  // Verify the profile exists and has role='client'
  const { data: profile, error: profileErr } = await (db as any)
    .from('profiles')
    .select('id, role, full_name, company_name')
    .eq('id', newProfileId)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Portal user not found' }, { status: 404 });
  }
  if (profile.role !== 'client') {
    return NextResponse.json(
      { error: `Profile role is '${profile.role}', expected 'client'` },
      { status: 400 }
    );
  }

  // Check if this profile is already linked to a DIFFERENT client
  const { data: existingLink } = await (db as any)
    .from('clients')
    .select('id, profile_id')
    .eq('profile_id', newProfileId)
    .neq('id', clientId)
    .maybeSingle();

  // Fetch the portal user's auth email for audit records
  let portalEmail: string | null = null;
  try {
    const { data: authUser } = await db.auth.admin.getUserById(newProfileId);
    portalEmail = authUser?.user?.email ?? null;
  } catch {
    // non-fatal
  }

  // If linked elsewhere, clear the old link first
  if (existingLink) {
    const { error: clearErr } = await (db as any)
      .from('clients')
      .update({ profile_id: null, updated_at: new Date().toISOString() })
      .eq('id', existingLink.id);

    if (clearErr) {
      return NextResponse.json(
        { error: `Failed to clear previous link: ${clearErr.message}` },
        { status: 500 }
      );
    }

    // Audit: unlink from old company
    await (db as any).from('iam_audit_log').insert({
      actor_id: actor.userId,
      actor_name: actorName,
      target_id: newProfileId,
      target_email: portalEmail,
      action: 'unlink_company',
      old_value: { client_id: existingLink.id, profile_id: newProfileId },
      new_value: { client_id: existingLink.id, profile_id: null },
      notes: `Portal login moved away from client ${existingLink.id} to client ${clientId}`,
    });
  }

  // Link to the new client
  const { error: updateErr } = await (db as any)
    .from('clients')
    .update({ profile_id: newProfileId, updated_at: new Date().toISOString() })
    .eq('id', clientId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Audit: link to new company
  await (db as any).from('iam_audit_log').insert({
    actor_id: actor.userId,
    actor_name: actorName,
    target_id: newProfileId,
    target_email: portalEmail,
    action: 'link_company',
    old_value: existingLink
      ? { client_id: existingLink.id, profile_id: newProfileId }
      : { client_id: null, profile_id: null },
    new_value: { client_id: clientId, profile_id: newProfileId },
    notes: existingLink
      ? `Portal login moved from client ${existingLink.id} → client ${clientId}`
      : `Portal login linked to client ${clientId}`,
  });

  return NextResponse.json({
    success: true,
    profile_id: newProfileId,
    moved_from_client_id: existingLink?.id ?? null,
  });
}
