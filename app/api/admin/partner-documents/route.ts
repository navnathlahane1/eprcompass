/**
 * GET  /api/admin/partner-documents  — list all documents (admin)
 * POST /api/admin/partner-documents  — create a document
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

export async function GET() {
  const actorId = await getAdminUserId();
  if (!actorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = serviceClient();
  const { data, error } = await db
    .from('partner_documents')
    .select('id, name, doc_type, description, url, is_active, sort_order, created_at, created_by')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

export async function POST(req: NextRequest) {
  const actorId = await getAdminUserId();
  if (!actorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, doc_type, description, url, is_active, sort_order } = body;

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: 'name and url are required' }, { status: 400 });
  }

  const db = serviceClient();
  const { data, error } = await db
    .from('partner_documents')
    .insert({
      name: name.trim(),
      doc_type: doc_type || 'Guide',
      description: description?.trim() || null,
      url: url.trim(),
      is_active: is_active !== false,
      sort_order: sort_order ?? 0,
      created_by: actorId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data }, { status: 201 });
}
