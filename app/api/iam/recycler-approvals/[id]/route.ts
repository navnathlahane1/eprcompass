/**
 * GET  /api/iam/recycler-approvals/[id]  — fetch single recycler detail + docs
 * PATCH /api/iam/recycler-approvals/[id] — update verification_status or a document status
 *   Body options:
 *     { action: 'approve' }                              → set verification_status = VERIFIED
 *     { action: 'suspend' }                              → set verification_status = SUSPENDED
 *     { action: 'reject' }                               → set verification_status = PENDING (send back)
 *     { action: 'update_doc', docId, status }            → update a single document's status
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';

const ALLOWED_ROLES = ['user_manager', 'admin', 'manager'];

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const db = adminDb();

  const [{ data: recycler, error }, { data: documents }] = await Promise.all([
    (db as any)
      .from('recyclers')
      .select(
        'id, name, recycler_code, verification_status, verified_at, verified_by, ' +
        'contact_email, contact_phone, contact_address, state, ' +
        'epr_categories, authorized_states, capacity, certifications, intel_company_id, ' +
        'onboarded_at, user_id, assigned_compliance_officer, assigned_trainer, assigned_compliance_manager'
      )
      .eq('id', id)
      .maybeSingle(),
    (db as any)
      .from('recycler_documents')
      .select('id, doc_type, file_name, file_path, status, expiry_date, uploaded_at')
      .eq('recycler_id', id)
      .order('uploaded_at', { ascending: false }),
  ]);

  if (error || !recycler) {
    return NextResponse.json({ error: 'Recycler not found' }, { status: 404 });
  }

  // Resolve the linked Intel company's display name, if any — recyclers only
  // stores the FK, the name lives on intel_companies.
  let intelCompany = null;
  if (recycler.intel_company_id) {
    const { data: ic } = await (db as any)
      .from('intel_companies')
      .select('id, canonical_name, gstin')
      .eq('id', recycler.intel_company_id)
      .maybeSingle();
    intelCompany = ic ?? null;
  }

  return NextResponse.json({ recycler: { ...recycler, intel_company: intelCompany }, documents: documents ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const db = adminDb();

  if (body.action === 'link_intel_company') {
    const intelCompanyId = body.intelCompanyId ?? null;
    const { error } = await (db as any)
      .from('recyclers')
      .update({ intel_company_id: intelCompanyId })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'assign_compliance_officer') {
    const profileId = body.profileId ?? null;
    const { error } = await (db as any)
      .from('recyclers')
      .update({ assigned_compliance_officer: profileId })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'assign_trainer') {
    const profileId = body.profileId ?? null;
    const { error } = await (db as any)
      .from('recyclers')
      .update({ assigned_trainer: profileId })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'assign_compliance_manager') {
    const profileId = body.profileId ?? null;
    const { error } = await (db as any)
      .from('recyclers')
      .update({ assigned_compliance_manager: profileId })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'update_doc') {
    const validDocStatuses = ['Pending', 'Verified', 'Rejected', 'Expired'];
    if (!body.docId || !validDocStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid doc update payload' }, { status: 400 });
    }
    const { error } = await (db as any)
      .from('recycler_documents')
      .update({ status: body.status })
      .eq('id', body.docId)
      .eq('recycler_id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const STATUS_MAP: Record<string, string> = {
    approve:  'VERIFIED',
    suspend:  'SUSPENDED',
    reject:   'PENDING',
  };

  const newStatus = STATUS_MAP[body.action];
  if (!newStatus) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const update: Record<string, any> = { verification_status: newStatus };
  if (body.action === 'approve') {
    update.verified_at = new Date().toISOString();
    update.verified_by = user.id;
  }

  const { error } = await (db as any)
    .from('recyclers')
    .update(update)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, verification_status: newStatus });
}
