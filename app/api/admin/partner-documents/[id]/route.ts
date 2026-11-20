/**
 * PATCH  /api/admin/partner-documents/[id]  — update a document
 * DELETE /api/admin/partner-documents/[id]  — delete a document
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actorId = await getAdminUserId();
  if (!actorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, doc_type, description, url, is_active, sort_order } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined)        updates.name        = name.trim();
  if (doc_type !== undefined)    updates.doc_type    = doc_type;
  if (description !== undefined) updates.description = description?.trim() || null;
  if (url !== undefined)         updates.url         = url.trim();
  if (is_active !== undefined)   updates.is_active   = is_active;
  if (sort_order !== undefined)  updates.sort_order  = sort_order;

  const db = serviceClient();
  const { data, error } = await db
    .from('partner_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actorId = await getAdminUserId();
  if (!actorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = serviceClient();

  // If the URL points to our storage bucket, delete the file too
  const { data: doc } = await db
    .from('partner_documents')
    .select('url')
    .eq('id', id)
    .maybeSingle();

  if (doc?.url) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const storagePrefix = `${supabaseUrl}/storage/v1/object/public/partner-documents/`;
    if (doc.url.startsWith(storagePrefix)) {
      const filePath = doc.url.replace(storagePrefix, '');
      await db.storage.from('partner-documents').remove([filePath]);
    }
  }

  const { error } = await db.from('partner_documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
