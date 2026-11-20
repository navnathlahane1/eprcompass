/**
 * GET /api/epr/client-documents/[id]/versions
 * Returns all upload versions for a document (newest first).
 * Client can only access their own documents; admin can access all.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

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

    // Verify ownership for clients
    if (!isAdminUser) {
      const { data: doc } = await (db as any)
        .from('epr_client_documents')
        .select('client_id')
        .eq('id', id)
        .maybeSingle();
      if (!doc || doc.client_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data, error } = await (db as any)
      .from('epr_document_versions')
      .select(`
        id, version, file_name, file_size, mime_type, change_reason, uploaded_at,
        uploader:profiles!uploaded_by ( full_name )
      `)
      .eq('document_id', id)
      .order('version', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ versions: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
