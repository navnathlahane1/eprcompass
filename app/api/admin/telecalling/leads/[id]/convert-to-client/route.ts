import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { randomBytes } from 'crypto';
import { createTask } from '@/lib/tasks/createTask';
import { sendTemplateMessage, sendTextMessage, TEMPLATES } from '@/lib/whatsapp/client';

export const runtime = 'nodejs';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function generatePassword(length = 14): string {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = randomBytes(length * 2);
  let password = '';
  for (let i = 0; i < bytes.length && password.length < length; i++) {
    const maxUsable = 256 - (256 % charset.length);
    if (bytes[i] < maxUsable) password += charset[bytes[i] % charset.length];
  }
  while (password.length < length) {
    password += charset[randomBytes(1)[0] % charset.length];
  }
  return password;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin or manager role required' }, { status: 403 });

  const { id: leadId } = await params;
  const db = makeServiceClient();

  // ── 1. Fetch the telecalling lead ─────────────────────────────────────────
  const { data: lead, error: leadErr } = await db
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // ── 2. Parse body overrides (admin can adjust before converting) ──────────
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* no body is fine */ }

  // Resolve fields — body values override lead values so admin can correct
  const companyName: string =
    (body.company_name ?? lead.company_name ?? lead.company ?? '').trim();
  const contactName: string =
    (body.full_name ?? lead.contact_name ?? lead.name ?? '').trim();
  const email: string =
    (body.email ?? lead.email ?? '').trim().toLowerCase();
  const phone: string =
    (body.phone ?? lead.phone ?? lead.mobile ?? '').trim();
  const state: string =
    (body.state ?? lead.state ?? '').trim();
  const city: string =
    (body.city ?? lead.city ?? '').trim();
  const category: string =
    (body.category ?? 'EPR - General').trim();
  const assignedManagerId: string | null =
    body.assigned_manager_id ?? null;

  if (!email) {
    return NextResponse.json({ error: 'Email is required to create a client account' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }
  if (!contactName && !companyName) {
    return NextResponse.json({ error: 'Contact name or company name is required' }, { status: 400 });
  }

  const temporaryPassword = generatePassword();
  const fullName = contactName || companyName;

  // ── 3. Create Supabase Auth user ──────────────────────────────────────────
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    const isDuplicate =
      authError.message.toLowerCase().includes('already') ||
      authError.message.toLowerCase().includes('duplicate');
    return NextResponse.json(
      { error: isDuplicate ? 'A portal user with this email already exists.' : authError.message },
      { status: isDuplicate ? 409 : 400 }
    );
  }

  const authUserId = authData.user.id;

  // ── 4. Create profile row ─────────────────────────────────────────────────
  const { error: profileError } = await db.from('profiles').insert({
    id: authUserId,
    role: 'client',
    full_name: fullName,
    company_name: companyName || null,
    phone: phone || null,
    state: state || null,
    force_password_change: true,
  });

  if (profileError) {
    await db.auth.admin.deleteUser(authUserId);
    return NextResponse.json(
      { error: `Profile creation failed: ${profileError.message}` },
      { status: 500 }
    );
  }

  // ── 5. Create clients record ──────────────────────────────────────────────
  const { data: clientData, error: clientError } = await db
    .from('clients')
    .insert({
      profile_id: authUserId,
      name: companyName || fullName,
      category,
      status: 'Onboarding',
      assigned_manager_id: assignedManagerId || null,
      notes: `Converted from telecalling lead. City: ${city || '—'}. Original lead ID: ${leadId}`,
    })
    .select('id')
    .single();

  if (clientError) {
    await db.from('profiles').delete().eq('id', authUserId);
    await db.auth.admin.deleteUser(authUserId);
    return NextResponse.json(
      { error: `Client record creation failed: ${clientError.message}` },
      { status: 500 }
    );
  }

  // ── 6. Mark the telecalling lead as Converted + store back-reference ──────
  // Try to store client_id; silently ignore if column doesn't exist yet
  const leadUpdate: Record<string, any> = { tc_status: 'Converted' };
  await db.from('leads').update(leadUpdate).eq('id', leadId);
  // Best-effort: store client_id linkage (requires column to exist)
  await db.from('leads').update({ client_id: clientData.id }).eq('id', leadId).then(() => {});

  // ── 7. Create onboarding task for the assigned manager ────────────────────
  if (assignedManagerId) {
    await createTask({
      title: `Onboard new client: ${companyName || fullName}`,
      description: `Converted from telecalling lead (ID: ${leadId}). Client portal account created for ${email}. Complete onboarding: send welcome info, verify documents, set up filing statuses.`,
      task_type: 'client_onboarding',
      assigned_to: assignedManagerId,
      client_id: clientData.id,
      related_entity_type: 'client',
      related_entity_id: clientData.id,
      priority: 'high',
      created_by: actor.userId,
    });
  }

  // ── 8. Send WhatsApp welcome message with credentials ─────────────────────
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/portal/login`;
  let whatsappSent = false;
  let whatsappError: string | null = null;

  // Craft a warm, clear welcome message for the plain-text path
  const firstName = fullName.split(' ')[0];
  const welcomeMessage = [
    `Hi ${firstName}! 👋`,
    '',
    `Welcome to *EPR Compass* — your compliance journey starts here.`,
    '',
    `We've created your portal account. Here are your login details:`,
    '',
    `🌐 *Portal:* ${portalUrl}`,
    `📧 *Email:* ${email}`,
    `🔐 *Password:* ${temporaryPassword}`,
    '',
    `👉 Please log in and set a new password on your first visit.`,
    '',
    `Our team will guide you through the next steps. Feel free to reply here if you have any questions.`,
    '',
    `— Team EPR Compass`,
  ].join('\n');

  if (phone) {
    // Normalise phone to E.164 — add India country code if not present
    const normalizedPhone = phone.replace(/\D/g, '');
    const e164Phone = normalizedPhone.startsWith('91') && normalizedPhone.length === 12
      ? normalizedPhone
      : normalizedPhone.length === 10
      ? `91${normalizedPhone}`
      : normalizedPhone;

    // Try approved welcome_client template first (required for first-contact outbound by Meta policy)
    // Params: {{1}} = first name, {{2}} = email, {{3}} = password
    const templateResult = await sendTemplateMessage(
      e164Phone,
      TEMPLATES.WELCOME_CLIENT,
      [firstName, email, temporaryPassword]
    ).catch((err: Error) => ({ success: false, data: { error: err.message } }));

    if (templateResult.success) {
      whatsappSent = true;
    } else {
      // Fallback to plain text (works if the client has messaged this number before)
      const textResult = await sendTextMessage(e164Phone, welcomeMessage)
        .catch((err: Error) => ({ success: false, data: { error: err.message } }));

      if (textResult.success) {
        whatsappSent = true;
      } else {
        whatsappError = (textResult.data as any)?.error?.message || 'WhatsApp delivery failed';
      }
    }
  }

  return NextResponse.json({
    success: true,
    clientId: clientData.id,
    profileId: authUserId,
    email,
    temporaryPassword,
    phone,
    companyName: companyName || fullName,
    portalUrl,
    whatsappSent,
    whatsappError,
    whatsappMessage: welcomeMessage,
  }, { status: 201 });
}

