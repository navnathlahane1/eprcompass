/**
 * POST /api/portal/client-contacts/upload-photo
 *
 * Returns a short-lived signed upload URL so the browser can PUT a
 * contact photo directly to Supabase Storage — no file data passes
 * through this API route.
 *
 * Body: { fileName: string, contentType?: string }
 * Response: { signedUrl, storagePath, token }
 *   — save storagePath as contact.photo_url after the upload completes.
 *
 * Auth: client portal user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const dynamic = 'force-dynamic';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();

  // Resolve clientId to scope the storage path
  const { data: clientRow } = await db
    .from('clients')
    .select('id')
    .eq('profile_id', actor.userId)
    .maybeSingle();

  if (!clientRow) return NextResponse.json({ error: 'No client record found' }, { status: 404 });

  const { fileName } = await req.json().catch(() => ({}));
  if (!fileName) return NextResponse.json({ error: 'fileName required' }, { status: 400 });

  const ext  = String(fileName).split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${clientRow.id}/${Date.now()}.${ext}`;

  const { data, error } = await (db as any).storage
    .from('client-contact-photos')
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    signedUrl:   data.signedUrl,
    storagePath: path,
    token:       data.token,
  });
}
