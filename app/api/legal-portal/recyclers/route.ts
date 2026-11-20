import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !['legal', 'compliance_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = adminClient();

  const { data: recyclers, error } = await (db as any)
    .from('recyclers')
    .select('id, name, company_name, recycler_code, verification_status, state, contact_email, epr_categories')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load recyclers' }, { status: 500 });
  }

  const recyclerIds = (recyclers ?? []).map((r: any) => r.id);

  let docRows: { recycler_id: string; status: string }[] = [];
  if (recyclerIds.length > 0) {
    const { data } = await (db as any)
      .from('recycler_documents')
      .select('recycler_id, status')
      .in('recycler_id', recyclerIds);
    docRows = data ?? [];
  }

  const summaryMap: Record<string, { total: number; pending: number; verified: number; rejected: number }> = {};
  for (const row of docRows) {
    if (!summaryMap[row.recycler_id]) {
      summaryMap[row.recycler_id] = { total: 0, pending: 0, verified: 0, rejected: 0 };
    }
    summaryMap[row.recycler_id].total++;
    const s = row.status?.toLowerCase();
    if (s === 'pending') summaryMap[row.recycler_id].pending++;
    else if (s === 'verified') summaryMap[row.recycler_id].verified++;
    else if (s === 'rejected') summaryMap[row.recycler_id].rejected++;
  }

  const result = (recyclers ?? []).map((r: any) => ({
    ...r,
    doc_summary: summaryMap[r.id] ?? { total: 0, pending: 0, verified: 0, rejected: 0 },
  }));

  return NextResponse.json({ recyclers: result });
}
