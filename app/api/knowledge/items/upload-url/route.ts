/**
 * POST /api/knowledge/items/upload-url
 * Returns a signed Supabase Storage PUT URL for direct browser upload into the
 * private knowledge-base bucket. Restricted to contributor+ knowledge roles.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { resolveKnowledgeActor, getKnowledgeAdminClient } from '@/lib/knowledge/auth';
import { canContribute } from '@/lib/knowledge/permissions';

const BUCKET = 'knowledge-base';
const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png', 'image/jpeg',
  'video/mp4',
  'application/zip',
];

export async function POST(req: NextRequest) {
  const actor = await resolveKnowledgeActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canContribute(actor.role)) {
    return NextResponse.json({ error: 'You do not have permission to upload' }, { status: 403 });
  }

  const body = await req.json();
  const { file_name, mime_type } = body;

  if (!file_name || !mime_type) {
    return NextResponse.json({ error: 'file_name and mime_type are required' }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(mime_type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Use PDF, Word, PowerPoint, Excel, image, MP4, or ZIP.' },
      { status: 400 }
    );
  }

  // Sanitize filename to prevent path traversal.
  const safeName = String(file_name).replace(/[/\\]/g, '_').slice(0, 200);
  const objectPath = `${actor.id}/${randomUUID()}_${safeName}`;

  const db = getKnowledgeAdminClient();
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(objectPath);
  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to generate upload URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path: objectPath });
}
