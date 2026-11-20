/**
 * GET    /api/finance/invoices/[id]/attachments  — list attachments
 * POST   /api/finance/invoices/[id]/attachments  — upload attachment
 * DELETE /api/finance/invoices/[id]/attachments  — delete attachment (?attachmentId=...)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET       = 'invoice-documents';
const MAX_BYTES    = 20 * 1024 * 1024; // 20MB
const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png':       'png',
  'image/jpeg':      'jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       'xlsx',
};

function safeName(s: string) {
  return String(s).trim().replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();

  const { data, error } = await (db as any)
    .from('invoice_attachments')
    .select('id, file_name, file_path, file_size, mime_type, created_at')
    .eq('invoice_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 });

  if (!ALLOWED[file.type])
    return NextResponse.json({ error: 'Only PDF, PNG, JPG, DOCX, XLSX allowed' }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'File must be under 20MB' }, { status: 400 });

  const storagePath = `${id}/attachments/${Date.now()}-${safeName(file.name)}`;

  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error: dbErr } = await (db as any)
    .from('invoice_attachments')
    .insert({
      invoice_id:  id,
      file_name:   file.name,
      file_path:   storagePath,
      file_size:   file.size,
      mime_type:   file.type,
      uploaded_by: actor.id,
    })
    .select()
    .single();

  if (dbErr) {
    await db.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const attachmentId = req.nextUrl.searchParams.get('attachmentId');
  if (!attachmentId) return NextResponse.json({ error: 'attachmentId required' }, { status: 400 });

  const db = getServiceClient();

  const { data: att } = await (db as any)
    .from('invoice_attachments')
    .select('file_path')
    .eq('id', attachmentId)
    .eq('invoice_id', id)
    .maybeSingle();

  if (!att) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });

  await db.storage.from(BUCKET).remove([att.file_path]).catch(() => {});

  const { error } = await (db as any)
    .from('invoice_attachments')
    .delete()
    .eq('id', attachmentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Signed URL for viewing an attachment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { attachmentId } = await req.json().catch(() => ({}));
  if (!attachmentId) return NextResponse.json({ error: 'attachmentId required' }, { status: 400 });

  const db = getServiceClient();

  const { data: att } = await (db as any)
    .from('invoice_attachments')
    .select('file_path, file_name')
    .eq('id', attachmentId)
    .eq('invoice_id', id)
    .maybeSingle();

  if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(att.file_path, 3600);

  if (error || !data?.signedUrl)
    return NextResponse.json({ error: error?.message || 'Could not generate URL' }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl, file_name: att.file_name });
}
