/**
 * PATCH /api/admin/clients/[clientId]
 *
 * Updates profile fields and/or client-record fields for a given client.
 * Accepts a partial body — only provided fields are updated.
 *
 * DELETE /api/admin/clients/[clientId]
 *
 * Sets status = 'Churned' (soft archive). Does NOT delete the auth user.
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

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin or manager role required' }, { status: 403 });

  const { clientId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    // Profile fields
    full_name,
    company_name,
    phone,
    gstin,
    state,
    // Client record fields
    category,
    status,
    waste_categories,
    assigned_manager_id,
    notes,
    renewal_date,
    onboarded_date,
    ltv_inr,
    intel_company_id,
  } = body as Record<string, any>;

  const db = makeServiceClient();

  // Fetch client to resolve profile_id
  const { data: client, error: fetchError } = await (db as any)
    .from('clients')
    .select('profile_id')
    .eq('id', clientId)
    .maybeSingle();

  if (fetchError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // ── Update profile ──────────────────────────────────────────────────────

  const profileUpdates: Record<string, unknown> = {};
  if (full_name !== undefined) profileUpdates.full_name = full_name;
  if (company_name !== undefined) profileUpdates.company_name = company_name;
  if (phone !== undefined) profileUpdates.phone = phone;
  if (gstin !== undefined) profileUpdates.gstin = typeof gstin === 'string' ? gstin.toUpperCase() : gstin;
  if (state !== undefined) profileUpdates.state = state;

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await (db as any)
      .from('profiles')
      .update(profileUpdates)
      .eq('id', client.profile_id);
    if (error) return NextResponse.json({ error: `Profile update failed: ${error.message}` }, { status: 500 });
  }

  // ── Update client record ───────────────────────────────────────────────

  const clientUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (category !== undefined) clientUpdates.category = category;
  if (status !== undefined) clientUpdates.status = status;
  if (waste_categories !== undefined) clientUpdates.waste_categories = waste_categories;
  if (assigned_manager_id !== undefined) clientUpdates.assigned_manager_id = assigned_manager_id || null;
  if (notes !== undefined) clientUpdates.notes = notes;
  if (renewal_date !== undefined) clientUpdates.renewal_date = renewal_date || null;
  if (onboarded_date !== undefined) clientUpdates.onboarded_date = onboarded_date || null;
  if (ltv_inr !== undefined) clientUpdates.ltv_inr = ltv_inr;
  if (intel_company_id !== undefined) clientUpdates.intel_company_id = intel_company_id || null;

  if (Object.keys(clientUpdates).length > 1) { // >1 because updated_at always present
    const { error } = await (db as any)
      .from('clients')
      .update(clientUpdates)
      .eq('id', clientId);
    if (error) return NextResponse.json({ error: `Client update failed: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ─── DELETE (soft archive) ────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Only full admins can archive — managers cannot
  if (!actor.isSuperAdminUser && actor.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required to archive clients' }, { status: 403 });
  }

  const { clientId } = await params;
  const db = makeServiceClient();

  const { error } = await (db as any)
    .from('clients')
    .update({ status: 'Churned', updated_at: new Date().toISOString() })
    .eq('id', clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, archived: true });
}
