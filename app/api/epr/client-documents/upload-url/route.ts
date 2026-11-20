/**
 * POST /api/epr/client-documents/upload-url
 * Returns a signed Supabase Storage upload URL so the client browser can PUT
 * the file directly. The file path is then passed to POST /api/epr/client-documents.
 *
 * Bucket: epr-documents  (must exist in Supabase Storage with RLS disabled;
 *         access is controlled via signed URLs only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { randomUUID } from 'crypto';

const BUCKET = 'epr-documents';
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { file_name, mime_type, category, fy_id } = body;

    if (!file_name || !mime_type || !category || !fy_id) {
      return NextResponse.json({ error: 'file_name, mime_type, category, fy_id are required' }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(mime_type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Sanitize filename: strip path separators to prevent traversal
    const safeName = file_name.replace(/[/\\]/g, '_').slice(0, 200);
    // Path: <client_id>/<fy_id>/<category>/<uuid>_<safeName>
    const objectPath = `${user.id}/${fy_id}/${category}/${randomUUID()}_${safeName}`;

    const db = adminClient();
    const { data, error } = await db.storage
      .from(BUCKET)
      .createSignedUploadUrl(objectPath);

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to generate upload URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, path: objectPath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
