/**
 * POST /api/shared-documents/upload-url
 * Returns a signed Supabase Storage PUT URL for direct browser upload.
 * Accessible to all authenticated users regardless of role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { randomUUID } from 'crypto';

const BUCKET = 'shared-docs';
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function adminDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { file_name, mime_type } = body;

  if (!file_name || !mime_type) {
    return NextResponse.json({ error: 'file_name and mime_type are required' }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(mime_type)) {
    return NextResponse.json({ error: 'Unsupported file type. Use PDF, JPG, PNG, or Word.' }, { status: 400 });
  }

  // Sanitize filename: prevent path traversal
  const safeName = file_name.replace(/[/\\]/g, '_').slice(0, 200);
  const objectPath = `${user.id}/${randomUUID()}_${safeName}`;

  const db = adminDb();
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(objectPath);
  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to generate upload URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path: objectPath });
}
