/**
 * GET    /api/shared-documents        — list own + shared documents
 * POST   /api/shared-documents        — save metadata after upload
 * DELETE /api/shared-documents        — delete own document
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const BUCKET = 'shared-docs';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

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

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminDb();

  // Admin: all documents; others: own + shared-with-me
  let ownQuery = (db as any)
    .from('shared_documents')
    .select('id, owner_id, doc_type, file_name, file_size, mime_type, note, created_at')
    .order('created_at', { ascending: false });

  if (!actor.isAdmin) {
    ownQuery = ownQuery.eq('owner_id', actor.userId);
  }

  const { data: ownDocs } = await ownQuery;

  // Shared-with-me: find all document_ids where grantee_email = my email OR grantee_id = my id
  const { data: accessRows } = await (db as any)
    .from('shared_document_access')
    .select('document_id')
    .or(`grantee_email.eq.${actor.email},grantee_id.eq.${actor.userId}`);

  const sharedIds: string[] = (accessRows || []).map((r: any) => r.document_id);

  let sharedDocs: any[] = [];
  if (sharedIds.length > 0) {
    const { data } = await (db as any)
      .from('shared_documents')
      .select('id, owner_id, doc_type, file_name, file_size, mime_type, note, created_at')
      .in('id', sharedIds)
      .neq('owner_id', actor.userId); // exclude own (already in ownDocs)
    sharedDocs = data || [];
  }

  // Fetch access lists for all own docs
  const ownIds: string[] = (ownDocs || []).map((d: any) => d.id);
  let accessMap: Record<string, string[]> = {};
  if (ownIds.length > 0) {
    const { data: allAccess } = await (db as any)
      .from('shared_document_access')
      .select('document_id, grantee_email')
      .in('document_id', ownIds);
    for (const a of allAccess || []) {
      if (!accessMap[a.document_id]) accessMap[a.document_id] = [];
      accessMap[a.document_id].push(a.grantee_email);
    }
  }

  // Attach owner names to shared docs
  const ownerIds: string[] = Array.from(new Set([...sharedDocs.map((d: any) => d.owner_id)]));
  let ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await (db as any)
      .from('profiles')
      .select('id, full_name, company_name, email')
      .in('id', ownerIds);
    for (const p of profiles || []) {
      ownerNames[p.id] = p.company_name || p.full_name || p.email || p.id;
    }
  }

  const own = (ownDocs || []).map((d: any) => ({
    ...d,
    is_owner: true,
    shared_with: accessMap[d.id] || [],
    owner_name: null,
  }));

  const shared = sharedDocs.map((d: any) => ({
    ...d,
    is_owner: false,
    shared_with: [],
    owner_name: ownerNames[d.owner_id] || d.owner_id,
  }));

  return NextResponse.json({ documents: [...own, ...shared] });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { doc_type, file_name, file_path, file_size, mime_type, note, share_emails } = body;

  if (!doc_type || !file_name || !file_path) {
    return NextResponse.json({ error: 'doc_type, file_name, and file_path are required' }, { status: 400 });
  }
  if (file_size && file_size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 20 MB limit' }, { status: 400 });
  }

  const db = adminDb();

  const { data: doc, error } = await (db as any)
    .from('shared_documents')
    .insert({
      owner_id: actor.userId,
      doc_type,
      file_name,
      file_path,
      file_size: file_size || null,
      mime_type: mime_type || null,
      note: note?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add initial access grants
  const emails: string[] = (share_emails || [])
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e && e !== actor.email);

  if (emails.length > 0) {
    // Resolve profile IDs for known users
    const { data: profiles } = await (db as any)
      .from('profiles')
      .select('id, email')
      .in('email', emails);

    const profileMap: Record<string, string> = {};
    for (const p of profiles || []) {
      if (p.email) profileMap[p.email.toLowerCase()] = p.id;
    }

    const accessRows = emails.map((email: string) => ({
      document_id: doc.id,
      grantee_email: email,
      grantee_id: profileMap[email] || null,
    }));

    await (db as any).from('shared_document_access').insert(accessRows);
  }

  return NextResponse.json({ document: doc }, { status: 201 });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = adminDb();

  const { data: doc } = await (db as any)
    .from('shared_documents')
    .select('id, owner_id, file_path')
    .eq('id', id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (!actor.isAdmin && doc.owner_id !== actor.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Remove from storage
  await db.storage.from(BUCKET).remove([doc.file_path]);

  // Delete record (cascades to shared_document_access)
  await (db as any).from('shared_documents').delete().eq('id', id);

  return NextResponse.json({ ok: true });
}
