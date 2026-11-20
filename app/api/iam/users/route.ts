/**
 * POST /api/iam/users
 * Create a new portal user (all roles except admin / superadmin).
 * Caller must be authenticated as user_manager, admin, or manager.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { ACADEMY_PORTAL_ROLES, ACADEMY_ROLE_LABELS } from '@/lib/academy/access';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

const MANAGEABLE_ROLES = [
  'client', 'partner', 'cepc', 'recycler', 'legal', 'compliance_manager', 'telecaller', 'sales-executive',
  'manager', 'user_manager', 'task_manager', 'cfo', 'finance_executive',
  'academy_director', 'academy_manager', 'training_program_manager', 'trainer', 'guest_trainer',
  'partner_trainer', 'learner', 'viewer',
  // Telecalling sub-roles
  'tc_team_lead', 'tc_senior_agent', 'tc_quality_analyst', 'tc_campaign_manager', 'tc_trainer',
  // Tendering portal roles
  'tendering_manager', 'tendering_executive',
  // Communications & Marketing department roles
  'comms_cmo', 'comms_brand_manager', 'comms_regional_manager', 'comms_campaign_manager',
  'comms_social_media_manager', 'comms_content_strategist', 'comms_content_creator',
  'comms_graphic_designer', 'comms_community_manager', 'comms_performance_specialist',
  'comms_pr_manager', 'comms_influencer_manager', 'comms_marketing_analyst',
  'comms_marketing_ops', 'comms_marketing_intern',
  // Knowledge Hub roles
  'knowledge_admin', 'knowledge_manager', 'knowledge_contributor', 'knowledge_viewer',
  // Business & Sales WFH roles
  'lead_gen_executive', 'appointment_setter', 'crm_data_executive', 'customer_support_executive',
  // Operations WFH roles
  'virtual_assistant', 'proposal_executive', 'compliance_doc_executive',
  'market_research_executive', 'mis_reporting_executive',
];

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

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

const ACADEMY_PORTAL_ROLE_SET = new Set<string>(ACADEMY_PORTAL_ROLES);

/**
 * When an academy-portal user is created from IAM, drop an in-app notification
 * for every Academy Director so they can track new provisioning. The directory
 * of all such users lives at /academy/team-members. Fire-and-forget: a failure
 * here must never roll back the user creation.
 */
async function notifyAcademyDirectors(
  db: SupabaseClient,
  opts: { newUserId: string; role: string; displayName: string }
): Promise<void> {
  try {
    const { data: directors } = await db
      .from('profiles')
      .select('id')
      .eq('role', 'academy_director')
      .eq('is_banned', false);

    const recipients = (directors ?? []).filter(d => d.id !== opts.newUserId);
    if (!recipients.length) return;

    const roleLabel = ACADEMY_ROLE_LABELS[opts.role] ?? opts.role;
    const message = `New academy user added: ${opts.displayName} (${roleLabel})`;

    await db.from('notifications').insert(
      recipients.map(d => ({
        profile_id: d.id,
        type: 'system',
        message,
        link: '/academy/team-members',
        read: false,
      }))
    );
  } catch {
    // Notifications are best-effort; never block user creation on them.
  }
}

