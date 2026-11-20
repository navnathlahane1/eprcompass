import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin as isConfiguredSuperAdmin } from '@/lib/admin/isSuperAdmin';

const REPORT_BUCKET = 'resource-reports';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function validateAdminManager() {
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

  const effectiveRole = profile?.role || (isConfiguredSuperAdmin(user.email) ? 'admin' : '');
  return ['admin', 'manager'].includes(effectiveRole);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ok = await validateAdminManager();
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = String(id || '');
    if (!reportId) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const payload = await request.json();
    const nextStatus = String(payload?.status || '').trim();

    if (!['Draft', 'Published'].includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await (admin as any)
      .from('download_reports')
      .update({ status: nextStatus })
      .eq('id', reportId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report: data });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || 'Failed to update report') }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ok = await validateAdminManager();
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = String(id || '');
    if (!reportId) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: row, error: rowError } = await (admin as any)
      .from('download_reports')
      .select('id, file_path')
      .eq('id', reportId)
      .maybeSingle();

    if (rowError) {
      return NextResponse.json({ error: rowError.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { error: deleteError } = await (admin as any)
      .from('download_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (row.file_path) {
      await admin.storage.from(REPORT_BUCKET).remove([String(row.file_path)]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || 'Failed to delete report') }, { status: 500 });
  }
}
