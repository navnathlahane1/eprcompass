/**
 * POST /api/feature-requests — any authenticated portal user submits a feature
 * request or bug report via right-click capture (see FeatureRequestCapture.tsx).
 * GET  /api/feature-requests — staff/admin only, lists all submissions.
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

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const description = String(b.description || '').trim();
  if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

  const db = adminClient();
  const { error } = await (db as any).from('portal_feature_requests').insert({
    user_id: user.id,
    user_name: user.fullName || user.email || null,
    user_role: user.role || null,
    portal: String(b.portal || 'Unknown Portal').slice(0, 120),
    page_path: String(b.page_path || '').slice(0, 500),
    description: description.slice(0, 2000),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('portal_feature_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}
