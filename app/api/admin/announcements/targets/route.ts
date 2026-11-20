import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

async function isAuthorizedAdmin() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return ['admin', 'manager'].includes(profile?.role || '') || isSuperAdmin(user.email);
}

export async function GET() {
  try {
    const ok = await isAuthorizedAdmin();
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = adminClient();
    const { data, error } = await (admin as any)
      .from('profiles')
      .select('id, full_name, role, company_name')
      .order('full_name', { ascending: true })
      .limit(3000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []).map((row: any) => ({
      id: row.id,
      name: row.full_name || row.company_name || 'Unnamed',
      email: '',
      role: row.role || 'unknown'
    }));

    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch targets.' }, { status: 500 });
  }
}
