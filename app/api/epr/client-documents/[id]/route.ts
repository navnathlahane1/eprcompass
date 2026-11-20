/**
 * PATCH /api/epr/client-documents/[id]  – Admin: update status / comment
 * DELETE /api/epr/client-documents/[id] – Client: delete own document (or admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { completeTasksForEntity } from '@/lib/tasks/createTask';

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

// ─── PATCH (admin review) ─────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActor();
    if (!actor?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { status, admin_comment, rejection_reason } = body;

    const VALID_DOC_STATUSES = ['Received', 'Reviewed', 'Approved', 'Rejected'];
    if (status && !VALID_DOC_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid document status' }, { status: 400 });
    }

    // Rejection must include a reason
    if (status === 'Rejected' && !rejection_reason?.trim()) {
      return NextResponse.json({ error: 'rejection_reason is required when rejecting' }, { status: 400 });
    }

    const patch: Record<string, unknown> = {
      reviewed_by: actor.userId,
      reviewed_at: new Date().toISOString(),
    };
    if (status)            patch.status = status;
    if (admin_comment)     patch.admin_comment = String(admin_comment).trim().slice(0, 1000);
    if (rejection_reason)  patch.rejection_reason = String(rejection_reason).trim().slice(0, 1000);

    const db = adminClient();
    const { data: doc, error } = await (db as any)
      .from('epr_client_documents')
      .update(patch)
      .eq('id', id)
      .select('id, client_id, category, doc_type')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Activity log
    await (db as any).from('epr_activity_log').insert({
      action: `document_${(status || 'reviewed').toLowerCase().replace(' ', '_')}`,
      entity_type: 'document',
      entity_id: id,
      actor_id: actor.userId,
      client_id: doc.client_id,
      new_values: { status, admin_comment, rejection_reason },
    });

    // ── Auto-complete the document review task ────────────────────────────────
    await completeTasksForEntity({
      related_entity_id: id,
      related_entity_type: 'document',
      completed_by: actor.userId,
      resolution_note: status ? `Document ${status.toLowerCase()}` : 'Document reviewed',
    });

    // Notify client
    if (status === 'Approved' || status === 'Rejected') {
      await (db as any).from('epr_notification_queue').insert({
        type: `document_${status.toLowerCase()}`,
        channel: 'in_app',
        recipient_id: doc.client_id,
        payload: { document_id: id, category: doc.category, doc_type: doc.doc_type, status },
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
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = adminClient();

    // Fetch to confirm ownership
    const { data: doc } = await (db as any)
      .from('epr_client_documents')
      .select('client_id, status')
      .eq('id', id)
      .maybeSingle();

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!actor.isAdmin && doc.client_id !== actor.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clients cannot delete approved documents
    if (!actor.isAdmin && doc.status === 'Approved') {
      return NextResponse.json({ error: 'Approved documents cannot be deleted' }, { status: 409 });
    }

    await (db as any).from('epr_client_documents').delete().eq('id', id);
    await (db as any).from('epr_activity_log').insert({
      action: 'document_deleted',
      entity_type: 'document',
      entity_id: id,
      actor_id: actor.userId,
      client_id: doc.client_id,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
