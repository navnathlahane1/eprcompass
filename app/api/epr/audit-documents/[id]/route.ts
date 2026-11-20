/**
 * PATCH  /api/epr/audit-documents/[id]  – admin: edit metadata / toggle visibility
 * DELETE /api/epr/audit-documents/[id]  – admin: remove audit document
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const VALID_MARK_AS = ['Draft', 'Final', 'Certified Copy'];

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function getAdminActor() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const ok = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return ok ? user.id : null;
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await getAdminActor();
    if (!actorId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = {};
    if (body.title)        patch.title = String(body.title).trim();
    if (body.doc_type)     patch.doc_type = body.doc_type;
    if (body.mark_as) {
      if (!VALID_MARK_AS.includes(body.mark_as)) {
        return NextResponse.json({ error: 'Invalid mark_as' }, { status: 400 });
      }
      patch.mark_as = body.mark_as;
    }
    if (typeof body.visible_to_client === 'boolean') patch.visible_to_client = body.visible_to_client;
    if (body.client_note  !== undefined) patch.client_note   = String(body.client_note).trim() || null;
    if (body.internal_note !== undefined) patch.internal_note = String(body.internal_note).trim() || null;
    if (body.file_path)    patch.file_path  = body.file_path;
    if (body.file_name)    patch.file_name  = body.file_name;
    if (body.file_size)    patch.file_size  = body.file_size;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const db = adminClient();
    const { data, error } = await (db as any)
      .from('epr_audit_documents')
      .update(patch)
      .eq('id', id)
      .select('id, client_id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await (db as any).from('epr_activity_log').insert({
      action: 'audit_document_updated',
      entity_type: 'audit_document',
      entity_id: id,
      actor_id: actorId,
      client_id: data.client_id,
      new_values: patch,
    });

    // If made visible, queue a client notification
    if (patch.visible_to_client === true) {
      await (db as any).from('epr_notification_queue').insert({
        type: 'audit_document_available',
        channel: 'in_app',
        recipient_id: data.client_id,
        payload: { audit_document_id: id },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await getAdminActor();
    if (!actorId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: docId } = await params;
    const db = adminClient();
    const { data: doc } = await (db as any)
      .from('epr_audit_documents')
      .select('id, client_id, file_path')
      .eq('id', docId)
      .maybeSingle();

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Remove the storage object if present
    if (doc.file_path) {
      await db.storage.from('epr-documents').remove([doc.file_path]);
    }

    await (db as any).from('epr_audit_documents').delete().eq('id', docId);
    await (db as any).from('epr_activity_log').insert({
      action: 'audit_document_deleted',
      entity_type: 'audit_document',
      entity_id: docId,
      actor_id: actorId,
      client_id: doc.client_id,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
