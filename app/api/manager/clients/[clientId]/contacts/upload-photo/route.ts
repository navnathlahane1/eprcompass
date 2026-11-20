/**
 * POST /api/manager/clients/[clientId]/contacts/upload-photo
 * Returns a signed upload URL for a contact photo.
 * Body: { fileName: string, contentType: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';

export const dynamic = 'force-dynamic';

function makeServiceClient() { return getAdminClient(); }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await params;
  const { fileName, contentType } = await req.json().catch(() => ({}));

  if (!fileName) return NextResponse.json({ error: 'fileName required' }, { status: 400 });

  const ext  = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${clientId}/${Date.now()}.${ext}`;

  const db = makeServiceClient();
  const { data, error } = await (db as any).storage
    .from('client-contact-photos')
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    signedUrl:  data.signedUrl,
    storagePath: path,           // save this in contact.photo_url after upload
    token:      data.token,
  });
}
