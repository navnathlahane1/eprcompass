import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user || !['legal', 'compliance_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = adminClient();
  const { id } = await params;

  const { data: recycler, error: recyclerErr } = await (db as any)
    .from('recyclers')
    .select('id, name, company_name, recycler_code, verification_status, state, contact_email, epr_categories')
    .eq('id', id)
    .maybeSingle();

  if (recyclerErr || !recycler) {
    return NextResponse.json({ error: 'Recycler not found' }, { status: 404 });
  }

  const { data: docs } = await (db as any)
    .from('recycler_documents')
    .select('id, doc_type, file_path, status, expiry_date, uploaded_at, legal_verified_by, legal_verified_at, legal_notes')
    .eq('recycler_id', id)
    .order('uploaded_at', { ascending: false });

  const verifierIds = [...new Set((docs ?? []).map((d: any) => d.legal_verified_by).filter(Boolean))];
  const verifierMap: Record<string, string> = {};
  if (verifierIds.length > 0) {
    const { data: profiles } = await (db as any)
      .from('profiles')
      .select('id, full_name')
      .in('id', verifierIds);
    for (const p of profiles ?? []) {
      verifierMap[p.id] = p.full_name;
    }
  }

  const documents = await Promise.all((docs ?? []).map(async (d: any) => {
    let viewUrl = d.file_path;
    if (d.file_path) {
      const { data: signed } = await (db as any).storage
        .from('recycler-docs')
        .createSignedUrl(d.file_path, 300);
      if (signed?.signedUrl) viewUrl = signed.signedUrl;
    }
    return {
      ...d,
      file_path: viewUrl,
      verifier_name: d.legal_verified_by ? (verifierMap[d.legal_verified_by] ?? null) : null,
    };
  }));

  return NextResponse.json({ recycler: { ...recycler, documents } });
}

const VALID_STATUSES = new Set(['Verified', 'Rejected', 'Pending']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user || !['legal', 'compliance_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, docId, status, notes } = body;

  if (action !== 'update_doc') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  if (!docId || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid docId or status' }, { status: 400 });
  }

  const { id } = await params;
  const db = adminClient();

  let patch: Record<string, unknown> = { status };

  if (status === 'Verified' || status === 'Rejected') {
    patch.legal_verified_by = user.id;
    patch.legal_verified_at = new Date().toISOString();
    patch.legal_notes = notes ?? null;
  } else {
    patch.legal_verified_by = null;
    patch.legal_verified_at = null;
    patch.legal_notes = null;
  }

  const { error } = await (db as any)
    .from('recycler_documents')
    .update(patch)
    .eq('id', docId)
    .eq('recycler_id', id);

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
