/**
 * PATCH  /api/portal/client-contacts/[contactId]  — update team contact
 * DELETE /api/portal/client-contacts/[contactId]  — remove team contact
 *
 * Auth: client portal user. Only their own company's contacts are accessible.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { syncContactToIntel, deleteContactFromIntel } from '@/lib/manager/syncContactToIntel';

export const dynamic = 'force-dynamic';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function resolveClientId(db: any, profileId: string): Promise<string | null> {
  const { data } = await db
    .from('clients')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data?.id ?? null;
}

// ── PATCH ──────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const clientId = await resolveClientId(db, actor.userId);
  if (!clientId) return NextResponse.json({ error: 'No client record found' }, { status: 404 });

  const { contactId } = await params;

  // Fetch existing — verify it belongs to this client
  const { data: existing } = await (db as any)
    .from('client_contacts')
    .select('*')
    .eq('id', contactId)
    .eq('client_id', clientId)
    .single();
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const fields = ['person_name','designation','department','seniority_level','email','phone','linkedin_url','photo_url','notes'];
  for (const f of fields) {
    if (f in body) updates[f] = body[f] || null;
  }
  if ('person_name' in body && !body.person_name?.trim()) {
    return NextResponse.json({ error: 'person_name cannot be empty' }, { status: 400 });
  }
  // Departure tracking
  if ('is_active' in body) updates.is_active = !!body.is_active;
  if ('left_company_at' in body) updates.left_company_at = body.left_company_at || null;

  const { data, error } = await (db as any)
    .from('client_contacts')
    .update(updates)
    .eq('id', contactId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to intel (inactive contact → removes intel row)
  const syncResult = await syncContactToIntel({
    db,
    contact: { ...existing, ...data, is_active: data.is_active ?? existing.is_active ?? true },
    clientId,
  });

  return NextResponse.json({
    contact: { ...data, intel_person_id: syncResult.intel_person_id ?? existing.intel_person_id },
    intel_synced: syncResult.synced,
  });
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const clientId = await resolveClientId(db, actor.userId);
  if (!clientId) return NextResponse.json({ error: 'No client record found' }, { status: 404 });

  const { contactId } = await params;

  const { data: existing } = await (db as any)
    .from('client_contacts')
    .select('id, photo_url, intel_person_id, client_id')
    .eq('id', contactId)
    .eq('client_id', clientId)
    .single();
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  // Clean up photo from storage
  if (existing.photo_url && !existing.photo_url.startsWith('http')) {
    await (db as any).storage.from('client-contact-photos').remove([existing.photo_url]);
  }

  // Remove from intel panel
  if (existing.intel_person_id) {
    await deleteContactFromIntel({ db, intelPersonId: existing.intel_person_id });
  }

  const { error } = await (db as any).from('client_contacts').delete().eq('id', contactId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
