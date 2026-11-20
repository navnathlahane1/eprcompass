/**
 * PATCH /api/iam/users/[id]  — update role, notes
 * DELETE /api/iam/users/[id] — soft-delete (ban only; hard delete not exposed)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
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

async function resolveActor(req: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.getAll().find(
    c => c.name.endsWith('-access-token') || c.name === 'sb-access-token'
  );
  const token = tryParseToken(raw?.value);
  if (!token) return null;
  const client = getAdminClient();
  const { data: { user } } = await client.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await client.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  const isSuperAdmin = emailIsSuperAdmin(user.email);
  const role = profile?.role || (isSuperAdmin ? 'admin' : '');
  if (!['user_manager', 'admin', 'manager'].includes(role)) return null;
  return { id: user.id, email: user.email, role, fullName: profile?.full_name };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: targetId } = await params;
  const body = await req.json();
  const { role, notes, full_name, company_name, phone } = body;

  const adminClient = getAdminClient();

  // Guard: fetch target profile, ensure it's not an admin
  const { data: target } = await adminClient
    .from('profiles').select('role, full_name, is_banned').eq('id', targetId).maybeSingle();

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'admin') return NextResponse.json({ error: 'Cannot modify admin users' }, { status: 403 });
  if (role && !MANAGEABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: `Cannot assign role '${role}'` }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (notes !== undefined) updates.notes = notes;
  if (full_name !== undefined) updates.full_name = full_name;
  if (company_name !== undefined) updates.company_name = company_name;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error: updateErr } = await adminClient
    .from('profiles').update(updates).eq('id', targetId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Audit
  await adminClient.from('iam_audit_log').insert({
    actor_id: actor.id,
    actor_name: actor.fullName || actor.email,
    target_id: targetId,
    target_email: null,
    action: role && role !== target.role ? 'role_change' : 'update',
    old_value: { role: target.role },
    new_value: updates,
  });

  return NextResponse.json({ success: true });
}
