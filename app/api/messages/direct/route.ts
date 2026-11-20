/**
 * POST /api/messages/direct
 *
 * Sends a direct message from a client to their assigned manager,
 * or from a manager to one of their assigned clients.
 *
 * Body:
 *   { body: string, recipientProfileId?: string, clientId?: string }
 *
 * - Client users: recipientProfileId is auto-resolved from their assigned manager.
 * - Manager users: must supply recipientProfileId (the client's profile_id).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function getSessionUser(): Promise<{ id: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const tokenCookie = allCookies.find(
      (c) =>
        c.name.endsWith('-auth-token') ||
        c.name === 'sb-access-token' ||
        c.name.endsWith('-access-token')
    );
    if (!tokenCookie?.value) return null;

    let token = tokenCookie.value;
    if (token.startsWith('[')) {
      try {
        const arr = JSON.parse(token);
        token = Array.isArray(arr) ? arr[0] : token;
      } catch {}
    }

    const anonDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await anonDb.auth.getUser(token);
    if (!data?.user?.id) return null;

    const db = makeServiceClient();
    const { data: profile } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) return null;
    return { id: profile.id, role: profile.role };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const messageBody = String(body.body ?? '').trim();
  const suppliedRecipientId = body.recipientProfileId as string | undefined;
  const suppliedClientId = body.clientId as string | undefined;

  if (!messageBody || messageBody.length < 1) {
    return NextResponse.json({ error: 'Message body is required.' }, { status: 400 });
  }
  if (messageBody.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 characters).' }, { status: 400 });
  }

  const db = makeServiceClient();
  let recipientProfileId: string | null = null;
  let clientId: string | null = null;
  let senderRole: 'client' | 'manager' | 'admin' | 'academy_manager' = 'client';

  // ── Client sending to assigned manager or academy manager ────────────────
  if (actor.role === 'client') {
    senderRole = 'client';
    const { data: clientRow } = await db
      .from('clients')
      .select('id, assigned_manager_id, academy_manager_id')
      .eq('profile_id', actor.id)
      .maybeSingle();

    if (!clientRow) {
      return NextResponse.json({ error: 'No client record found for your account.' }, { status: 404 });
    }

    // If the caller explicitly wants to reach their academy manager, use that
    const wantAcademy = body.toAcademyManager === true;

    if (wantAcademy) {
      if (!clientRow.academy_manager_id) {
        return NextResponse.json({ error: 'You do not have an assigned academy manager yet.' }, { status: 422 });
      }
      clientId = clientRow.id;
      recipientProfileId = clientRow.academy_manager_id;
    } else {
      if (!clientRow.assigned_manager_id) {
        return NextResponse.json({ error: 'You do not have an assigned manager yet.' }, { status: 422 });
      }
      clientId = clientRow.id;
      recipientProfileId = clientRow.assigned_manager_id;
    }
  }

  // ── Manager sending to a client ───────────────────────────────────────────
  else if (actor.role === 'manager') {
    senderRole = 'manager';

    if (!suppliedRecipientId && !suppliedClientId) {
      return NextResponse.json({ error: 'recipientProfileId or clientId is required.' }, { status: 400 });
    }

    // Resolve via clientId if supplied
    if (suppliedClientId) {
      const { data: clientRow } = await db
        .from('clients')
        .select('id, profile_id, assigned_manager_id')
        .eq('id', suppliedClientId)
        .eq('assigned_manager_id', actor.id) // ensure this is their client
        .maybeSingle();

      if (!clientRow) {
        return NextResponse.json({ error: 'Client not found or not assigned to you.' }, { status: 403 });
      }
      clientId = clientRow.id;
      recipientProfileId = clientRow.profile_id;
    } else if (suppliedRecipientId) {
      // Verify this client is assigned to the manager
      const { data: clientRow } = await db
        .from('clients')
        .select('id, profile_id, assigned_manager_id')
        .eq('profile_id', suppliedRecipientId)
        .eq('assigned_manager_id', actor.id)
        .maybeSingle();

      if (!clientRow) {
        return NextResponse.json({ error: 'Client not found or not assigned to you.' }, { status: 403 });
      }
      clientId = clientRow.id;
      recipientProfileId = suppliedRecipientId;
    }
  }

  // ── Academy manager sending to an assigned client ────────────────────────
  else if (['academy_manager', 'academy_director', 'training_program_manager'].includes(actor.role)) {
    senderRole = 'academy_manager';

    if (!suppliedRecipientId && !suppliedClientId) {
      return NextResponse.json({ error: 'recipientProfileId or clientId is required.' }, { status: 400 });
    }

    if (suppliedClientId) {
      const { data: clientRow } = await db
        .from('clients')
        .select('id, profile_id, academy_manager_id')
        .eq('id', suppliedClientId)
        .eq('academy_manager_id', actor.id)
        .maybeSingle();

      if (!clientRow) {
        return NextResponse.json({ error: 'Client not found or not assigned to you as academy manager.' }, { status: 403 });
      }
      clientId = clientRow.id;
      recipientProfileId = clientRow.profile_id;
    } else if (suppliedRecipientId) {
      const { data: clientRow } = await db
        .from('clients')
        .select('id, profile_id, academy_manager_id')
        .eq('profile_id', suppliedRecipientId)
        .eq('academy_manager_id', actor.id)
        .maybeSingle();

      if (!clientRow) {
        return NextResponse.json({ error: 'Client not found or not assigned to you as academy manager.' }, { status: 403 });
      }
      clientId = clientRow.id;
      recipientProfileId = suppliedRecipientId;
    }
  }

  // ── Admin can message anyone ──────────────────────────────────────────────
  else if (['admin', 'super_admin'].includes(actor.role)) {
    senderRole = 'admin';
    if (!suppliedRecipientId) {
      return NextResponse.json({ error: 'recipientProfileId is required.' }, { status: 400 });
    }
    recipientProfileId = suppliedRecipientId;
    clientId = suppliedClientId ?? null;
  } else {
    return NextResponse.json({ error: 'Your role cannot send direct messages.' }, { status: 403 });
  }

  if (!recipientProfileId) {
    return NextResponse.json({ error: 'Could not resolve recipient.' }, { status: 422 });
  }

  // ── Insert the DM ─────────────────────────────────────────────────────────
  const { data: dm, error } = await db
    .from('portal_direct_messages')
    .insert({
      client_id: clientId,
      sender_profile_id: actor.id,
      recipient_profile_id: recipientProfileId,
      sender_role: senderRole,
      body: messageBody,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, messageId: dm.id }, { status: 201 });
}
