/**
 * PATCH /api/notifications/admin/[id]   — update / approve / reject
 * DELETE /api/notifications/admin/[id]  — soft delete
 *
 * Auth: requires admin session (Supabase auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const dynamic = 'force-dynamic';

function getServiceSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function requireAdmin(): Promise<{ userId: string } | null> {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check admin role
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminRoles = ['admin', 'super_admin', 'owner'];
    if (!data || !adminRoles.includes(data.role)) return null;

    return { userId: user.id };
  } catch {
    return null;
  }
}

// ─── PATCH: update notification fields ───────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id?.match(/^[0-9a-f-]{36}$/i)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  // Whitelist of editable fields
  const ALLOWED_FIELDS = [
    'status', 'title', 'short_description', 'seo_title', 'seo_description',
    'seo_keywords', 'tags', 'is_featured', 'epr_type', 'document_type',
    'applicable_states', 'applicable_industries', 'compliance_deadline',
    'ai_summary', 'compliance_impact', 'action_points', 'affected_stakeholders',
    'key_compliance_points', 'faqs',
  ];

  const update: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Auto-set approved_at when activating
  if (update.status === 'active') {
    update.approved_by = admin.userId;
    update.approved_at = new Date().toISOString();
  }

  const sb = getServiceSb();

  const { data, error } = await sb
    .from('scraped_notifications')
    .update(update)
    .eq('id', id)
    .eq('is_deleted', false)
    .select('id, slug, status, title')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Not found' },    { status: 404 });

  // Write audit record
  const { error: auditError } = await sb.from('notification_audit_history').insert({
    notification_id: id,
    changed_by:      admin.userId,
    change_type:     update.status ? 'status_change' : 'updated',
    new_values:      update,
  });

  if (auditError) {
    console.warn('Failed to write notification audit record', auditError.message);
  }

  return NextResponse.json({ data });
}

// ─── DELETE: soft delete ──────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sb = getServiceSb();

  const { error } = await sb
    .from('scraped_notifications')
    .update({ is_deleted: true, status: 'archived' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: auditError } = await sb.from('notification_audit_history').insert({
    notification_id: id,
    changed_by:      admin.userId,
    change_type:     'updated',
    new_values:      { is_deleted: true, status: 'archived' },
  });

  if (auditError) {
    console.warn('Failed to write notification audit record', auditError.message);
  }

  return NextResponse.json({ ok: true });
}