async function resolveActor(req: NextRequest) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Supabase v2 may chunk large tokens across sb-<ref>-auth-token.0, .1, etc.
  const chunks = allCookies
    .filter(c => /^sb-.+-auth-token\.\d+$/.test(c.name))
    .sort((a, b) => {
      const ai = parseInt(a.name.split('.').pop() ?? '0');
      const bi = parseInt(b.name.split('.').pop() ?? '0');
      return ai - bi;
    });
  const reassembled = chunks.length > 0 ? chunks.map(c => c.value).join('') : undefined;

  const raw =
    allCookies.find(c => c.name.endsWith('-access-token') || c.name === 'sb-access-token') ??
    (reassembled ? { value: reassembled } : undefined) ??
    allCookies.find(c => c.name.endsWith('-auth-token') && !c.name.match(/\.\d+$/));
  const token = tryParseToken(raw?.value);
  if (!token) return null;

  const client = getAdminClient();
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await client
    .from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();

  const isSuperAdmin = emailIsSuperAdmin(user.email);
  const role = profile?.role || (isSuperAdmin ? 'admin' : '');

  if (!['user_manager', 'admin', 'manager'].includes(role)) return null;
  return { id: user.id, email: user.email, role, fullName: profile?.full_name };
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    email, password, role, full_name, company_name, phone,
    // Partner-specific fields (optional, only used when role='partner')
    partner_tier, partner_type: req_partner_type, persona_label,
    commission_type, commission_value, nda_signed,
    state, city,
    // Recycler-specific fields (optional, only used when role='recycler')
    recycler_intel_company_id,
    recycler_gstin, recycler_state, recycler_city, recycler_address,
    recycler_waste_categories, recycler_capacity_mt_pa,
    recycler_cpcb_cert_no, recycler_cpcb_cert_expiry,
  } = body;

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'email, password, and role are required' }, { status: 400 });
  }
  if (!MANAGEABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: `Role '${role}' cannot be assigned via IAM` }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const adminClient = getAdminClient();

  // Create auth user
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });

  if (authErr || !authData?.user) {
    return NextResponse.json({ error: authErr?.message || 'Failed to create auth user' }, { status: 400 });
  }

  const userId = authData.user.id;

  // Upsert profile — the DB may have a trigger that auto-inserts a skeleton
  // row on auth.user creation, so INSERT would fail with a duplicate-key error.
  // upsert (insert + on conflict update) handles both cases cleanly.
  // force_password_change = true ensures the user must change their password on first login.
  const { error: profileErr } = await adminClient.from('profiles').upsert({
    id: userId,
    role,
    full_name: full_name?.trim() || null,
    company_name: company_name?.trim() || null,
    phone: phone?.trim() || null,
    force_password_change: true,
  }, { onConflict: 'id' });

  if (profileErr) {
    // Rollback auth user creation
    await adminClient.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Create role-specific profile records so the portal isn't stuck on "Account Setup Pending"
  if (role === 'partner') {
    const { error: partnerErr } = await adminClient.from('partners').insert({
      profile_id: userId,
      company_name: (company_name?.trim() || full_name?.trim() || email.split('@')[0]),
      partner_type: req_partner_type || 'Env Consultant',
      contact_person: full_name?.trim() || null,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      partner_tier: partner_tier ?? null,
      partner_status: 'Probationary',
      persona_label: persona_label?.trim() || null,
      commission_type: commission_type || null,
      commission_value: commission_value ?? null,
      nda_signed: !!nda_signed,
      state: state?.trim() || null,
      city: city?.trim() || null,
    });
    if (partnerErr) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Partner record: ${partnerErr.message}` }, { status: 500 });
    }
  }

  if (role === 'recycler') {
    const recyclerName = company_name?.trim() || full_name?.trim() || email.split('@')[0];
    const wasteCategories: string[] = Array.isArray(recycler_waste_categories) ? recycler_waste_categories : [];
    const capacityMt = recycler_capacity_mt_pa ? Number(recycler_capacity_mt_pa) : null;

    const { error: recyclerErr } = await adminClient.from('recyclers').insert({
      profile_id: userId,
      user_id: userId,          // critical: auth lookup in recyclerAuth.ts uses user_id
      intel_company_id: recycler_intel_company_id || null,
      name: recyclerName,
      contact_email: email.trim().toLowerCase(),
      contact_phone: phone?.trim() || null,
      type: 'RECYCLER',
      verification_status: 'PENDING',
      // Company details collected at IAM onboarding time
      state: recycler_state || null,
      city: recycler_city || null,
      contact_address: recycler_address || null,
      epr_categories: wasteCategories,
      capacity: capacityMt ? { mt_pa: capacityMt } : {},
      cpcb_cert_no: recycler_cpcb_cert_no || null,
      cpcb_cert_expiry: recycler_cpcb_cert_expiry || null,
      // Defaults
      epr_types_managed: [],
      authorized_states: [],
      certifications: [],
      geocode_queued: false,
      documents_count: 0,
      public_profile_enabled: false,
      public_highlights: [],
      training_completed: false,
    });
    if (recyclerErr) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Recycler record: ${recyclerErr.message}` }, { status: 500 });
    }
  }

  // NOTE: no `clients` row is created here for role='client'. The compliance
  // profile is completed from Admin CRM → Clients → "Link Existing IAM Account",
  // which now updates the existing `clients` row in place (no orphaned records).

  // Audit log
  await adminClient.from('iam_audit_log').insert({
    actor_id: actor.id,
    actor_name: actor.fullName || actor.email,
    target_id: userId,
    target_email: email.trim().toLowerCase(),
    action: 'create',
    new_value: { role, full_name, company_name, invite_email_sent: false },
  });

  // Notify Academy Directors when an academy-portal user is provisioned
  if (ACADEMY_PORTAL_ROLE_SET.has(role)) {
    await notifyAcademyDirectors(adminClient, {
      newUserId: userId,
      role,
      displayName: full_name?.trim() || email.trim().toLowerCase(),
    });
  }

  return NextResponse.json({ success: true, userId }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') || '';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 50;
  const offset = (page - 1) * limit;

  const adminClient = getAdminClient();

  let query = adminClient
    .from('profiles')
    .select('id, role, full_name, company_name, phone, created_at, is_banned, banned_reason, banned_at, notes', { count: 'exact' })
    .not('role', 'eq', 'admin')   // never expose admin users
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) query = query.eq('role', role);
  if (status === 'banned') query = query.eq('is_banned', true);
  if (status === 'active') query = query.eq('is_banned', false);
  if (search) query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with auth emails via admin API (batch up to 50)
  const { data: authUsers } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
  const emailMap: Record<string, string> = {};
  const lastSignInMap: Record<string, string> = {};
  for (const u of authUsers?.users || []) {
    emailMap[u.id] = u.email || '';
    lastSignInMap[u.id] = u.last_sign_in_at || '';
  }

  const enriched = (data || []).map((p: any) => ({
    ...p,
    email: emailMap[p.id] || null,
    last_sign_in_at: lastSignInMap[p.id] || null,
  }));

  return NextResponse.json({ users: enriched, total: count ?? 0 });
}
