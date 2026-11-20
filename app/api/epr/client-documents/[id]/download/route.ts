/**
 * GET /api/epr/client-documents/[id]/download
 * Returns a short-lived signed download URL for a document.
 * Clients may only download their own documents.
 * Admins may download any document.
 * Expiry: 60 seconds (prevents link sharing).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const BUCKET = 'epr-documents';
const SIGNED_URL_EXPIRY_SECONDS = 60;

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await (supabase as any)
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    const isAdminUser = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);

    const db = adminClient();
    const { id } = await params;

    const { data: doc } = await (db as any)
      .from('epr_client_documents')
      .select('client_id, file_path, file_name')
      .eq('id', id)
      .maybeSingle();

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (!isAdminUser && doc.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!doc.file_path) {
      return NextResponse.json({ error: 'File not stored in object storage' }, { status: 404 });
    }

    const { data: signed, error } = await db.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, SIGNED_URL_EXPIRY_SECONDS, {
        download: doc.file_name || true,
      });

    if (error || !signed) {
      return NextResponse.json({ error: error?.message || 'Could not generate download URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl, expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
