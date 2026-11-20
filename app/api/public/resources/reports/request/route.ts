import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const REPORT_BUCKET = 'resource-reports';
const LINK_EXPIRY_SECONDS = 60 * 3;

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

function getClientIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || '';
  return xf.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
}

function isEmail(value: string | null | undefined) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isLikelyPhone(value: string | null | undefined) {
  if (!value) return false;
  return /^\+?[0-9\s()-]{10,15}$/.test(String(value).trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const reportId = String(body?.reportId || '').trim();
    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim();
    const phone = String(body?.phone || '').trim();
    const company = String(body?.company || '').trim();
    const designation = String(body?.designation || '').trim();
    const purpose = String(body?.purpose || '').trim();

    if (!reportId) {
      return NextResponse.json({ error: 'Report id is required' }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!isLikelyPhone(phone)) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: report, error: reportError } = await (admin as any)
      .from('download_reports')
      .select('id, title, file_name, file_path, status')
      .eq('id', reportId)
      .eq('status', 'Published')
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { error: insertError } = await (admin as any)
      .from('download_report_events')
      .insert({
        report_id: report.id,
        full_name: fullName,
        email,
        phone,
        company: company || null,
        designation: designation || null,
        purpose: purpose || null,
        ip_address: getClientIp(request),
        user_agent: request.headers.get('user-agent') || null
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { data: signed, error: signedError } = await admin.storage
      .from(REPORT_BUCKET)
      .createSignedUrl(String(report.file_path), LINK_EXPIRY_SECONDS, {
        download: String(report.file_name || `${report.title}.pdf`)
      });

    if (signedError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: signedError?.message || 'Failed to generate download link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        title: report.title,
        file_name: report.file_name
      },
      downloadUrl: signed.signedUrl
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: String(error?.message || 'Failed to prepare download') },
      { status: 500 }
    );
  }
}
