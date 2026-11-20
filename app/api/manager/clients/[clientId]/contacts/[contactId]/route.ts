/**
 * PATCH  /api/manager/clients/[clientId]/contacts/[contactId]  — update contact
 * DELETE /api/manager/clients/[clientId]/contacts/[contactId]  — delete contact
 *
 * Both operations sync the change to intel_company_associated_people.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';
import { syncContactToIntel, deleteContactFromIntel } from '@/lib/manager/syncContactToIntel';

export const dynamic = 'force-dynamic';

function makeServiceClient() { return getAdminClient(); }

// ── PATCH ──────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; contactId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId, contactId } = await params;
  const db = makeServiceClient();

  // Fetch existing (need intel_person_id for sync)
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

  // Sync updated contact to intel panel (handles is_active=false by removing intel row)
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
  { params }: { params: Promise<{ clientId: string; contactId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId, contactId } = await params;
  const db = makeServiceClient();

  const { data: existing } = await (db as any)
    .from('client_contacts')
    .select('id, photo_url, intel_person_id')
    .eq('id', contactId)
    .eq('client_id', clientId)
    .single();
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  // Remove photo from storage
  if (existing.photo_url && !existing.photo_url.startsWith('http')) {
    await (db as any).storage.from('client-contact-photos').remove([existing.photo_url]);
  }

  // Remove from intel panel first (before deleting local row)
  if (existing.intel_person_id) {
    await deleteContactFromIntel({ db, intelPersonId: existing.intel_person_id });
  }

  const { error } = await (db as any)
    .from('client_contacts')
    .delete()
    .eq('id', contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
