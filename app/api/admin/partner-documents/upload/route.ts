/**
 * POST /api/admin/partner-documents/upload
 * Accepts a PDF/doc file, uploads it to the partner-documents storage bucket,
 * and returns the public URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function getAdminUserId() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'manager'].includes(profile?.role || '') && !isSuperAdmin(user.email)) return null;
  return user.id;
}

export async function POST(req: NextRequest) {
  const actorId = await getAdminUserId();
  if (!actorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ALLOWED = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF, Word, and PowerPoint files are allowed' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const slug = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60);
  const filePath = `${Date.now()}_${slug}.${ext}`;

  const db = serviceClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await db.storage
    .from('partner-documents')
    .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage
    .from('partner-documents')
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl, fileName: file.name }, { status: 201 });
}
