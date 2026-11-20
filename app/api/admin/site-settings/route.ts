import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const ALLOWED_KEYS = new Set([
  'checkout.earlybird_end',
]);

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function getAuthorizedAdminId() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const canManage = ['admin', 'manager'].includes(profile?.role || '') || isSuperAdmin(user.email);
  return canManage ? user.id : null;
}

export async function GET() {
  const adminId = await getAuthorizedAdminId();
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = adminClient();
  const { data, error } = await (admin as any)
    .from('site_settings')
    .select('key, value, updated_at')
    .in('key', Array.from(ALLOWED_KEYS));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function PUT(req: Request) {
  const adminId = await getAuthorizedAdminId();
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { key?: string; value?: unknown } | null;
  if (!body?.key || !ALLOWED_KEYS.has(body.key)) {
    return NextResponse.json({ error: 'Unknown key' }, { status: 400 });
  }
  if (body.value === undefined) {
    return NextResponse.json({ error: 'Missing value' }, { status: 400 });
  }

  const admin = adminClient();
  const { error } = await (admin as any)
    .from('site_settings')
    .upsert(
      { key: body.key, value: body.value, updated_at: new Date().toISOString(), updated_by: adminId },
      { onConflict: 'key' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
