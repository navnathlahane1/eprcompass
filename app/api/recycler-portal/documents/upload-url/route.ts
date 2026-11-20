/**
 * POST /api/recycler-portal/documents/upload-url
 * Returns a signed upload URL for Supabase Storage (recycler-docs bucket).
 * Body: { file_name: string; mime_type: string; doc_type: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_BYTES = 20 * 1024 * 1024;

function safeSeg(v: string) {
  return v.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { file_name, mime_type, doc_type } = body;

  if (!file_name || !mime_type || !doc_type) {
    return NextResponse.json({ error: 'file_name, mime_type, and doc_type are required' }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(mime_type)) {
    return NextResponse.json({ error: 'Unsupported file type. Allowed: PDF, JPG, PNG, Word.' }, { status: 400 });
  }

  const path = `${actor.recyclerId}/${safeSeg(doc_type)}/${Date.now()}-${safeSeg(file_name)}`;
  const db = adminClient();

  const { data, error } = await (db as any).storage
    .from('recycler-docs')
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create upload URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path, token: data.token });
}
