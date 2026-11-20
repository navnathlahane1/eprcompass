/**
 * POST   /api/finance/invoices/[id]/document — upload the invoice file (PDF/image) for a client invoice
 * GET    /api/finance/invoices/[id]/document — get a signed URL to view/download the uploaded invoice
 * DELETE /api/finance/invoices/[id]/document — remove the uploaded invoice file
 *
 * Available to all finance portal roles (cfo, finance_executive, admin).
 * The file is stored in the private `invoice-documents` bucket and its path
 * saved on invoices.pdf_path.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'invoice-documents';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png':       'png',
  'image/jpeg':      'jpg',
};

function safeFileName(input: string) {
  return String(input || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function ensureBucket(db: ReturnType<typeof getServiceClient>) {
  const { data: bucket } = await db.storage.getBucket(BUCKET);
  if (bucket) return;
  await db.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: String(MAX_FILE_BYTES),
    allowedMimeTypes: Object.keys(ALLOWED_TYPES),
  });
}

async function loadInvoice(db: ReturnType<typeof getServiceClient>, id: string) {
  const { data } = await (db as any)
    .from('invoices')
    .select('id, invoice_no, client_id, pdf_path')
    .eq('id', id)
    .maybeSingle();
  return data as { id: string; invoice_no: string; client_id: string; pdf_path: string | null } | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();

  const inv = await loadInvoice(db, id);
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: 'Only PDF, PNG or JPG files are allowed' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
  }

  await ensureBucket(db);

  const storagePath = `${inv.id}/${Date.now()}-${safeFileName(file.name || `${inv.invoice_no}.${ALLOWED_TYPES[file.type]}`)}`;

  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { error: dbErr } = await (db as any)
    .from('invoices')
    .update({ pdf_path: storagePath })
    .eq('id', id);
  if (dbErr) {
    await db.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  // Replace: clean up the previous file after the new one is safely linked
  if (inv.pdf_path && inv.pdf_path !== storagePath) {
    await db.storage.from(BUCKET).remove([inv.pdf_path]).catch(() => {});
  }

  return NextResponse.json({ ok: true, pdf_path: storagePath }, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();

  const inv = await loadInvoice(db, id);
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (!inv.pdf_path) return NextResponse.json({ error: 'No document uploaded for this invoice' }, { status: 404 });

  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(inv.pdf_path, 3600);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || 'Could not generate download link' }, { status: 500 });
  }

  const fileName = inv.pdf_path.split('/').pop() || `${inv.invoice_no}.pdf`;
  return NextResponse.json({ url: data.signedUrl, file_name: fileName });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();

  const inv = await loadInvoice(db, id);
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (!inv.pdf_path) return NextResponse.json({ error: 'No document uploaded for this invoice' }, { status: 404 });

  await db.storage.from(BUCKET).remove([inv.pdf_path]).catch(() => {});

  const { error } = await (db as any)
    .from('invoices')
    .update({ pdf_path: null })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
