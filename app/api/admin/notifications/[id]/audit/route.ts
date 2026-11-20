/**
 * GET /api/admin/notifications/[id]/audit
 * Returns audit history for a specific notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { deny } = await requireAdminSession();
  if (deny) return deny;

  const { id } = await params;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await sb
    .from('notification_audit_history')
    .select('id, change_type, new_values, changed_at, changed_by')
    .eq('notification_id', id)
    .order('changed_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}
