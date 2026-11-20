/**
 * GET    /api/shared-documents/[id]/download  — signed download URL
 * POST   /api/shared-documents/[id]/access    — add grantee email
 * DELETE /api/shared-documents/[id]/access    — remove grantee email
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const BUCKET = 'shared-docs';

function adminDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function getActor() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdmin = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return { userId: user.id, email: user.email || '', isAdmin };
}

async function hasAccess(db: ReturnType<typeof adminDb>, docId: string, actor: { userId: string; email: string; isAdmin: boolean }) {
  if (actor.isAdmin) return true;
  const { data: doc } = await (db as any)
    .from('shared_documents').select('owner_id').eq('id', docId).maybeSingle();
  if (!doc) return false;
  if (doc.owner_id === actor.userId) return true;
  const { data: access } = await (db as any)
    .from('shared_document_access')
    .select('id')
    .eq('document_id', docId)
    .or(`grantee_email.eq.${actor.email},grantee_id.eq.${actor.userId}`)
    .maybeSingle();
  return !!access;
}

// ─── GET: signed download URL ─────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminDb();

  if (!(await hasAccess(db, id, actor))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: doc } = await (db as any)
    .from('shared_documents').select('file_path, file_name').eq('id', id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: signed, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path, 300, {
      download: doc.file_name,
    });

  if (error || !signed) {
    return NextResponse.json({ error: error?.message || 'Failed to generate download URL' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}

// ─── POST: grant access to an email ──────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminDb();

  const { data: doc } = await (db as any)
    .from('shared_documents').select('owner_id').eq('id', id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!actor.isAdmin && doc.owner_id !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  if (email === actor.email) {
    return NextResponse.json({ error: 'Cannot grant access to yourself' }, { status: 400 });
  }

  // `profiles` has no email column in this project. Keep access keyed by email.
  const profile = null;

  const { error } = await (db as any)
    .from('shared_document_access')
    .upsert({ document_id: id, grantee_email: email, grantee_id: profile?.id || null }, { onConflict: 'document_id,grantee_email' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, email, resolved: false });
}

// ─── DELETE: revoke access from an email ─────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminDb();

  const { data: doc } = await (db as any)
    .from('shared_documents').select('owner_id').eq('id', id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!actor.isAdmin && doc.owner_id !== actor.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

  await (db as any)
    .from('shared_document_access')
    .delete()
    .eq('document_id', id)
    .eq('grantee_email', email);

  return NextResponse.json({ ok: true });
}
