/**
 * GET  /api/portal/client-contacts  — list team contacts for the logged-in client
 * POST /api/portal/client-contacts  — add a new team contact
 *
 * Auth: client portal user (role = 'client') identified via resolveActor().
 * The client record is derived from clients.profile_id = actor.userId.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { syncContactToIntel } from '@/lib/manager/syncContactToIntel';

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

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const clientId = await resolveClientId(db, actor.userId);
  if (!clientId) return NextResponse.json({ contacts: [] });

  const { data, error } = await (db as any)
    .from('client_contacts')
    .select('*')
    .eq('client_id', clientId)
    .order('is_active', { ascending: false })   // active first
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate signed URLs for photos
  const contacts = await Promise.all((data ?? []).map(async (c: any) => {
    if (!c.photo_url || c.photo_url.startsWith('http')) return c;
    const { data: signed } = await (db as any).storage
      .from('client-contact-photos')
      .createSignedUrl(c.photo_url, 3600);
    return { ...c, photo_signed_url: signed?.signedUrl ?? null };
  }));

  return NextResponse.json({ contacts });
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const clientId = await resolveClientId(db, actor.userId);
  if (!clientId) return NextResponse.json({ error: 'No client record found for this account' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { person_name, designation, department, seniority_level, email, phone, linkedin_url, photo_url, notes } = body;

  if (!person_name?.trim()) {
    return NextResponse.json({ error: 'person_name is required' }, { status: 400 });
  }

  const { data, error } = await (db as any)
    .from('client_contacts')
    .insert({
      client_id:       clientId,
      person_name:     person_name.trim(),
      designation:     designation     || null,
      department:      department      || null,
      seniority_level: seniority_level || null,
      email:           email           || null,
      phone:           phone           || null,
      linkedin_url:    linkedin_url    || null,
      photo_url:       photo_url       || null,
      notes:           notes           || null,
      created_by:      actor.userId,
      is_active:       true,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to intel panel (best-effort)
  const syncResult = await syncContactToIntel({ db, contact: { ...data, intel_person_id: null }, clientId });

  return NextResponse.json(
    { contact: { ...data, intel_person_id: syncResult.intel_person_id }, intel_synced: syncResult.synced },
    { status: 201 }
  );
}
