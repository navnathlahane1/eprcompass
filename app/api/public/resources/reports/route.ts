import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 300;

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

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    const { data: reports, error } = await (admin as any)
      .from('download_reports')
      .select('id, title, slug, description, category, file_name, file_size_bytes, created_at')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: eventRows, error: eventError } = await (admin as any)
      .from('download_report_events')
      .select('report_id');

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    const counts = new Map<string, number>();
    for (const row of eventRows || []) {
      const key = String(row.report_id || '');
      if (!key) continue;
      counts.set(key, Number((counts.get(key) || 0) + 1));
    }

    const payload = (reports || []).map((report: any) => ({
      ...report,
      download_count: Number(counts.get(String(report.id)) || 0)
    }));

    return NextResponse.json({ reports: payload });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || 'Failed to load reports') }, { status: 500 });
  }
}
