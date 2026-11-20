/**
 * GET  /api/recycler-portal/documents  — list recycler's own documents
 * POST /api/recycler-portal/documents  — save metadata after file upload
 * DELETE /api/recycler-portal/documents — delete a document
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_documents')
    .select('id, doc_type, file_path, file_name, status, expiry_date, uploaded_at')
    .eq('recycler_id', actor.recyclerId)
    .order('uploaded_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { doc_type, file_path, file_name, expiry_date } = body;

  if (!doc_type || !file_path || !file_name) {
    return NextResponse.json({ error: 'doc_type, file_path, and file_name are required' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_documents')
    .insert({
      recycler_id: actor.recyclerId,
      doc_type,
      file_path,
      file_name,
      expiry_date: expiry_date || null,
      status: 'Pending',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = adminClient();

  // Fetch the doc to get file_path before deleting
  const { data: doc } = await (db as any)
    .from('recycler_documents')
    .select('file_path')
    .eq('id', id)
    .eq('recycler_id', actor.recyclerId)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Delete storage file
  if (doc.file_path) {
    await (db as any).storage.from('recycler-docs').remove([doc.file_path]);
  }

  const { error } = await (db as any)
    .from('recycler_documents')
    .delete()
    .eq('id', id)
    .eq('recycler_id', actor.recyclerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
