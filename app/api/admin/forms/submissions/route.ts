import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

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

export async function GET(request: Request) {
  try {
    const authorized = await isAuthorizedAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleKey = String(searchParams.get('module_key') || '').trim();
    const search = String(searchParams.get('search') || '').trim();

    const admin = createAdminSupabase();
    let query = (admin as any)
      .from('form_submissions')
      .select('id, module_key, source, status, name, email, phone, submission_data, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (moduleKey && moduleKey !== 'all') {
      query = query.eq('module_key', moduleKey);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = Array.isArray(data) ? data : [];
    if (!search) {
      return NextResponse.json({ rows });
    }

    const q = search.toLowerCase();
    const filtered = rows.filter((row: any) => {
      const haystack = [
        row?.name,
        row?.email,
        row?.phone,
        row?.module_key,
        row?.submission_data?.source_url,
        row?.submission_data?.sourceUrl
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return haystack.includes(q);
    });

    return NextResponse.json({ rows: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch submissions.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorized = await isAuthorizedAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { id?: string; status?: string };
    const id = String(body?.id || '').trim();
    const status = String(body?.status || '').trim();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required.' }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const { error } = await (admin as any).from('form_submissions').update({ status }).eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update submission.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await isAuthorizedAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { id?: string };
    const id = String(body?.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const { error } = await (admin as any).from('form_submissions').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete submission.' }, { status: 500 });
  }
}
