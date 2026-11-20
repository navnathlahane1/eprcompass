/**
 * GET  /api/epr/client-documents     – list (admin: all, client: own)
 * POST /api/epr/client-documents     – client uploads a new document (metadata + file path)
 *
 * File upload flow:
 *   1. Client calls POST /api/epr/client-documents/upload-url to get a signed PUT URL
 *   2. Client PUTs the file directly to Supabase Storage
 *   3. Client calls POST /api/epr/client-documents with { file_path, ...metadata }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { createTask, getAssignedManagerForClientProfile } from '@/lib/tasks/createTask';

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function adminClient() {
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
  const isAdminUser = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return { userId: user.id, isAdmin: isAdminUser };
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const userClient = await createServerComponentClient();

    if (!actor.isAdmin) {
      let userQuery = (userClient as any)
        .from('epr_client_documents')
        .select(`
          id, client_id, category, fy_id, doc_type, document_name, file_name,
          file_size, mime_type, current_version, upload_date, status, admin_comment,
          rejection_reason, note,
          epr_financial_years ( label )
        `)
        .eq('client_id', actor.userId)
        .order('upload_date', { ascending: false });

      if (sp.get('category')) userQuery = userQuery.eq('category', sp.get('category'));
      if (sp.get('fy_id'))    userQuery = userQuery.eq('fy_id', sp.get('fy_id'));
      if (sp.get('doc_type')) userQuery = userQuery.eq('doc_type', sp.get('doc_type'));
      if (sp.get('status'))   userQuery = userQuery.eq('status', sp.get('status'));
      if (sp.get('search'))   userQuery = userQuery.ilike('document_name', `%${sp.get('search')}%`);

      const { data: userData, error: userError } = await userQuery;
      if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
      return NextResponse.json({ documents: userData ?? [] });
    }

    const db = adminClient();

    let query = (db as any)
      .from('epr_client_documents')
      .select(`
        id, client_id, category, fy_id, doc_type, document_name, file_name,
        file_size, mime_type, current_version, upload_date, status, admin_comment,
        rejection_reason, note,
        epr_financial_years ( label ),
        profiles ( full_name, company_name )
      `)
      .order('upload_date', { ascending: false });

    if (sp.get('client_id')) query = query.eq('client_id', sp.get('client_id'));
    if (sp.get('category')) query = query.eq('category', sp.get('category'));
    if (sp.get('fy_id'))    query = query.eq('fy_id', sp.get('fy_id'));
    if (sp.get('doc_type')) query = query.eq('doc_type', sp.get('doc_type'));
    if (sp.get('status'))   query = query.eq('status', sp.get('status'));
    if (sp.get('search'))   query = query.ilike('document_name', `%${sp.get('search')}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ documents: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      category, fy_id, doc_type, document_name,
      file_path, file_name, file_size, mime_type, note,
      change_reason, // for re-uploads (versioning)
    } = body;

    // Only clients can self-upload; admins use the audit document endpoint
    const effectiveClientId = actor.isAdmin ? body.client_id : actor.userId;

    if (!effectiveClientId || !category || !fy_id || !doc_type || !document_name?.trim() || !file_path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate mime type
    if (mime_type && !ALLOWED_MIME.includes(mime_type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, JPEG, or PNG.' }, { status: 400 });
    }

    // Validate file size (client-supplied, checked again to guard against manipulation)
    if (file_size && file_size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit.' }, { status: 400 });
    }

    const db = adminClient();

    // Check if document already exists for this client/category/fy/doc_type combo
    const { data: existing } = await (db as any)
      .from('epr_client_documents')
      .select('id, current_version')
      .eq('client_id', effectiveClientId)
      .eq('category', category)
      .eq('fy_id', fy_id)
      .eq('doc_type', doc_type)
      .maybeSingle();

    let docId: string;
    let newVersion: number;

    if (existing) {
      // Re-upload: increment version
      newVersion = (existing.current_version ?? 1) + 1;
      docId = existing.id;

      await (db as any)
        .from('epr_client_documents')
        .update({
          document_name: document_name.trim(),
          file_path,
          file_name,
          file_size,
          mime_type,
          current_version: newVersion,
          upload_date: new Date().toISOString(),
          status: 'Received',
          admin_comment: null,
          rejection_reason: null,
        })
        .eq('id', docId);
    } else {
      // First upload
      newVersion = 1;
      const { data: inserted, error: insertErr } = await (db as any)
        .from('epr_client_documents')
        .insert({
          client_id: effectiveClientId,
          category,
          fy_id,
          doc_type,
          document_name: document_name.trim(),
          file_path,
          file_name,
          file_size,
          mime_type,
          note: note?.trim() || null,
          current_version: 1,
        })
        .select()
        .single();

      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      docId = inserted.id;
    }

    // Append version record
    await (db as any).from('epr_document_versions').insert({
      document_id: docId,
      version: newVersion,
      file_path,
      file_name,
      file_size,
      mime_type,
      uploaded_by: actor.userId,
      change_reason: change_reason?.trim() || null,
    });

    // Activity log
    await (db as any).from('epr_activity_log').insert({
      action: existing ? 'document_reuploaded' : 'document_uploaded',
      entity_type: 'document',
      entity_id: docId,
      actor_id: actor.userId,
      client_id: effectiveClientId,
      new_values: { version: newVersion, doc_type, category, fy_id },
    });

    // ── Auto-task: notify assigned manager to review the uploaded document ──
    // Only create tasks for client self-uploads (not admin uploads on behalf).
    if (!actor.isAdmin) {
      const { managerId, clientRowId } = await getAssignedManagerForClientProfile(actor.userId);
      if (managerId) {
        const isRereview = !!existing;
        await createTask({
          title: isRereview
            ? `Re-review document: ${document_name.trim()} (v${newVersion})`
            : `Review uploaded document: ${document_name.trim()}`,
          description: `Client uploaded ${doc_type} for ${category} · FY linked. Please review and update document status.`,
          task_type: isRereview ? 'document_rereview' : 'document_review',
          assigned_to: managerId,
          client_id: clientRowId,
          related_entity_type: 'document',
          related_entity_id: docId,
          priority: isRereview ? 'high' : 'normal',
          created_by: actor.userId,
        });
      }
    }

    return NextResponse.json({ docId, version: newVersion }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
