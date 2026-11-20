/**
 * GET  /api/manager/clients/[clientId]/contacts  — list contacts
 * POST /api/manager/clients/[clientId]/contacts  — add contact
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';
import { syncContactToIntel } from '@/lib/manager/syncContactToIntel';

export const dynamic = 'force-dynamic';

function makeServiceClient() { return getAdminClient(); }

async function clientBelongsToManager(db: any, clientId: string, managerId: string, role: string) {
  if (['admin', 'super_admin', 'task_manager'].includes(role)) return true;
  const { data } = await db.from('clients')
    .select('id').eq('id', clientId).eq('assigned_manager_id', managerId).single();
  return !!data;
}

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await params;
  const db = makeServiceClient();

  if (!await clientBelongsToManager(db, clientId, actor.id, actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await (db as any)
    .from('client_contacts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate short-lived signed URLs for photos
  const contacts = await Promise.all((data ?? []).map(async (c: any) => {
    if (!c.photo_url || c.photo_url.startsWith('http')) return c;
    const { data: signed } = await (db as any).storage
      .from('client-contact-photos')
      .createSignedUrl(c.photo_url, 3600); // 1 hour
    return { ...c, photo_signed_url: signed?.signedUrl ?? null };
  }));

  return NextResponse.json({ contacts });
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await params;
  const db = makeServiceClient();

  if (!await clientBelongsToManager(db, clientId, actor.id, actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    person_name, designation, department, seniority_level,
    email, phone, linkedin_url, photo_url, notes,
  } = body;

  if (!person_name?.trim()) {
    return NextResponse.json({ error: 'person_name is required' }, { status: 400 });
  }

  const { data, error } = await (db as any)
    .from('client_contacts')
    .insert({
      client_id: clientId,
      person_name: person_name.trim(),
      designation:     designation     || null,
      department:      department      || null,
      seniority_level: seniority_level || null,
      email:           email           || null,
      phone:           phone           || null,
      linkedin_url:    linkedin_url    || null,
      photo_url:       photo_url       || null,
      notes:           notes           || null,
      created_by:      actor.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync to intel panel (best-effort, non-blocking to the response)
  const syncResult = await syncContactToIntel({
    db,
    contact: { ...data, intel_person_id: null },
    clientId,
  });

  return NextResponse.json({
    contact: { ...data, intel_person_id: syncResult.intel_person_id },
    intel_synced: syncResult.synced,
  }, { status: 201 });
}
