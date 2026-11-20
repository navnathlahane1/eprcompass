/**
 * GET /api/iam/recycler-approvals
 * Lists recyclers pending verification, with their uploaded documents.
 * Only accessible to user_manager / admin / manager roles.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

const ALLOWED_ROLES = ['user_manager', 'admin', 'manager'];

async function getReadClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServerComponentClient();
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') ?? 'PENDING';

  const db = await getReadClient();

  const { data: recyclers, error } = await (db as any)
    .from('recyclers')
    .select(
      'id, name, recycler_code, verification_status, verified_at, ' +
      'contact_email, state, epr_categories, onboarded_at, user_id'
    )
    .eq('verification_status', statusFilter)
    .order('onboarded_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch documents for all returned recyclers in one query
  const recyclerIds: string[] = (recyclers ?? []).map((r: any) => r.id);

  const { data: documents } = recyclerIds.length
    ? await (db as any)
        .from('recycler_documents')
        .select('id, recycler_id, doc_type, file_path, status, expiry_date, uploaded_at')
        .in('recycler_id', recyclerIds)
    : { data: [] };

  // Group documents by recycler_id
  const docsByRecycler: Record<string, any[]> = {};
  for (const doc of documents ?? []) {
    if (!docsByRecycler[doc.recycler_id]) docsByRecycler[doc.recycler_id] = [];
    docsByRecycler[doc.recycler_id].push(doc);
  }

  const result = (recyclers ?? []).map((r: any) => ({
    ...r,
    documents: docsByRecycler[r.id] ?? [],
  }));

  return NextResponse.json({ recyclers: result, total: result.length });
}
