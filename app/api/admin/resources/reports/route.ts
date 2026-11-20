import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin as isConfiguredSuperAdmin } from '@/lib/admin/isSuperAdmin';

export const runtime = 'nodejs';

const REPORT_BUCKET = 'resource-reports';
const MAX_PDF_BYTES = 15 * 1024 * 1024;

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

function slugify(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function safeFileName(input: string) {
  return String(input || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function validateAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, user: null };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const effectiveRole = profile?.role || (isConfiguredSuperAdmin(user.email) ? 'admin' : '');
  return { ok: ['admin', 'manager'].includes(effectiveRole), user };
}

async function ensureBucket(admin: any) {
  const { data: bucket } = await admin.storage.getBucket(REPORT_BUCKET);
  if (bucket) return;

  await admin.storage.createBucket(REPORT_BUCKET, {
    public: false,
    fileSizeLimit: String(MAX_PDF_BYTES),
    allowedMimeTypes: ['application/pdf']
  });
}

export async function GET() {
  try {
    const { ok } = await validateAdminManager();
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const { data: reports, error: reportsError } = await (admin as any)
      .from('download_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportsError) {
      return NextResponse.json({ error: reportsError.message }, { status: 500 });
    }

    const { data: countsRows, error: countsError } = await (admin as any)
      .from('download_report_events')
      .select('report_id');

    if (countsError) {
      return NextResponse.json({ error: countsError.message }, { status: 500 });
    }

    const { data: recentEvents, error: eventsError } = await (admin as any)
      .from('download_report_events')
      .select('id, report_id, full_name, email, phone, company, designation, purpose, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    const countMap = new Map<string, number>();
    for (const row of countsRows || []) {
      const key = String(row.report_id || '');
      if (!key) continue;
      countMap.set(key, Number((countMap.get(key) || 0) + 1));
    }

    const enriched = (reports || []).map((report: any) => ({
      ...report,
      download_count: Number(countMap.get(String(report.id)) || 0)
    }));

    return NextResponse.json({ reports: enriched, events: recentEvents || [] });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || 'Failed to load reports') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ok, user } = await validateAdminManager();
    if (!ok || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const category = String(formData.get('category') || 'General').trim();
    const description = String(formData.get('description') || '').trim();
    const status = String(formData.get('status') || 'Draft').trim();
    const file = formData.get('file') as File | null;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF must be under 15MB' }, { status: 400 });
    }

    const slug = slugify(title);
    if (!slug) {
      return NextResponse.json({ error: 'Please enter a valid title' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    await ensureBucket(admin);

    const existing = await (admin as any)
      .from('download_reports')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing.data?.id) {
      return NextResponse.json({ error: 'A report with this title already exists' }, { status: 400 });
    }

    const extensionSafeName = safeFileName(file.name || `${slug}.pdf`);
    const storagePath = `${slug}-${Date.now()}-${extensionSafeName}`;

    const { error: uploadError } = await admin.storage
      .from(REPORT_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: inserted, error: insertError } = await (admin as any)
      .from('download_reports')
      .insert({
        title,
        slug,
        description: description || null,
        category: category || 'General',
        file_name: extensionSafeName,
        file_path: storagePath,
        file_size_bytes: file.size,
        mime_type: 'application/pdf',
        status: status === 'Published' ? 'Published' : 'Draft',
        created_by: user.id
      })
      .select('*')
      .single();

    if (insertError) {
      await admin.storage.from(REPORT_BUCKET).remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ report: { ...inserted, download_count: 0 } });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || 'Failed to upload report') }, { status: 500 });
  }
}
