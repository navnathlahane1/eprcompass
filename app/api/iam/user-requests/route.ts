/**
 * GET /api/iam/user-requests
 * Lists academy user-creation requests for the IAM queue.
 *   ?status=pending|fulfilled|rejected|all   (default: all)
 *   ?countOnly=1                             → { count } for the sidebar badge
 *
 * Caller must be user_manager, admin, or manager.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const runtime = 'nodejs';

const IAM_ROLES = ['user_manager', 'admin', 'manager'];

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

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !IAM_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const countOnly = searchParams.get('countOnly') === '1';

  const db = await getReadClient();

  try {
    if (countOnly) {
      let q = db.from('academy_user_requests').select('id', { count: 'exact', head: true });
      q = status === 'all' ? q.eq('status', 'pending') : q.eq('status', status);
      const { count } = await q;
      return NextResponse.json({ count: count ?? 0 });
    }

    let q = db
      .from('academy_user_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (status !== 'all') q = q.eq('status', status);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ requests: data ?? [] });
  } catch {
    // Table may not exist yet (migration 154 pending) — degrade gracefully
    // so the IAM sidebar/badge keeps working.
    return countOnly
      ? NextResponse.json({ count: 0 })
      : NextResponse.json({ requests: [] });
  }
}
