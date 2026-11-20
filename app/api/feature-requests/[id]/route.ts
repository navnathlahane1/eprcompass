/**
 * PATCH /api/feature-requests/[id] — staff/admin updates status or notes on a
 * submitted feature request / bug report.
 */
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

const STAFF_ROLES = ['admin', 'super_admin', 'manager'];
const VALID_STATUS = ['NEW', 'TRIAGED', 'IN_PROGRESS', 'DONE', 'DECLINED'];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthenticatedUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const update: Record<string, any> = {};
  if (b.status && VALID_STATUS.includes(b.status)) update.status = b.status;
  if ('staff_notes' in b) update.staff_notes = String(b.staff_notes ?? '').slice(0, 2000) || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const db = adminClient();
  const { error } = await (db as any).from('portal_feature_requests').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
