/**
 * POST /api/admin/clients
 *
 * Creates a new client:
 *   1. Creates a Supabase Auth user (email_confirm bypassed — admin action)
 *   2. Inserts a profiles row with role = 'client'
 *   3. Inserts a clients row linked to the profile
 *
 * Returns { clientId, profileId, email, temporaryPassword } so the admin
 * can relay the credentials to the client or trigger a welcome email.
 *
 * Security: admin or manager role required (verified via resolveActor).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { randomBytes } from 'crypto';
import { createTask } from '@/lib/tasks/createTask';
import { isBusinessActivity } from '@/lib/onboarding/clientSetup';
import { findClientIdentity } from '@/lib/admin/clientIdentity';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

/**
 * Generates a cryptographically random temporary password.
 * Uses randomBytes to avoid Math.random bias.
 */
function generatePassword(length = 14): string {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = randomBytes(length * 2);
  let password = '';
  for (let i = 0; i < bytes.length && password.length < length; i++) {
    // Rejection-sample to avoid modulo bias
    const maxUsable = 256 - (256 % charset.length);
    if (bytes[i] < maxUsable) {
      password += charset[bytes[i] % charset.length];
    }
  }
  // Fallback: fill remaining if rejection loop didn't yield enough chars
  while (password.length < length) {
    const extra = randomBytes(4);
    password += charset[extra[0] % charset.length];
  }
  return password;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  // Auth check
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin or manager role required' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    email,
    full_name,
    company_name,
    phone,
    gstin,
    state,
    category,
    status,
    waste_categories,
    assigned_manager_id,
    notes,
    renewal_date,
    password: providedPassword,
    // Optional: link an existing IAM portal user instead of creating a new auth user
    existing_profile_id,
    // Optional: link this client to a company record from the Intel module
    intel_company_id,
  } = body as Record<string, any>;

  // ── Input validation ──────────────────────────────────────────────────────
  if (body.business_activity !== undefined && !isBusinessActivity(body.business_activity)) {
    return NextResponse.json({ error: 'Select Importer, Manufacturer, or Both' }, { status: 400 });
  }
  const activityPayload = body.business_activity === undefined ? {} : { business_activity: body.business_activity };

  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'category is required' }, { status: 400 });
  }

  const db = makeServiceClient();

  // ══════════════════════════════════════════════════════════════════════════
  // PATH A: Link an existing IAM portal user (no new auth user created)
  // ══════════════════════════════════════════════════════════════════════════
  if (existing_profile_id && typeof existing_profile_id === 'string') {
    // Validate the profile exists and has role='client'
    // NOTE: profiles has no email column — email lives in auth.users
    const { data: existingProfile, error: profileLookupError } = await db
      .from('profiles')
      .select('id, role, full_name, company_name, phone, gstin, state')
      .eq('id', existing_profile_id)
      .maybeSingle();

    if (profileLookupError) return NextResponse.json({ error: 'The existing portal profile could not be checked. Please retry.' }, { status: 503 });
    if (!existingProfile) {
      return NextResponse.json({ error: 'Portal user not found.' }, { status: 404 });
    }
    if (existingProfile.role !== 'client') {
      return NextResponse.json({ error: 'Profile must have role="client".' }, { status: 400 });
    }

    // Reuse an existing company record; never create a second owner profile.
    const { data: existingClient, error: clientLookupError } = await db
      .from('clients')
      .select('id')
      .eq('profile_id', existing_profile_id)
      .maybeSingle();
    if (clientLookupError) return NextResponse.json({ error: 'The existing company could not be checked. Please retry.' }, { status: 503 });

    // Optionally update profile with supplied company info
    if (company_name || gstin || state || full_name || phone) {
      const { error: profileUpdateError } = await db.from('profiles').update({
        ...(company_name && { company_name: String(company_name).trim() }),
        ...(gstin && { gstin: String(gstin).trim().toUpperCase() }),
        ...(state && { state: String(state).trim() }),
        ...(full_name && { full_name: String(full_name).trim() }),
        ...(phone && { phone: String(phone).trim() }),
      }).eq('id', existing_profile_id);
      if (profileUpdateError) return NextResponse.json({ error: 'The existing profile could not be updated. Please retry.' }, { status: 503 });
    }

    const clientName =
      (typeof company_name === 'string' && company_name.trim()) ||
      existingProfile.company_name ||
      existingProfile.full_name ||
      'Unnamed';

    const clientPayload = {
      ...activityPayload,
      profile_id: existing_profile_id,
      name: clientName,
      category,
      waste_categories: Array.isArray(waste_categories) ? waste_categories : [],
      status: ['Onboarding', 'Active', 'At Risk', 'Churned'].includes(status) ? status : 'Onboarding',
      assigned_manager_id: assigned_manager_id || null,
      notes: typeof notes === 'string' ? notes.trim() : null,
      renewal_date: renewal_date || null,
      intel_company_id: typeof intel_company_id === 'string' ? intel_company_id : null,
      updated_at: new Date().toISOString(),
    };

    let clientData: { id: string } | null = null;
    let clientError: { message: string } | null = null;

    if (existingClient) {
      const { data, error } = await db
        .from('clients')
        .update(clientPayload)
        .eq('id', existingClient.id)
        .select('id')
        .single();
      clientData = data;
      clientError = error;
    } else {
      const { data, error } = await db
        .from('clients')
        .insert(clientPayload)
        .select('id')
        .single();
      clientData = data;
      clientError = error;
    }

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: `Client record ${existingClient ? 'update' : 'creation'} failed: ${clientError?.message || 'unknown error'}` },
        { status: 500 }
      );
    }

    // Get the auth user email
    const { data: authUserData } = await db.auth.admin.getUserById(existing_profile_id);

    // Audit: link to new client
    {
      const { data: actorProfile } = await db
        .from('profiles')
        .select('full_name')
        .eq('id', actor.userId)
        .maybeSingle();
      await db.from('iam_audit_log').insert({
        actor_id: actor.userId,
        actor_name: actorProfile?.full_name ?? 'Admin',
        target_id: existing_profile_id,
        target_email: authUserData?.user?.email ?? null,
        action: 'link_company',
        old_value: existingClient ? { client_id: existingClient.id, profile_id: existing_profile_id } : { client_id: null, profile_id: null },
        new_value: { client_id: clientData.id, profile_id: existing_profile_id },
        notes: existingClient
          ? `Compliance profile updated in place for client ${clientData.id}`
          : `Portal login linked to new client ${clientData.id}`,
      });
    }

    // ── Auto-task: onboarding task for the assigned manager ──────────────
    if (assigned_manager_id && !existingClient) {
      await createTask({
        title: `Onboard new client: ${clientName}`,
        description: `New client linked to portal account. Complete onboarding: verify documents, set up filing statuses, and confirm contact details.`,
        task_type: 'client_onboarding',
        assigned_to: String(assigned_manager_id),
        client_id: clientData.id,
        related_entity_type: 'client',
        related_entity_id: clientData.id,
        priority: 'high',
        created_by: actor.userId,
      });
    }

    return NextResponse.json(
      {
        clientId: clientData.id,
        profileId: existing_profile_id,
        email: authUserData?.user?.email || null,
        temporaryPassword: null, // no new password — existing account
        linked: true,
      },
      { status: existingClient ? 200 : 201 }
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATH B: Create a brand-new auth user + profile + client row (original flow)
  // ══════════════════════════════════════════════════════════════════════════

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required when not linking an existing user' }, { status: 400 });
  }
  if (!full_name || typeof full_name !== 'string') {
    return NextResponse.json({ error: 'full_name is required' }, { status: 400 });
  }
  // Basic RFC 5322 email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const temporaryPassword: string =
    typeof providedPassword === 'string' && providedPassword.length >= 8
      ? providedPassword
      : generatePassword();

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await findClientIdentity(db, normalizedEmail);
    if (existingUser) return NextResponse.json({
      error: existingUser.clientId ? 'This account already has a client company.' : existingUser.canLink ? 'This email already has a portal login. Link the existing account to this company.' : 'This email belongs to an existing account. Review its access in IAM before linking a company.',
      existingUser,
    }, { status: 409 });
  } catch {
    return NextResponse.json({ error: 'Existing accounts could not be checked. Please retry before creating a client.' }, { status: 503 });
  }

  // ── 1. Create Supabase Auth user ──────────────────────────────────────────

  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: true, // Admin-created accounts skip email confirmation
    user_metadata: { full_name: full_name.trim() },
  });

  if (authError) {
    const isDuplicate =
      authError.message.toLowerCase().includes('already') ||
      authError.message.toLowerCase().includes('duplicate');
    return NextResponse.json(
      { error: isDuplicate ? 'A user with this email already exists.' : authError.message },
      { status: isDuplicate ? 409 : 400 }
    );
  }

  const authUserId = authData.user.id;

  // ── 2. Insert profile row ──────────────────────────────────────────────────

  const { error: profileError } = await db.from('profiles').upsert({
    id: authUserId,
    role: 'client',
    full_name: full_name.trim(),
    company_name: typeof company_name === 'string' ? company_name.trim() : null,
    phone: typeof phone === 'string' ? phone.trim() : null,
    gstin: typeof gstin === 'string' ? gstin.trim().toUpperCase() : null,
    state: typeof state === 'string' ? state.trim() : null,
  }, { onConflict: 'id' });

  if (profileError) {
    // Rollback the auth user to maintain consistency
    await db.auth.admin.deleteUser(authUserId);
    return NextResponse.json(
      { error: `Profile creation failed: ${profileError.message}` },
      { status: 500 }
    );
  }

  // ── 3. Insert client record ────────────────────────────────────────────────

  // `name` is a legacy NOT NULL column — derive from company_name or full_name
  const newClientName =
    (typeof company_name === 'string' && company_name.trim()) ||
    (typeof full_name === 'string' && full_name.trim()) ||
    'Unnamed';

  const { data: clientData, error: clientError } = await db
    .from('clients')
    .insert({
      profile_id: authUserId,
      name: newClientName,
      ...activityPayload,
      category,
      waste_categories: Array.isArray(waste_categories) ? waste_categories : [],
      status: ['Onboarding', 'Active', 'At Risk', 'Churned'].includes(status) ? status : 'Onboarding',
      assigned_manager_id: assigned_manager_id || null,
      notes: typeof notes === 'string' ? notes.trim() : null,
      renewal_date: renewal_date || null,
      intel_company_id: typeof intel_company_id === 'string' ? intel_company_id : null,
    })
    .select('id')
    .single();

  if (clientError) {
    // Rollback profile + auth user
    await db.from('profiles').delete().eq('id', authUserId);
    await db.auth.admin.deleteUser(authUserId);
    return NextResponse.json(
      { error: `Client record creation failed: ${clientError.message}` },
      { status: 500 }
    );
  }

  // ── Auto-task: onboarding task for the assigned manager ────────────────
  if (assigned_manager_id) {
    await createTask({
      title: `Onboard new client: ${newClientName}`,
      description: `New portal account created for ${normalizedEmail}. Complete onboarding: send welcome info, verify details, and set up filing statuses.`,
      task_type: 'client_onboarding',
      assigned_to: String(assigned_manager_id),
      client_id: clientData.id,
      related_entity_type: 'client',
      related_entity_id: clientData.id,
      priority: 'high',
      created_by: actor.userId,
    });
  }

  return NextResponse.json(
    {
      clientId: clientData.id,
      profileId: authUserId,
      email: normalizedEmail,
      temporaryPassword,
      linked: false,
    },
    { status: 201 }
  );
}
